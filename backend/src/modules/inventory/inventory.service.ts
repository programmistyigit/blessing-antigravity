import mongoose, { Types } from 'mongoose';
import { InventoryItem, InventoryHistory, IInventoryItem, InventoryCategory, InventoryChangeType, IInventoryHistory, InventoryType } from './inventory.model';
import { InventoryAlert, InventoryAlertSeverity, IInventoryAlert } from './inventory-alert.model';
import { emitInventoryItemCreated, emitInventoryItemUpdated, emitInventoryItemRemoved, emitInventoryLowStock } from '../../realtime/events';

interface CreateItemData {
    name: string;
    category: InventoryCategory;
    quantity: number;
    unit: string;
    minThreshold: number;
    maxThreshold?: number;
    inventoryType?: InventoryType;
    alertEnabled?: boolean;
    createdBy: string;
}

interface UpdateItemData {
    quantityChange: number;
    changeType: InventoryChangeType;
    reason?: string;
    updatedBy: string;

    name?: string;
    category?: InventoryCategory;
    unit?: string;
    minThreshold?: number;
    maxThreshold?: number;
}

export class InventoryService {
    static async createItem(data: CreateItemData): Promise<IInventoryItem> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const item = new InventoryItem({
                name: data.name,
                category: data.category,
                quantity: data.quantity,
                unit: data.unit,
                minThreshold: data.minThreshold,
                maxThreshold: data.maxThreshold,
                inventoryType: data.inventoryType,
                alertEnabled: data.alertEnabled,
                lastUpdatedBy: data.createdBy,
            });

            await item.save({ session });

            // Initial history entry if quantity > 0
            if (data.quantity > 0) {
                await InventoryHistory.create([{
                    itemId: item._id,
                    changeType: InventoryChangeType.ADD,
                    quantityChanged: data.quantity,
                    previousQuantity: 0,
                    newQuantity: data.quantity,
                    reason: 'Initial creation',
                    createdBy: data.createdBy,
                }], { session });
            }

            await session.commitTransaction();

            // Emit event (outside transaction)
            emitInventoryItemCreated(item); // Should strip mongoose internals or pass toJSON? Helper usually handles it if simple object.

            return item;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    static async updateItem(id: string, data: UpdateItemData): Promise<IInventoryItem> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const item = await InventoryItem.findById(id).session(session);
            if (!item) {
                throw new Error('Inventory item not found');
            }
            if (!item.isActive) {
                throw new Error('Inventory item is not active');
            }

            const previousQuantity = item.quantity;
            let newQuantity = previousQuantity + data.quantityChange;

            if (newQuantity < 0) {
                throw new Error(`Insufficient quantity. Current: ${previousQuantity}, Requested reduction: ${Math.abs(data.quantityChange)}`);
            }

            // Update item properties
            if (data.name) item.name = data.name;
            if (data.category) item.category = data.category;
            if (data.unit) item.unit = data.unit;
            if (data.minThreshold !== undefined) item.minThreshold = data.minThreshold;
            if (data.maxThreshold !== undefined) item.maxThreshold = data.maxThreshold;

            item.quantity = newQuantity;
            item.lastUpdatedBy = new Types.ObjectId(data.updatedBy);
            item.lastUpdatedAt = new Date();

            await item.save({ session });

            // Log history if quantity changed or just adjustment
            // Even if quantity change is 0, we might want to log if it was an "ADJUST" type?
            // But usually history tracks quantity changes. Protocol says "barcha o‘zgarishlar avtomatik tarixga yoziladi".
            // If only properties changed (name etc), do we log to history?
            // "InventoryHistory: quantityChanged: number". This implies history is primarily for stock flow.
            // If quantity didn't change, we effectively have quantityChanged = 0.

            // Let's always create history if quantity involved or explicit action.
            if (data.quantityChange !== 0 || data.changeType === InventoryChangeType.ADJUST) {
                await InventoryHistory.create([{
                    itemId: item._id,
                    changeType: data.changeType,
                    quantityChanged: data.quantityChange,
                    previousQuantity,
                    newQuantity,
                    reason: data.reason || 'Update',
                    createdBy: data.updatedBy,
                }], { session });
            }

            await session.commitTransaction();

            // Realtime checks
            emitInventoryItemUpdated(item);

            // Threshold Alerts
            await InventoryService.checkThresholdAndAlert(item, session);

            return item;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    static async getItemById(id: string): Promise<IInventoryItem | null> {
        return InventoryItem.findById(id).where({ isActive: true });
    }

    static async getAllItems(filter: any = {}): Promise<IInventoryItem[]> {
        return InventoryItem.find({ ...filter, isActive: true }).sort({ name: 1 });
    }

    static async deleteItem(id: string, userId: string): Promise<void> {
        // Soft delete
        const item = await InventoryItem.findById(id);
        if (!item) {
            throw new Error('Inventory item not found');
        }

        item.isActive = false;
        item.lastUpdatedBy = new Types.ObjectId(userId);
        item.lastUpdatedAt = new Date();
        await item.save();

        emitInventoryItemRemoved({
            id: item._id, name: item.name
        });
    }

    static async getHistory(itemId: string): Promise<IInventoryHistory[]> {
        return InventoryHistory.find({ itemId })
            .sort({ createdAt: -1 })
            .populate('createdBy', 'fullName username');
    }

    static async getAlerts(filter: any = {}): Promise<IInventoryAlert[]> {
        const query: any = {};

        if (filter.inventoryType) query.inventoryType = filter.inventoryType;
        if (filter.severity) query.severity = filter.severity;
        if (filter.sectionId) query.sectionId = filter.sectionId;
        if (filter.isResolved !== undefined) query.isResolved = filter.isResolved === 'true' || filter.isResolved === true;

        return InventoryAlert.find(query)
            .populate('inventoryItemId', 'name unit')
            .sort({ createdAt: -1 });
    }

    static async resolveAlert(alertId: string, _userId: string): Promise<IInventoryAlert> {
        const alert = await InventoryAlert.findById(alertId);
        if (!alert) {
            throw new Error('Alert not found');
        }

        if (alert.isResolved) {
            return alert;
        }

        alert.isResolved = true;
        alert.resolvedAt = new Date();
        await alert.save();

        // Emit resolution event
        // Using "resolve" logic via low stock event updates
        emitInventoryLowStock({
            inventoryItemId: alert.inventoryItemId,
            inventoryType: alert.inventoryType,
            severity: InventoryAlertSeverity.INFO,
            quantity: alert.quantity,
            threshold: alert.threshold,
            sectionId: alert.sectionId ? alert.sectionId.toString() : null,
            timestamp: new Date().toISOString(),
            isResolved: true
        });

        return alert;
    }

    /**
     * Check min threshold and manage alerts
     */
    private static async checkThresholdAndAlert(item: IInventoryItem, session: mongoose.ClientSession): Promise<void> {
        // Ignored categories
        if (item.category === InventoryCategory.WATER || item.category === InventoryCategory.ELECTRICITY) {
            return;
        }

        if (!item.alertEnabled || item.minThreshold <= 0) {
            return;
        }

        const isLowStock = item.quantity < item.minThreshold;

        // Find existing unresolved alert
        const existingAlert = await InventoryAlert.findOne({
            inventoryItemId: item._id,
            isResolved: false,
        }).session(session);

        if (isLowStock) {
            // Determine severity
            let severity = InventoryAlertSeverity.WARNING;
            if (item.inventoryType === InventoryType.FARM) {
                severity = InventoryAlertSeverity.CRITICAL;
            } else if (item.inventoryType === InventoryType.KITCHEN) {
                severity = InventoryAlertSeverity.WARNING;
            }

            if (!existingAlert) {
                // Create new alert
                await InventoryAlert.create([{
                    inventoryItemId: item._id,
                    inventoryType: item.inventoryType,
                    // sectionId? InventoryItem doesn't seem to have sectionId directly, 
                    // but often inventory is global or linked via other means. 
                    // Requirements say "sectionId?". Inspecting InventoryItem, it doesn't have sectionId.
                    // Assuming global inventory for now or we might need to look it up if context provided.
                    // For now, leave sectionId undefined as it's optional in model.
                    severity: severity,
                    quantity: item.quantity,
                    threshold: item.minThreshold,
                    isResolved: false,
                    createdAt: new Date()
                }], { session });

                // Emit event
                emitInventoryLowStock({
                    inventoryItemId: item._id,
                    inventoryType: item.inventoryType,
                    severity: severity,
                    quantity: item.quantity,
                    threshold: item.minThreshold,
                    sectionId: null, // item doesn't have sectionId
                    timestamp: new Date().toISOString()
                });
            } else {
                // Update existing alert quantity
                existingAlert.quantity = item.quantity;
                existingAlert.severity = severity; // potential severity upgrade?
                await existingAlert.save({ session });

                // Re-emit? Usually updates are good to emit too if severity changes or just to notify continued low stock?
                // Prompt: "Low-stock tekshiruvi har doim quyidagi joylarda ishlasin... agar past bo‘lsa → alert yaratiladi yoki yangilanadi"
                // "WebSocket Event: Alert yaratilganda yoki resolve bo‘lganda" -> Updates not explicitly mentioned for WS, but good practice.
                // Let's emit update.
                emitInventoryLowStock({
                    inventoryItemId: item._id,
                    inventoryType: item.inventoryType,
                    severity: severity,
                    quantity: item.quantity,
                    threshold: item.minThreshold,
                    sectionId: null,
                    timestamp: new Date().toISOString()
                });
            }
        } else {
            // Not low stock (anymore)
            if (existingAlert) {
                // Resolve it
                existingAlert.isResolved = true;
                existingAlert.resolvedAt = new Date();
                await existingAlert.save({ session });

                // Emit resolved event (same event type, just maybe added Resolved field or just update via same channel?)
                // Prompt: "Resolve bo'lganda ... Payload: ..." - Payload structure doesn't seem to have "isResolved" field but has severity etc.
                // Maybe "severity" becomes INFO? Or we just assume the consumer sees quantity > threshold.
                // Or maybe we should send similar payload.
                // Let's send the last state but effectively it signals resolution if we could flag it.
                // Let's add isResolved to payload if possible, or just send it.
                // Wait, requirements say: "Payload: ... severity ... quantity ... threshold". It doesn't explicitly say "status: RESOLVED".
                // But it says "Alert yaratilganda yoki resolve bo‘lganda: WebSocket Event: INVENTORY_LOW_STOCK".
                // I'll emit the event with updated quantity (which is now > threshold). The frontend can deduce resolution, 
                // OR I should probably add `isResolved: true` to the payload just to be clear, even if not in the minimal example payload.

                emitInventoryLowStock({
                    inventoryItemId: item._id,
                    inventoryType: item.inventoryType,
                    severity: InventoryAlertSeverity.INFO, // Resolved usually means info/ok
                    quantity: item.quantity,
                    threshold: item.minThreshold,
                    sectionId: null,
                    timestamp: new Date().toISOString(),
                    isResolved: true
                });
            }
        }
    }
}
