import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../src/core/database';
import { initializeDatabase } from '../../src/utils/init.util';

// Models
import { Period, PeriodStatus } from '../../src/modules/periods/period.model';
import { User } from '../../src/modules/users/user.model';

// Services
import { PeriodService } from '../../src/modules/periods/period.service';

describe('Period (Davr) E2E Tests', () => {
    let directorUserId: string;
    let testPeriodIds: string[] = [];

    beforeAll(async () => {
        // Connect DB
        await connectDatabase();
        await initializeDatabase();

        // Get director user for createdBy field
        const director = await User.findOne({ username: 'director' });
        if (director) {
            directorUserId = director._id.toString();
        }
    });

    afterAll(async () => {
        // Cleanup test data
        for (const id of testPeriodIds) {
            await Period.findByIdAndDelete(id);
        }

        await disconnectDatabase();
    });

    // =========================================
    // BASIC CRUD TESTS
    // =========================================

    it('Test 1: Davr yaratish ishlaydi', async () => {
        const period = await PeriodService.createPeriod({
            name: 'Test Period 1',
            startDate: new Date(),
            notes: 'Test notes',
            createdBy: directorUserId,
        });

        testPeriodIds.push(period._id.toString());

        expect(period).toBeDefined();
        expect(period.name).toBe('Test Period 1');
        expect(period.status).toBe(PeriodStatus.ACTIVE);
        expect(period.endDate).toBeNull();
    });

    it('Test 2: Bir nechta ACTIVE davr yaratish mumkin', async () => {
        // Create second ACTIVE period
        const period2 = await PeriodService.createPeriod({
            name: 'Test Period 2',
            startDate: new Date(),
            createdBy: directorUserId,
        });

        testPeriodIds.push(period2._id.toString());

        // Create third ACTIVE period
        const period3 = await PeriodService.createPeriod({
            name: 'Test Period 3',
            startDate: new Date(),
            createdBy: directorUserId,
        });

        testPeriodIds.push(period3._id.toString());

        // All should be ACTIVE - verify by fetching
        const fetchedPeriod2 = await PeriodService.getPeriodById(period2._id.toString());
        const fetchedPeriod3 = await PeriodService.getPeriodById(period3._id.toString());

        expect(fetchedPeriod2?.status).toBe(PeriodStatus.ACTIVE);
        expect(fetchedPeriod3?.status).toBe(PeriodStatus.ACTIVE);

        // Verify we created at least 3 test periods total (from Test 1 and Test 2)
        expect(testPeriodIds.length).toBeGreaterThanOrEqual(3);
    });

    // =========================================
    // CLOSE PERIOD TESTS
    // =========================================

    it('Test 3: Davr yopilganda status CLOSED bo\'ladi', async () => {
        // Create a period to close
        const period = await PeriodService.createPeriod({
            name: 'Period to Close',
            startDate: new Date(),
            createdBy: directorUserId,
        });

        testPeriodIds.push(period._id.toString());

        // Close it
        const closedPeriod = await PeriodService.closePeriod(period._id.toString());

        expect(closedPeriod.status).toBe(PeriodStatus.CLOSED);
    });

    it('Test 4: Davr yopilganda endDate avtomatik qo\'yiladi', async () => {
        // Create and close a period
        const period = await PeriodService.createPeriod({
            name: 'Period with EndDate',
            startDate: new Date(),
            createdBy: directorUserId,
        });

        testPeriodIds.push(period._id.toString());

        const closedPeriod = await PeriodService.closePeriod(period._id.toString());

        expect(closedPeriod.endDate).toBeDefined();
        expect(closedPeriod.endDate).not.toBeNull();
    });

    it('Test 5: Yopilgan davrni qayta yopib bo\'lmaydi', async () => {
        // Create and close a period
        const period = await PeriodService.createPeriod({
            name: 'Already Closed Period',
            startDate: new Date(),
            createdBy: directorUserId,
        });

        testPeriodIds.push(period._id.toString());

        await PeriodService.closePeriod(period._id.toString());

        // Try to close again - should throw
        await expect(
            PeriodService.closePeriod(period._id.toString())
        ).rejects.toThrow('Period is already closed');
    });

    // =========================================
    // UPDATE TESTS
    // =========================================

    it('Test 6: ACTIVE davr tahrirlash mumkin', async () => {
        const period = await PeriodService.createPeriod({
            name: 'Editable Period',
            startDate: new Date(),
            createdBy: directorUserId,
        });

        testPeriodIds.push(period._id.toString());

        const updated = await PeriodService.updatePeriod(period._id.toString(), {
            name: 'Updated Period Name',
            notes: 'Updated notes',
        });

        expect(updated.name).toBe('Updated Period Name');
        expect(updated.notes).toBe('Updated notes');
    });

    it('Test 7: CLOSED davr tahrirlash mumkin emas', async () => {
        const period = await PeriodService.createPeriod({
            name: 'Cannot Edit After Close',
            startDate: new Date(),
            createdBy: directorUserId,
        });

        testPeriodIds.push(period._id.toString());

        // Close it
        await PeriodService.closePeriod(period._id.toString());

        // Try to update - should throw
        await expect(
            PeriodService.updatePeriod(period._id.toString(), {
                name: 'New Name',
            })
        ).rejects.toThrow('Cannot update a CLOSED period');
    });

    // =========================================
    // ERROR HANDLING TESTS
    // =========================================

    it('Test 8: Non-existent period throws error', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();

        await expect(
            PeriodService.closePeriod(fakeId)
        ).rejects.toThrow('Period not found');
    });
});
