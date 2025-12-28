import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../src/core/database';
import { initializeDatabase } from '../../src/utils/init.util';

// Models
import { Section } from '../../src/modules/sections/section.model';
import { Batch } from '../../src/modules/sections/batch.model';
import { ChickOut, ChickOutStatus } from '../../src/modules/sections/chick-out.model';
import { Period } from '../../src/modules/periods/period.model';
import { User } from '../../src/modules/users/user.model';

// Services
import { BatchService } from '../../src/modules/sections/batch.service';
import { SectionService } from '../../src/modules/sections/section.service';
import { PeriodService } from '../../src/modules/periods/period.service';
import { ChickOutService } from '../../src/modules/sections/chick-out.service';
import { PeriodRevenueService } from '../../src/modules/periods/period-revenue.service';

describe('Period Revenue Aggregation E2E Tests', () => {
    let directorUserId: string;
    let cleanupIds: { sections: string[], periods: string[], batches: string[], chickOuts: string[] } = {
        sections: [],
        periods: [],
        batches: [],
        chickOuts: []
    };

    beforeAll(async () => {
        await connectDatabase();
        await initializeDatabase();

        let director = await User.findOne({ username: 'director' });
        if (!director) {
            director = await User.create({
                username: 'director',
                password: 'director123',
                fullName: 'Director User',
                role: new mongoose.Types.ObjectId(),
                status: 'ACTIVE'
            });
        }
        directorUserId = director._id.toString();
    });

    afterAll(async () => {
        // Cleanup
        for (const id of cleanupIds.chickOuts) {
            await ChickOut.findByIdAndDelete(id);
        }
        for (const id of cleanupIds.batches) {
            await Batch.findByIdAndDelete(id);
        }
        for (const id of cleanupIds.sections) {
            await Section.findByIdAndDelete(id);
        }
        for (const id of cleanupIds.periods) {
            await Period.findByIdAndDelete(id);
        }
        await disconnectDatabase();
    });

    // =========================================
    // PERIOD REVENUE AGGREGATION TESTS
    // =========================================

    it('Test 1: COMPLETE ChickOut → revenue hisoblanadi', async () => {
        // Create period
        const period = await PeriodService.createPeriod({
            name: 'Revenue Test Period 1',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // Create section and assign
        const section = await SectionService.createSection({
            name: 'Revenue Test Section 1',
            createdBy: directorUserId
        });
        cleanupIds.sections.push(section._id.toString());
        await SectionService.assignPeriod(section._id.toString(), period._id.toString());

        // Create batch
        const batch = await BatchService.createBatch({
            sectionId: section._id.toString(),
            expectedEndAt: new Date(Date.now() + 86400000),
            totalChicksIn: 1000,
            createdBy: directorUserId
        });
        cleanupIds.batches.push(batch._id.toString());

        // Create chick out
        const chickOut = await ChickOutService.createChickOut({
            sectionId: section._id.toString(),
            count: 500,
            vehicleNumber: 'REV-001',
            machineNumber: 'M001',
            isFinal: false,
            createdBy: directorUserId
        });
        cleanupIds.chickOuts.push(chickOut._id.toString());

        // Complete with financial data
        // totalRevenue = 1800 kg * (1 - 0.05) * 50000 = 1710 * 50000 = 85,500,000
        await ChickOutService.complete(
            chickOut._id.toString(),
            { totalWeightKg: 1800, wastePercent: 5, pricePerKg: 50000 },
            directorUserId
        );

        // Get aggregation
        const aggregation = await PeriodRevenueService.getRevenueAggregation(period._id.toString());

        expect(aggregation.periodId).toBe(period._id.toString());
        expect(aggregation.totalRevenue).toBe(85500000);
        expect(aggregation.completedChickOutCount).toBe(1);
        expect(aggregation.batchCountWithRevenue).toBe(1);
    });

    it('Test 2: INCOMPLETE ChickOut → revenue hisoblanmaydi', async () => {
        // Create period
        const period = await PeriodService.createPeriod({
            name: 'Revenue Test Period 2',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // Create section and assign
        const section = await SectionService.createSection({
            name: 'Revenue Test Section 2',
            createdBy: directorUserId
        });
        cleanupIds.sections.push(section._id.toString());
        await SectionService.assignPeriod(section._id.toString(), period._id.toString());

        // Create batch
        const batch = await BatchService.createBatch({
            sectionId: section._id.toString(),
            expectedEndAt: new Date(Date.now() + 86400000),
            totalChicksIn: 1000,
            createdBy: directorUserId
        });
        cleanupIds.batches.push(batch._id.toString());

        // Create INCOMPLETE chick out (not completed)
        const chickOut = await ChickOutService.createChickOut({
            sectionId: section._id.toString(),
            count: 500,
            vehicleNumber: 'REV-002',
            machineNumber: 'M002',
            isFinal: false,
            createdBy: directorUserId
        });
        cleanupIds.chickOuts.push(chickOut._id.toString());

        // Verify status is INCOMPLETE
        expect(chickOut.status).toBe(ChickOutStatus.INCOMPLETE);

        // Get aggregation - should be 0
        const aggregation = await PeriodRevenueService.getRevenueAggregation(period._id.toString());

        expect(aggregation.periodId).toBe(period._id.toString());
        expect(aggregation.totalRevenue).toBe(0);
        expect(aggregation.completedChickOutCount).toBe(0);
        expect(aggregation.batchCountWithRevenue).toBe(0);
    });

    it('Test 3: Bir periodda bir nechta batch → to\'g\'ri jamlanadi', async () => {
        // Create period
        const period = await PeriodService.createPeriod({
            name: 'Revenue Test Period 3',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // Create first section and batch
        const section1 = await SectionService.createSection({
            name: 'Revenue Test Section 3A',
            createdBy: directorUserId
        });
        cleanupIds.sections.push(section1._id.toString());
        await SectionService.assignPeriod(section1._id.toString(), period._id.toString());

        const batch1 = await BatchService.createBatch({
            sectionId: section1._id.toString(),
            expectedEndAt: new Date(Date.now() + 86400000),
            totalChicksIn: 1000,
            createdBy: directorUserId
        });
        cleanupIds.batches.push(batch1._id.toString());

        // Create second section and batch
        const section2 = await SectionService.createSection({
            name: 'Revenue Test Section 3B',
            createdBy: directorUserId
        });
        cleanupIds.sections.push(section2._id.toString());
        await SectionService.assignPeriod(section2._id.toString(), period._id.toString());

        const batch2 = await BatchService.createBatch({
            sectionId: section2._id.toString(),
            expectedEndAt: new Date(Date.now() + 86400000),
            totalChicksIn: 2000,
            createdBy: directorUserId
        });
        cleanupIds.batches.push(batch2._id.toString());

        // Create and complete chick out for batch1
        // Revenue: 1000 * (1 - 0.1) * 40000 = 900 * 40000 = 36,000,000
        const chickOut1 = await ChickOutService.createChickOut({
            sectionId: section1._id.toString(),
            count: 500,
            vehicleNumber: 'REV-003',
            machineNumber: 'M003',
            isFinal: false,
            createdBy: directorUserId
        });
        cleanupIds.chickOuts.push(chickOut1._id.toString());
        await ChickOutService.complete(
            chickOut1._id.toString(),
            { totalWeightKg: 1000, wastePercent: 10, pricePerKg: 40000 },
            directorUserId
        );

        // Create and complete chick out for batch2
        // Revenue: 2000 * (1 - 0.05) * 45000 = 1900 * 45000 = 85,500,000
        const chickOut2 = await ChickOutService.createChickOut({
            sectionId: section2._id.toString(),
            count: 1000,
            vehicleNumber: 'REV-004',
            machineNumber: 'M004',
            isFinal: false,
            createdBy: directorUserId
        });
        cleanupIds.chickOuts.push(chickOut2._id.toString());
        await ChickOutService.complete(
            chickOut2._id.toString(),
            { totalWeightKg: 2000, wastePercent: 5, pricePerKg: 45000 },
            directorUserId
        );

        // Get aggregation
        const aggregation = await PeriodRevenueService.getRevenueAggregation(period._id.toString());

        // Total: 36,000,000 + 85,500,000 = 121,500,000
        expect(aggregation.totalRevenue).toBe(121500000);
        expect(aggregation.completedChickOutCount).toBe(2);
        expect(aggregation.batchCountWithRevenue).toBe(2);
    });

    it('Test 4: COMPLETE = 0 → totalRevenue = 0, ERROR yo\'q', async () => {
        // Create period with no chick outs
        const period = await PeriodService.createPeriod({
            name: 'Revenue Test Period 4',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // Get aggregation - should return 0 without error
        const aggregation = await PeriodRevenueService.getRevenueAggregation(period._id.toString());

        expect(aggregation.periodId).toBe(period._id.toString());
        expect(aggregation.totalRevenue).toBe(0);
        expect(aggregation.completedChickOutCount).toBe(0);
        expect(aggregation.batchCountWithRevenue).toBe(0);
    });

    it('Test 5: Period topilmasa → Error', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();

        await expect(
            PeriodRevenueService.getRevenueAggregation(fakeId)
        ).rejects.toThrow('Period not found');
    });

    it('Test 6: hasRevenue utility method ishlaydi', async () => {
        // Create period with completed chick out
        const period = await PeriodService.createPeriod({
            name: 'Revenue Test Period 5',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // Initially no revenue
        expect(await PeriodRevenueService.hasRevenue(period._id.toString())).toBe(false);

        // Create section and batch
        const section = await SectionService.createSection({
            name: 'Revenue Test Section 5',
            createdBy: directorUserId
        });
        cleanupIds.sections.push(section._id.toString());
        await SectionService.assignPeriod(section._id.toString(), period._id.toString());

        const batch = await BatchService.createBatch({
            sectionId: section._id.toString(),
            expectedEndAt: new Date(Date.now() + 86400000),
            totalChicksIn: 500,
            createdBy: directorUserId
        });
        cleanupIds.batches.push(batch._id.toString());

        // Create and complete chick out
        const chickOut = await ChickOutService.createChickOut({
            sectionId: section._id.toString(),
            count: 250,
            vehicleNumber: 'REV-005',
            machineNumber: 'M005',
            isFinal: false,
            createdBy: directorUserId
        });
        cleanupIds.chickOuts.push(chickOut._id.toString());
        await ChickOutService.complete(
            chickOut._id.toString(),
            { totalWeightKg: 500, wastePercent: 5, pricePerKg: 50000 },
            directorUserId
        );

        // Now has revenue
        expect(await PeriodRevenueService.hasRevenue(period._id.toString())).toBe(true);
    });
});
