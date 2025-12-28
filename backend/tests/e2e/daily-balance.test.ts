import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../src/core/database';
import { initializeDatabase } from '../../src/utils/init.util';

// Models
import { DailyBalance } from '../../src/modules/sections/daily-balance.model';
import { Batch, BatchStatus } from '../../src/modules/sections/batch.model';
import { Section, SectionStatus } from '../../src/modules/sections/section.model';
import { User } from '../../src/modules/users/user.model';
import { Role } from '../../src/modules/roles/role.model';

// Services
import { DailyBalanceService } from '../../src/modules/sections/daily-balance.service';

describe('Daily Balance (Ostatok) E2E Tests', () => {
    let testSectionId: string;
    let testBatchId: string;
    let directorUserId: string;

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
        if (testBatchId) {
            await DailyBalance.deleteMany({ batchId: testBatchId });
            await Batch.findByIdAndDelete(testBatchId);
        }
        if (testSectionId) {
            await Section.findByIdAndDelete(testSectionId);
        }

        await disconnectDatabase();
    });

    it('Test 1: Batch yaratilganda startChickCount to\'g\'ri saqlanadi', async () => {
        // Create section directly
        const section = new Section({
            name: 'DailyBalance Test Section ' + Date.now(),
            status: SectionStatus.EMPTY,
            createdBy: directorUserId,
        });
        await section.save();
        testSectionId = section._id.toString();

        // Create batch with 10000 chicks
        const batch = new Batch({
            sectionId: testSectionId,
            startedAt: new Date(),
            expectedEndAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            totalChicksIn: 10000,
            totalChicksOut: 0,
            status: BatchStatus.ACTIVE,
            createdBy: directorUserId,
        });
        await batch.save();
        testBatchId = batch._id.toString();

        // Update section to ACTIVE
        section.status = SectionStatus.ACTIVE;
        section.activeBatchId = batch._id;
        await section.save();

        // Create first day balance
        await DailyBalanceService.getOrCreateForDate(testBatchId, batch.startedAt);

        // Verify batch has correct totalChicksIn
        const savedBatch = await Batch.findById(testBatchId);
        expect(savedBatch).toBeDefined();
        expect(savedBatch!.totalChicksIn).toBe(10000);
    });

    it('Test 2: 1-kun DailyBalance avtomatik yaratiladi', async () => {
        // Get the first day balance
        const balances = await DailyBalanceService.getBalancesByBatchId(testBatchId);

        expect(balances.length).toBeGreaterThanOrEqual(1);

        const firstDayBalance = balances[0];
        expect(firstDayBalance.startOfDayChicks).toBe(10000);
        expect(firstDayBalance.deaths).toBe(0);
        expect(firstDayBalance.chickOut).toBe(0);
        expect(firstDayBalance.endOfDayChicks).toBe(10000);
    });

    it('Test 3: Deaths qo\'shilganda endOfDayChicks kamayadi', async () => {
        const today = new Date();

        // Simulate deaths via DailyBalanceService (normally called from ReportService)
        await DailyBalanceService.updateDeaths(testBatchId, today, 50);

        // Get latest balance
        const balance = await DailyBalanceService.getLatestBalance(testBatchId);

        expect(balance).toBeDefined();
        expect(balance!.deaths).toBe(50);
        expect(balance!.endOfDayChicks).toBe(10000 - 50); // 9950
    });

    it('Test 4: ChickOut qo\'shilganda endOfDayChicks kamayadi', async () => {
        const today = new Date();

        // Simulate chick out via DailyBalanceService
        await DailyBalanceService.updateChickOut(testBatchId, today, 200);

        // Get latest balance
        const balance = await DailyBalanceService.getLatestBalance(testBatchId);

        expect(balance).toBeDefined();
        expect(balance!.deaths).toBe(50);
        expect(balance!.chickOut).toBe(200);
        expect(balance!.endOfDayChicks).toBe(10000 - 50 - 200); // 9750
    });

    it('Test 5: 2-kun kechagi qoldiqdan boshlanadi', async () => {
        // Create tomorrow's balance
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const tomorrowBalance = await DailyBalanceService.getOrCreateForDate(testBatchId, tomorrow);

        // Should start from yesterday's end
        expect(tomorrowBalance.startOfDayChicks).toBe(9750);
        expect(tomorrowBalance.deaths).toBe(0);
        expect(tomorrowBalance.chickOut).toBe(0);
        expect(tomorrowBalance.endOfDayChicks).toBe(9750);
    });

    it('Test 6: Batch yopilgach yangi balance yaratilmaydi', async () => {
        // Close the batch
        await Batch.findByIdAndUpdate(testBatchId, {
            status: BatchStatus.CLOSED,
            endedAt: new Date()
        });

        // Try to create balance for a new day
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 5);

        await expect(
            DailyBalanceService.getOrCreateForDate(testBatchId, futureDate)
        ).rejects.toThrow('Cannot create balance for CLOSED batch');
    });

    it('Test 7: Bir kunda bir nechta operations summasi to\'g\'ri', async () => {
        // Re-open batch for testing
        await Batch.findByIdAndUpdate(testBatchId, {
            status: BatchStatus.ACTIVE,
            endedAt: null
        });

        const section = await Section.findById(testSectionId);
        if (section) {
            section.status = SectionStatus.ACTIVE;
            section.activeBatchId = new mongoose.Types.ObjectId(testBatchId);
            await section.save();
        }

        // Create a new test date (far in future to avoid conflicts)
        const testDate = new Date();
        testDate.setDate(testDate.getDate() + 10);

        // First update
        await DailyBalanceService.updateDeaths(testBatchId, testDate, 10);

        // Second update (same day)
        await DailyBalanceService.updateDeaths(testBatchId, testDate, 15);

        // Third update (chick out)
        await DailyBalanceService.updateChickOut(testBatchId, testDate, 100);

        // Get balance
        const balance = await DailyBalanceService.getBalanceForDate(testBatchId, testDate);

        expect(balance).toBeDefined();
        expect(balance!.deaths).toBe(25); // 10 + 15
        expect(balance!.chickOut).toBe(100);
    });
});
