import mongoose, { Types } from 'mongoose';
import { InventoryItem, InventoryHistory, IInventoryItem, InventoryCategory, InventoryChangeType, IInventoryHistory } from './inventory.model';
import { emitInventoryItemCreated, emitInventoryItemUpdated, emitInventoryItemRemoved, emitInventoryThresholdAlert, RealtimeEvent } from '../../realtime/events';

interface CreateItemData {
    name: string;
    category: InventoryCategory;
    quantity: number;
    unit: string;
    minThreshold: number;
    maxThreshold?: number;
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
            if (item.minThreshold > 0 && newQuantity <= item.minThreshold) {
                emitInventoryThresholdAlert(RealtimeEvent.INVENTORY_ALERT_MIN_THRESHOLD, {
                    id: item._id,
                    name: item.name,
                    quantity: newQuantity,
                    minThreshold: item.minThreshold,
                    message: `⚠️ Low Stock Alert: ${item.name} is at ${newQuantity} ${item.unit}`,
                    severity: 'warning'
                });
            }

            if (item.maxThreshold && item.maxThreshold > 0 && newQuantity >= item.maxThreshold) {
                emitInventoryThresholdAlert(RealtimeEvent.INVENTORY_ALERT_MAX_THRESHOLD, {
                    id: item._id,
                    name: item.name,
                    quantity: newQuantity,
                    maxThreshold: item.maxThreshold,
                    message: `ℹ️ Max Stock Alert: ${item.name} is at ${newQuantity} ${item.unit}`,
                    severity: 'info'
                });
            }

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

        emitInventoryItemRemoved({ id: item._id, name: item.name });
    }

    static async getHistory(itemId: string): Promise<IInventoryHistory[]> {
        return InventoryHistory.find({ itemId })
            .sort({ createdAt: -1 })
            .populate('createdBy', 'fullName username');
    }
}
