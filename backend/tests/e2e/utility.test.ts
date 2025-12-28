import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../src/core/database';
import { initializeDatabase } from '../../src/utils/init.util';
import { UtilityCost, UtilityType } from '../../src/modules/utility/utility.model';
import { UtilityService } from '../../src/modules/utility/utility.service';
import { PeriodExpense, ExpenseCategory } from '../../src/modules/periods/period-expense.model';
import { User } from '../../src/modules/users/user.model';
import { Role } from '../../src/modules/roles/role.model';
import { Period } from '../../src/modules/periods/period.model';
import { socketManager } from '../../src/realtime/socket';

// Mock socket manager
vi.mock('../../src/realtime/socket', () => ({
    socketManager: {
        broadcastToChannel: vi.fn(),
        sendToUser: vi.fn(),
    }
}));

describe('Utility Cost E2E Tests', () => {
    let testUser: any;
    let testPeriod: any;

    beforeAll(async () => {
        // Mock session
        const originalStartSession = mongoose.startSession.bind(mongoose);
        vi.spyOn(mongoose, 'startSession').mockImplementation(async (options) => {
            const session = await originalStartSession(options);
            session.startTransaction = vi.fn();
            session.commitTransaction = vi.fn();
            session.abortTransaction = vi.fn();
            return session;
        });

        await connectDatabase();
        await initializeDatabase();

        // Get or create test user
        const directorRole = await Role.findOne({ name: 'Director' });
        testUser = await User.findOne({ role: directorRole?._id });
        if (!testUser) {
            testUser = await User.create({
                username: 'utility_tester',
                passwordHash: 'hash',
                fullName: 'Utility Tester',
                role: directorRole?._id,
                isActive: true
            });
        }

        // Get or create test period
        testPeriod = await Period.findOne({ status: 'ACTIVE' });
        if (!testPeriod) {
            testPeriod = await Period.create({
                name: 'Utility Test Period',
                startDate: new Date(),
                status: 'ACTIVE',
                createdBy: testUser._id,
            });
        }
    });

    afterAll(async () => {
        await disconnectDatabase();
    });

    it('Test 1: Water cost creates PeriodExpense(WATER)', async () => {
        const amount = 150000;
        const quantity = 500; // liters

        const cost = await UtilityService.recordCost({
            type: UtilityType.WATER,
            periodId: testPeriod._id.toString(),
            amount,
            quantity,
            createdBy: testUser._id.toString(),
        });

        expect(cost).toBeDefined();
        expect(cost.type).toBe(UtilityType.WATER);
        expect(cost.amount).toBe(amount);
        expect(cost.expenseId).toBeDefined();

        // Check PeriodExpense was created
        const expense = await PeriodExpense.findById(cost.expenseId);
        expect(expense).toBeDefined();
        expect(expense?.category).toBe(ExpenseCategory.WATER);
        expect(expense?.amount).toBe(amount);
    });

    it('Test 2: Electricity cost creates PeriodExpense(ELECTRICITY)', async () => {
        const amount = 500000;
        const quantity = 200; // kWh

        const cost = await UtilityService.recordCost({
            type: UtilityType.ELECTRICITY,
            periodId: testPeriod._id.toString(),
            amount,
            quantity,
            createdBy: testUser._id.toString(),
        });

        expect(cost).toBeDefined();
        expect(cost.type).toBe(UtilityType.ELECTRICITY);
        expect(cost.amount).toBe(amount);
        expect(cost.expenseId).toBeDefined();

        // Check PeriodExpense was created
        const expense = await PeriodExpense.findById(cost.expenseId);
        expect(expense).toBeDefined();
        expect(expense?.category).toBe(ExpenseCategory.ELECTRICITY);
    });

    it('Test 3: Period utility summary aggregates correctly', async () => {
        const summary = await UtilityService.getPeriodUtilitySummary(testPeriod._id.toString());

        expect(summary.water.totalAmount).toBeGreaterThanOrEqual(150000);
        expect(summary.electricity.totalAmount).toBeGreaterThanOrEqual(500000);
    });
});
