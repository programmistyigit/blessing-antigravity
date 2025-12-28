import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../src/core/database';
import { initializeDatabase } from '../../src/utils/init.util';

// Models
import { Section, SectionStatus } from '../../src/modules/sections/section.model';
import { Batch } from '../../src/modules/sections/batch.model';
import { Period, PeriodStatus } from '../../src/modules/periods/period.model';
import { User } from '../../src/modules/users/user.model';

// Services
import { BatchService } from '../../src/modules/sections/batch.service';
import { SectionService } from '../../src/modules/sections/section.service';
import { PeriodService } from '../../src/modules/periods/period.service';

describe('Batch-Period Integration E2E Tests', () => {
    let directorUserId: string;
    let testSectionId: string;
    let testPeriodId: string;
    let testBatchIds: string[] = [];

    beforeAll(async () => {
        // Connect DB
        await connectDatabase();
        await initializeDatabase();

        // Get director user
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
        if (testSectionId) await Section.findByIdAndDelete(testSectionId);
        if (testPeriodId) await Period.findByIdAndDelete(testPeriodId);
        for (const id of testBatchIds) {
            await Batch.findByIdAndDelete(id);
        }
        await disconnectDatabase();
    });

    it('Test 1: Legacy Compatibility - Create Batch without Period', async () => {
        // Create Section
        const section = await SectionService.createSection({
            name: 'Legacy Batch Section',
            createdBy: directorUserId,
        });
        testSectionId = section._id.toString();

        // Create Batch - Section has no activePeriodId
        const batch = await BatchService.createBatch({
            sectionId: testSectionId,
            expectedEndAt: new Date(Date.now() + 86400000),
            totalChicksIn: 1000,
            createdBy: directorUserId,
        });
        testBatchIds.push(batch._id.toString());

        expect(batch.periodId).toBeFalsy(); // Should be null
        expect(batch.status).toBe('ACTIVE');

        // Close batch to clean up for next test
        await BatchService.closeBatch(batch._id.toString());
    });

    it('Test 2: Integrated Flow - Create Batch with Active Period', async () => {
        // Create Active Period
        const period = await PeriodService.createPeriod({
            name: 'Batch Integration Period',
            startDate: new Date(),
            createdBy: directorUserId,
        });
        testPeriodId = period._id.toString();

        // Assign Section to Period
        await SectionService.assignPeriod(testSectionId, testPeriodId);

        // Create Batch
        const batch = await BatchService.createBatch({
            sectionId: testSectionId,
            expectedEndAt: new Date(Date.now() + 86400000),
            totalChicksIn: 2000,
            createdBy: directorUserId,
        });
        testBatchIds.push(batch._id.toString());

        expect(batch.periodId).toBeDefined();
        expect(batch.periodId!.toString()).toBe(testPeriodId);

        // Close batch for next test
        await BatchService.closeBatch(batch._id.toString());
    });

    it('Test 3: Constraint - Cannot create Batch in CLOSED Period', async () => {
        // Create a new Period for this test (starts ACTIVE)
        const period = await PeriodService.createPeriod({
            name: 'Closed Period Test',
            createdBy: directorUserId,
            startDate: new Date(),
        });
        const periodId = period._id.toString();

        // Create a new Section for this test
        const section = await SectionService.createSection({
            name: 'Closed Period Section',
            createdBy: directorUserId,
        });
        const sectionId = section._id.toString();

        // Assign Section to Period WHILE it's still ACTIVE
        await SectionService.assignPeriod(sectionId, periodId);

        // Verify assignment
        const s1 = await Section.findById(sectionId);
        expect(s1?.activePeriodId?.toString()).toBe(periodId);

        // NOW close the period
        await PeriodService.closePeriod(periodId);

        // Verify period is CLOSED
        const closedPeriod = await Period.findById(periodId);
        expect(closedPeriod?.status).toBe(PeriodStatus.CLOSED);

        // Try to create Batch -> SHOULD THROW because period is now CLOSED
        await expect(
            BatchService.createBatch({
                sectionId: sectionId,
                expectedEndAt: new Date(Date.now() + 86400000),
                totalChicksIn: 3000,
                createdBy: directorUserId,
            })
        ).rejects.toThrow('Cannot create batch in a CLOSED period');

        // Cleanup
        await Section.findByIdAndDelete(sectionId);
        await Period.findByIdAndDelete(periodId);
    });
});
