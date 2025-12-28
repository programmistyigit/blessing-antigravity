import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../src/core/database';
import { initializeDatabase } from '../../src/utils/init.util';

// Models
import { DailyBalance } from '../../src/modules/sections/daily-balance.model';
import { Batch, BatchStatus } from '../../src/modules/sections/batch.model';
import { Section, SectionStatus } from '../../src/modules/sections/section.model';
import { ChickOut } from '../../src/modules/sections/chick-out.model';
import { User } from '../../src/modules/users/user.model';

// Services
import { BatchSummaryService } from '../../src/modules/sections/batch-summary.service';
import { DailyBalanceService } from '../../src/modules/sections/daily-balance.service';

describe('Batch Summary & Timeline E2E Tests', () => {
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

        // Create test section
        const section = new Section({
            name: 'Summary Test Section ' + Date.now(),
            status: SectionStatus.EMPTY,
            createdBy: directorUserId,
        });
        await section.save();
        testSectionId = section._id.toString();

        // Create test batch with 10000 chicks
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

        // Create day 1 balance with deaths
        await DailyBalanceService.getOrCreateForDate(testBatchId, batch.startedAt);
        await DailyBalanceService.updateDeaths(testBatchId, batch.startedAt, 50);
        await DailyBalanceService.updateChickOut(testBatchId, batch.startedAt, 100);

        // Create day 2 balance with different values
        const day2 = new Date(batch.startedAt);
        day2.setDate(day2.getDate() + 1);
        await DailyBalanceService.getOrCreateForDate(testBatchId, day2);
        await DailyBalanceService.updateDeaths(testBatchId, day2, 30);
        await DailyBalanceService.updateChickOut(testBatchId, day2, 200);

        // Create day 3 balance
        const day3 = new Date(batch.startedAt);
        day3.setDate(day3.getDate() + 2);
        await DailyBalanceService.getOrCreateForDate(testBatchId, day3);
        await DailyBalanceService.updateDeaths(testBatchId, day3, 20);
    });

    afterAll(async () => {
        // Cleanup test data
        if (testBatchId) {
            await DailyBalance.deleteMany({ batchId: testBatchId });
            await ChickOut.deleteMany({ batchId: testBatchId });
            await Batch.findByIdAndDelete(testBatchId);
        }
        if (testSectionId) {
            await Section.findByIdAndDelete(testSectionId);
        }

        await disconnectDatabase();
    });

    // =========================================
    // BATCH SUMMARY TESTS
    // =========================================

    it('Test 1: Batch summary to\'g\'ri hisoblanadi', async () => {
        const summary = await BatchSummaryService.getBatchSummary(testBatchId);

        expect(summary).toBeDefined();
        expect(summary.batchId).toBe(testBatchId);
        expect(summary.startChickCount).toBe(10000);
    });

    it('Test 2: totalDeaths = DailyBalance yig\'indisi', async () => {
        const summary = await BatchSummaryService.getBatchSummary(testBatchId);

        // 50 + 30 + 20 = 100
        expect(summary.totalDeaths).toBe(100);
    });

    it('Test 3: totalChickOut = DailyBalance chickOut yig\'indisi', async () => {
        const summary = await BatchSummaryService.getBatchSummary(testBatchId);

        // 100 + 200 + 0 = 300
        expect(summary.totalChickOut).toBe(300);
    });

    it('Test 4: finalChickCount oxirgi balance\'dan olinadi', async () => {
        const summary = await BatchSummaryService.getBatchSummary(testBatchId);

        // Start: 10000
        // Day 1: 10000 - 50 - 100 = 9850
        // Day 2: 9850 - 30 - 200 = 9620
        // Day 3: 9620 - 20 - 0 = 9600
        expect(summary.finalChickCount).toBe(9600);
    });

    it('Test 5: totalDays = DailyBalance soniga teng', async () => {
        const summary = await BatchSummaryService.getBatchSummary(testBatchId);

        expect(summary.totalDays).toBe(3);
    });

    it('Test 6: averageDailyMortality to\'g\'ri hisoblanadi', async () => {
        const summary = await BatchSummaryService.getBatchSummary(testBatchId);

        // 100 deaths / 3 days = 33.33
        expect(summary.averageDailyMortality).toBeCloseTo(33.33, 1);
    });

    it('Test 7: ACTIVE batch - isFinal = false', async () => {
        const summary = await BatchSummaryService.getBatchSummary(testBatchId);

        expect(summary.isFinal).toBe(false);
        expect(summary.status).toBe(BatchStatus.ACTIVE);
    });

    // =========================================
    // BATCH TIMELINE TESTS
    // =========================================

    it('Test 8: Timeline kunlar soni DailyBalance soniga teng', async () => {
        const timeline = await BatchSummaryService.getBatchTimeline(testBatchId);

        expect(timeline.length).toBe(3);
    });

    it('Test 9: Timeline dayNumber to\'g\'ri', async () => {
        const timeline = await BatchSummaryService.getBatchTimeline(testBatchId);

        expect(timeline[0].dayNumber).toBe(1);
        expect(timeline[1].dayNumber).toBe(2);
        expect(timeline[2].dayNumber).toBe(3);
    });

    it('Test 10: Timeline qiymatlari to\'g\'ri', async () => {
        const timeline = await BatchSummaryService.getBatchTimeline(testBatchId);

        // Day 1
        expect(timeline[0].startOfDayChicks).toBe(10000);
        expect(timeline[0].deaths).toBe(50);
        expect(timeline[0].chickOut).toBe(100);
        expect(timeline[0].endOfDayChicks).toBe(9850);

        // Day 2
        expect(timeline[1].startOfDayChicks).toBe(9850);
        expect(timeline[1].deaths).toBe(30);
        expect(timeline[1].chickOut).toBe(200);
        expect(timeline[1].endOfDayChicks).toBe(9620);
    });

    // =========================================
    // CLOSED BATCH TESTS
    // =========================================

    it('Test 11: Batch CLOSED bo\'lsa summary isFinal = true', async () => {
        // Close the batch
        await Batch.findByIdAndUpdate(testBatchId, {
            status: BatchStatus.CLOSED,
            endedAt: new Date()
        });

        const summary = await BatchSummaryService.getBatchSummary(testBatchId);

        expect(summary.isFinal).toBe(true);
        expect(summary.status).toBe(BatchStatus.CLOSED);
        expect(summary.endDate).toBeDefined();
    });

    it('Test 12: CLOSED batch summary o\'zgarmaydi', async () => {
        // Get summary before and after - should be same
        const summary1 = await BatchSummaryService.getBatchSummary(testBatchId);

        // Values should remain the same
        expect(summary1.totalDeaths).toBe(100);
        expect(summary1.totalChickOut).toBe(300);
        expect(summary1.finalChickCount).toBe(9600);
    });

    // =========================================
    // ERROR HANDLING TESTS
    // =========================================

    it('Test 13: Non-existent batch throws error', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();

        await expect(
            BatchSummaryService.getBatchSummary(fakeId)
        ).rejects.toThrow('Batch not found');
    });
});
