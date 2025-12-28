import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../src/core/database';
import { initializeDatabase } from '../../src/utils/init.util';

// Models
import { Section, SectionStatus } from '../../src/modules/sections/section.model';
import { Batch, BatchStatus } from '../../src/modules/sections/batch.model';
import { ChickOut, ChickOutStatus } from '../../src/modules/sections/chick-out.model';
import { Period, PeriodStatus } from '../../src/modules/periods/period.model';
import { User } from '../../src/modules/users/user.model';

// Services
import { BatchService } from '../../src/modules/sections/batch.service';
import { SectionService } from '../../src/modules/sections/section.service';
import { PeriodService } from '../../src/modules/periods/period.service';
import { ChickOutService } from '../../src/modules/sections/chick-out.service';

describe('2-Phase ChickOut E2E Tests', () => {
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
    // CHICKOUT STATUS TESTS
    // =========================================

    it('Test 1: ChickOut default status is INCOMPLETE', async () => {
        // Create period
        const period = await PeriodService.createPeriod({
            name: 'ChickOut Status Period',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // Create section and assign
        const section = await SectionService.createSection({
            name: 'ChickOut Status Section',
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
            count: 100,
            vehicleNumber: 'ABC-123',
            machineNumber: 'M001',
            isFinal: false,
            createdBy: directorUserId
        });
        cleanupIds.chickOuts.push(chickOut._id.toString());

        // Verify default status
        expect(chickOut.status).toBe(ChickOutStatus.INCOMPLETE);
        expect(chickOut.totalRevenue).toBeNull();
    });

    it('Test 2: Complete endpoint calculates correctly', async () => {
        // Create period
        const period = await PeriodService.createPeriod({
            name: 'Complete Calc Period',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // Create section and assign
        const section = await SectionService.createSection({
            name: 'Complete Calc Section',
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
            count: 100,
            vehicleNumber: 'ABC-456',
            machineNumber: 'M002',
            isFinal: false,
            createdBy: directorUserId
        });
        cleanupIds.chickOuts.push(chickOut._id.toString());

        // Complete with financial data
        const completed = await ChickOutService.complete(
            chickOut._id.toString(),
            {
                totalWeightKg: 200,
                wastePercent: 10,
                pricePerKg: 50000
            },
            directorUserId
        );

        // Verify calculations
        expect(completed.status).toBe(ChickOutStatus.COMPLETE);
        expect(completed.totalWeightKg).toBe(200);
        expect(completed.wastePercent).toBe(10);
        expect(completed.netWeightKg).toBe(180); // 200 * (1 - 0.1)
        expect(completed.pricePerKg).toBe(50000);
        expect(completed.totalRevenue).toBe(9000000); // 180 * 50000
        expect(completed.completedAt).toBeDefined();
        expect(completed.completedBy).toBeDefined();

        // Complete the rest for cleanup
        const chickOut2 = await ChickOutService.createChickOut({
            sectionId: section._id.toString(),
            count: 900,
            vehicleNumber: 'XYZ-789',
            machineNumber: 'M003',
            isFinal: true,
            createdBy: directorUserId
        });
        cleanupIds.chickOuts.push(chickOut2._id.toString());
        await ChickOutService.complete(
            chickOut2._id.toString(),
            { totalWeightKg: 1800, wastePercent: 5, pricePerKg: 48000 },
            directorUserId
        );
    });

    // =========================================
    // BUSINESS CONSTRAINT TESTS
    // =========================================

    it('Test 3: Cannot close batch with INCOMPLETE chick-outs', async () => {
        // Create period
        const period = await PeriodService.createPeriod({
            name: 'Batch Close Block Period',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // Create section and assign
        const section = await SectionService.createSection({
            name: 'Batch Close Block Section',
            createdBy: directorUserId
        });
        cleanupIds.sections.push(section._id.toString());
        await SectionService.assignPeriod(section._id.toString(), period._id.toString());

        // Create batch
        const batch = await BatchService.createBatch({
            sectionId: section._id.toString(),
            expectedEndAt: new Date(Date.now() + 86400000),
            totalChicksIn: 500,
            createdBy: directorUserId
        });
        cleanupIds.batches.push(batch._id.toString());

        // Create INCOMPLETE chick out
        const chickOut = await ChickOutService.createChickOut({
            sectionId: section._id.toString(),
            count: 500,
            vehicleNumber: 'DEF-111',
            machineNumber: 'M004',
            isFinal: false,
            createdBy: directorUserId
        });
        cleanupIds.chickOuts.push(chickOut._id.toString());

        // Try to close batch -> should fail
        await expect(
            BatchService.closeBatch(batch._id.toString())
        ).rejects.toThrow('Cannot close batch: incomplete chick-outs exist');

        // Complete the chick out
        await ChickOutService.complete(
            chickOut._id.toString(),
            { totalWeightKg: 1000, wastePercent: 5, pricePerKg: 45000 },
            directorUserId
        );

        // Now close should work
        const closedBatch = await BatchService.closeBatch(batch._id.toString());
        expect(closedBatch.status).toBe(BatchStatus.CLOSED);
    });

    it('Test 4: Cannot close period with INCOMPLETE chick-outs', async () => {
        // Create period
        const period = await PeriodService.createPeriod({
            name: 'Period Close Block',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // Create section and assign
        const section = await SectionService.createSection({
            name: 'Period Close Block Section',
            createdBy: directorUserId
        });
        cleanupIds.sections.push(section._id.toString());
        await SectionService.assignPeriod(section._id.toString(), period._id.toString());

        // Create batch
        const batch = await BatchService.createBatch({
            sectionId: section._id.toString(),
            expectedEndAt: new Date(Date.now() + 86400000),
            totalChicksIn: 300,
            createdBy: directorUserId
        });
        cleanupIds.batches.push(batch._id.toString());

        // Create INCOMPLETE chick out
        const chickOut = await ChickOutService.createChickOut({
            sectionId: section._id.toString(),
            count: 300,
            vehicleNumber: 'GHI-222',
            machineNumber: 'M005',
            isFinal: true,
            createdBy: directorUserId
        });
        cleanupIds.chickOuts.push(chickOut._id.toString());

        // Try to close period -> should fail (batch is CLOSED but chickout is INCOMPLETE)
        // Note: isFinal=true closes the batch, so we test period close blocking
        await expect(
            PeriodService.closePeriod(period._id.toString())
        ).rejects.toThrow('incomplete chick-outs');

        // Complete the chick out
        await ChickOutService.complete(
            chickOut._id.toString(),
            { totalWeightKg: 600, wastePercent: 8, pricePerKg: 52000 },
            directorUserId
        );

        // Now period close should work
        const closedPeriod = await PeriodService.closePeriod(period._id.toString());
        expect(closedPeriod.status).toBe(PeriodStatus.CLOSED);
    });
});
