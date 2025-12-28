import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../src/core/database';
import { initializeDatabase } from '../../src/utils/init.util';
import { FeedDelivery } from '../../src/modules/feed/feed.model';
import { FeedService } from '../../src/modules/feed/feed.service';
import { PeriodExpense, ExpenseCategory } from '../../src/modules/periods/period-expense.model';
import { User } from '../../src/modules/users/user.model';
import { Role } from '../../src/modules/roles/role.model';
import { Section } from '../../src/modules/sections/section.model';
import { Period } from '../../src/modules/periods/period.model';
import { socketManager } from '../../src/realtime/socket';

// Mock socket manager
vi.mock('../../src/realtime/socket', () => ({
    socketManager: {
        broadcastToChannel: vi.fn(),
        sendToUser: vi.fn(),
    }
}));

describe('Feed Delivery E2E Tests', () => {
    let testUser: any;
    let testSection: any;
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
                username: 'feed_tester',
                passwordHash: 'hash',
                fullName: 'Feed Tester',
                role: directorRole?._id,
                isActive: true
            });
        }

        // Get or create test period
        testPeriod = await Period.findOne({ status: 'ACTIVE' });
        if (!testPeriod) {
            testPeriod = await Period.create({
                name: 'Feed Test Period',
                startDate: new Date(),
                status: 'ACTIVE',
                createdBy: testUser._id,
            });
        }

        // Get or create test section with active period
        testSection = await Section.findOne({ activePeriodId: testPeriod._id });
        if (!testSection) {
            testSection = await Section.create({
                name: `Feed Test Section ${Date.now()}`,
                capacity: 1000,
                status: 'ACTIVE',
                activePeriodId: testPeriod._id,
                createdBy: testUser._id,
            });
        }
    });

    afterAll(async () => {
        await disconnectDatabase();
    });

    it('Test 1: Feed delivery creates PeriodExpense(FEED)', async () => {
        const quantityKg = 500;
        const pricePerKg = 8000;
        const expectedTotal = quantityKg * pricePerKg;

        const delivery = await FeedService.recordDelivery({
            sectionId: testSection._id.toString(),
            quantityKg,
            pricePerKg,
            deliveredBy: testUser._id.toString(),
        });

        expect(delivery).toBeDefined();
        expect(delivery.quantityKg).toBe(quantityKg);
        expect(delivery.pricePerKg).toBe(pricePerKg);
        expect(delivery.totalCost).toBe(expectedTotal);
        expect(delivery.expenseId).toBeDefined();

        // Check PeriodExpense was created
        const expense = await PeriodExpense.findById(delivery.expenseId);
        expect(expense).toBeDefined();
        expect(expense?.category).toBe(ExpenseCategory.FEED);
        expect(expense?.amount).toBe(expectedTotal);
    });

    it('Test 2: Section summary aggregates correctly', async () => {
        const summary = await FeedService.getSectionFeedSummary(
            testSection._id.toString(),
            testPeriod._id.toString()
        );

        expect(summary.totalKg).toBeGreaterThanOrEqual(500);
        expect(summary.totalCost).toBeGreaterThanOrEqual(4000000);
        expect(summary.deliveryCount).toBeGreaterThanOrEqual(1);
    });

    it('Test 3: WebSocket event is emitted', async () => {
        await FeedService.recordDelivery({
            sectionId: testSection._id.toString(),
            quantityKg: 100,
            pricePerKg: 8000,
            deliveredBy: testUser._id.toString(),
        });

        expect(socketManager.broadcastToChannel).toHaveBeenCalled();
    });
});
