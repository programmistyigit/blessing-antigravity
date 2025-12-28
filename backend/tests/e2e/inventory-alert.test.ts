import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../src/core/database';
import { initializeDatabase } from '../../src/utils/init.util';
import { InventoryItem, InventoryCategory, InventoryType, InventoryChangeType } from '../../src/modules/inventory/inventory.model';
import { InventoryAlert, InventoryAlertSeverity } from '../../src/modules/inventory/inventory-alert.model';
import { InventoryService } from '../../src/modules/inventory/inventory.service';
import { User } from '../../src/modules/users/user.model';
import { Role } from '../../src/modules/roles/role.model';
import { RealtimeEvent } from '../../src/realtime/events';
import { socketManager } from '../../src/realtime/socket';

// Mock socket manager
vi.mock('../../src/realtime/socket', () => ({
    socketManager: {
        broadcastToChannel: vi.fn(),
        sendToUser: vi.fn(),
    }
}));

describe('Inventory Alert E2E Tests', () => {
    let directorUser: any;

    beforeAll(async () => {
        // Mock session: Create real session but stub transaction methods
        const originalStartSession = mongoose.startSession.bind(mongoose);
        vi.spyOn(mongoose, 'startSession').mockImplementation(async (options) => {
            const session = await originalStartSession(options);
            session.startTransaction = vi.fn();
            session.commitTransaction = vi.fn();
            session.abortTransaction = vi.fn();
            // We should let endSession run or stub it? 
            // If we stub endSession, we must ensure it doesn't cause leaks or issues.
            // But usually safe to leave original endSession if we didn't start real transaction.
            // However, verify if endSession tries to abort active transaction?
            // Since we mocked startTransaction, no real transaction is active.
            return session;
        });

        await connectDatabase();
        await initializeDatabase();

        // Create user with necessary permissions
        const directorRole = await Role.findOne({ name: 'Director' });
        directorUser = await User.findOne({ role: directorRole?._id });
        if (!directorUser) {
            // Fallback create if not found
            directorUser = await User.create({
                username: 'alert_inspector',
                passwordHash: 'hash',
                fullName: 'Alert Inspector',
                role: directorRole?._id,
                isActive: true
            });
        }
    });

    afterAll(async () => {
        await disconnectDatabase();
    });

    it('Test 1: Creates CRITICAL alert for FARM inventory low stock', async () => {
        // Create FARM item
        const farmItem = await InventoryService.createItem({
            name: 'Farm Feed X',
            category: InventoryCategory.FEED,
            quantity: 1000,
            unit: 'kg',
            minThreshold: 200,
            createdBy: directorUser._id.toString()
        });

        // Update item to drop below threshold
        await InventoryService.updateItem(farmItem._id.toString(), {
            quantityChange: -850,
            changeType: InventoryChangeType.CONSUME,
            updatedBy: directorUser._id.toString()
        });

        // Check Alert
        const alert = await InventoryAlert.findOne({
            inventoryItemId: farmItem._id,
            isResolved: false
        });

        expect(alert).toBeDefined();
        expect(alert?.severity).toBe(InventoryAlertSeverity.CRITICAL);
        expect(alert?.quantity).toBe(150);
        expect(alert?.inventoryType).toBe(InventoryType.FARM);

        // Check WebSocket
        expect(socketManager.broadcastToChannel).toHaveBeenCalledWith(
            expect.any(String),
            RealtimeEvent.INVENTORY_LOW_STOCK,
            expect.objectContaining({
                inventoryItemId: farmItem._id,
                severity: InventoryAlertSeverity.CRITICAL,
                quantity: 150
            })
        );
    });

    it('Test 2: Creates WARNING alert for KITCHEN inventory low stock', async () => {
        const kitchenItem = await InventoryService.createItem({
            name: 'Kitchen Oil',
            category: InventoryCategory.OTHER,
            quantity: 50,
            unit: 'liters',
            minThreshold: 10,
            inventoryType: InventoryType.KITCHEN,
            createdBy: directorUser._id.toString()
        });

        // Drop below threshold
        await InventoryService.updateItem(kitchenItem._id.toString(), {
            quantityChange: -45, // 50 - 45 = 5 < 10
            changeType: InventoryChangeType.CONSUME,
            updatedBy: directorUser._id.toString()
        });

        const alert = await InventoryAlert.findOne({
            inventoryItemId: kitchenItem._id,
            isResolved: false
        });

        expect(alert).toBeDefined();
        expect(alert?.severity).toBe(InventoryAlertSeverity.WARNING);
        expect(alert?.quantity).toBe(5);
    });

    it('Test 3: Does not duplicate alert, updates existing one', async () => {
        const item = await InventoryItem.create({
            name: 'Duplicate Test Item',
            category: InventoryCategory.OTHER,
            quantity: 100,
            unit: 'kg',
            minThreshold: 50,
            inventoryType: InventoryType.FARM,
            lastUpdatedBy: directorUser._id
        });

        // First drop
        await InventoryService.updateItem(item._id.toString(), {
            quantityChange: -60, // 100 - 60 = 40 < 50
            changeType: InventoryChangeType.CONSUME,
            updatedBy: directorUser._id.toString()
        });

        const alertsBefore = await InventoryAlert.find({ inventoryItemId: item._id });
        expect(alertsBefore.length).toBe(1);
        expect(alertsBefore[0].quantity).toBe(40);

        // Second drop (still low)
        await InventoryService.updateItem(item._id.toString(), {
            quantityChange: -10, // 40 - 10 = 30 < 50
            changeType: InventoryChangeType.CONSUME,
            updatedBy: directorUser._id.toString()
        });

        const alertsAfter = await InventoryAlert.find({ inventoryItemId: item._id });
        expect(alertsAfter.length).toBe(1); // Still 1
        expect(alertsAfter[0].quantity).toBe(30); // Updated quantity
    });

    it('Test 4: Auto-resolves alert when quantity recovered', async () => {
        const item = await InventoryItem.create({
            name: 'Recovery Test Item',
            category: InventoryCategory.OTHER,
            quantity: 10,
            unit: 'kg',
            minThreshold: 20,
            inventoryType: InventoryType.FARM,
            lastUpdatedBy: directorUser._id
        });

        // Trigger alert via update
        await InventoryService.updateItem(item._id.toString(), {
            quantityChange: 0,
            changeType: InventoryChangeType.CONSUME,
            updatedBy: directorUser._id.toString()
        });

        let alert = await InventoryAlert.findOne({ inventoryItemId: item._id, isResolved: false });
        expect(alert).toBeDefined();

        // Recover quantity
        await InventoryService.updateItem(item._id.toString(), {
            quantityChange: 20, // 10 + 20 = 30 > 20
            changeType: InventoryChangeType.ADD,
            updatedBy: directorUser._id.toString()
        });

        alert = await InventoryAlert.findOne({ inventoryItemId: item._id });
        expect(alert?.isResolved).toBe(true);
        expect(alert?.resolvedAt).toBeDefined();
    });
});
