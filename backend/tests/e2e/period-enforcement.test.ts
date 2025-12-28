import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../src/core/database';
import { initializeDatabase } from '../../src/utils/init.util';

// Models
import { Section, SectionStatus } from '../../src/modules/sections/section.model';
import { Batch, BatchStatus } from '../../src/modules/sections/batch.model';
import { Period, PeriodStatus } from '../../src/modules/periods/period.model';
import { User } from '../../src/modules/users/user.model';

// Services
import { BatchService } from '../../src/modules/sections/batch.service';
import { SectionService } from '../../src/modules/sections/section.service';
import { PeriodService } from '../../src/modules/periods/period.service';

describe('Period Enforcement E2E Tests', () => {
    let directorUserId: string;
    let cleanupIds: { sections: string[], periods: string[], batches: string[] } = {
        sections: [],
        periods: [],
        batches: []
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
        // Cleanup all test data
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
    // BATCH CREATION RULES
    // =========================================

    it('Test 1: Cannot create batch without period assigned to section', async () => {
        // Create section without period
        const section = await SectionService.createSection({
            name: 'No Period Section',
            createdBy: directorUserId
        });
        cleanupIds.sections.push(section._id.toString());

        // Try to create batch -> should fail
        await expect(
            BatchService.createBatch({
                sectionId: section._id.toString(),
                expectedEndAt: new Date(Date.now() + 86400000),
                totalChicksIn: 1000,
                createdBy: directorUserId
            })
        ).rejects.toThrow('Section is not assigned to an active period');
    });

    it('Test 2: Cannot create batch in CLOSED period', async () => {
        // Create period
        const period = await PeriodService.createPeriod({
            name: 'Test Closed Period',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // Create section
        const section = await SectionService.createSection({
            name: 'Closed Period Section',
            createdBy: directorUserId
        });
        cleanupIds.sections.push(section._id.toString());

        // Assign period while ACTIVE
        await SectionService.assignPeriod(section._id.toString(), period._id.toString());

        // Close the period
        await PeriodService.closePeriod(period._id.toString());

        // Try to create batch -> should fail
        await expect(
            BatchService.createBatch({
                sectionId: section._id.toString(),
                expectedEndAt: new Date(Date.now() + 86400000),
                totalChicksIn: 1000,
                createdBy: directorUserId
            })
        ).rejects.toThrow('Cannot create batch in closed period');
    });

    it('Test 3: Can create batch with ACTIVE period', async () => {
        // Create period
        const period = await PeriodService.createPeriod({
            name: 'Active Period Test',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // Create section
        const section = await SectionService.createSection({
            name: 'Active Period Section',
            createdBy: directorUserId
        });
        cleanupIds.sections.push(section._id.toString());

        // Assign period
        await SectionService.assignPeriod(section._id.toString(), period._id.toString());

        // Create batch -> should succeed
        const batch = await BatchService.createBatch({
            sectionId: section._id.toString(),
            expectedEndAt: new Date(Date.now() + 86400000),
            totalChicksIn: 1000,
            createdBy: directorUserId
        });
        cleanupIds.batches.push(batch._id.toString());

        expect(batch.periodId).toBeDefined();
        expect(batch.periodId!.toString()).toBe(period._id.toString());

        // Close batch for next tests
        await BatchService.closeBatch(batch._id.toString());
    });

    // =========================================
    // PERIOD CLOSING RULES
    // =========================================

    it('Test 4: Cannot close period with active batches', async () => {
        // Create period
        const period = await PeriodService.createPeriod({
            name: 'Period With Active Batch',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // Create section and assign
        const section = await SectionService.createSection({
            name: 'Active Batch Section',
            createdBy: directorUserId
        });
        cleanupIds.sections.push(section._id.toString());
        await SectionService.assignPeriod(section._id.toString(), period._id.toString());

        // Create batch (still ACTIVE)
        const batch = await BatchService.createBatch({
            sectionId: section._id.toString(),
            expectedEndAt: new Date(Date.now() + 86400000),
            totalChicksIn: 1000,
            createdBy: directorUserId
        });
        cleanupIds.batches.push(batch._id.toString());

        // Try to close period -> should fail
        await expect(
            PeriodService.closePeriod(period._id.toString())
        ).rejects.toThrow('Cannot close period with active batches');

        // Close batch first
        await BatchService.closeBatch(batch._id.toString());

        // Now closing should work
        const closedPeriod = await PeriodService.closePeriod(period._id.toString());
        expect(closedPeriod.status).toBe(PeriodStatus.CLOSED);
    });

    it('Test 5: Can close period when all batches are CLOSED', async () => {
        // Create period
        const period = await PeriodService.createPeriod({
            name: 'Period All Batches Closed',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // Create section and assign
        const section = await SectionService.createSection({
            name: 'All Closed Section',
            createdBy: directorUserId
        });
        cleanupIds.sections.push(section._id.toString());
        await SectionService.assignPeriod(section._id.toString(), period._id.toString());

        // Create and close batch
        const batch = await BatchService.createBatch({
            sectionId: section._id.toString(),
            expectedEndAt: new Date(Date.now() + 86400000),
            totalChicksIn: 1000,
            createdBy: directorUserId
        });
        cleanupIds.batches.push(batch._id.toString());
        await BatchService.closeBatch(batch._id.toString());

        // Close period -> should succeed
        const closedPeriod = await PeriodService.closePeriod(period._id.toString());
        expect(closedPeriod.status).toBe(PeriodStatus.CLOSED);
        expect(closedPeriod.endDate).toBeDefined();
    });

    // =========================================
    // SECTION ACTIVATION RULES
    // =========================================

    it('Test 6: Cannot activate section without active period', async () => {
        // Create section without period
        const section = await SectionService.createSection({
            name: 'No Activate Section',
            createdBy: directorUserId
        });
        cleanupIds.sections.push(section._id.toString());

        // Try to set status to ACTIVE -> should fail
        await expect(
            SectionService.updateSection(section._id.toString(), {
                status: SectionStatus.ACTIVE
            })
        ).rejects.toThrow('Section cannot be activated without an active period');
    });

    // =========================================
    // LEGACY DATA PROTECTION
    // =========================================

    it('Test 7: Legacy batch (periodId=null) still readable', async () => {
        // Create legacy batch directly (bypassing service)
        const section = await Section.create({
            name: 'Legacy Section',
            status: SectionStatus.ACTIVE,
            createdBy: new mongoose.Types.ObjectId(directorUserId)
        });
        cleanupIds.sections.push(section._id.toString());

        const legacyBatch = await Batch.create({
            sectionId: section._id,
            periodId: null, // Legacy - no period
            startedAt: new Date(),
            expectedEndAt: new Date(Date.now() + 86400000),
            totalChicksIn: 500,
            totalChicksOut: 0,
            status: BatchStatus.ACTIVE,
            createdBy: new mongoose.Types.ObjectId(directorUserId)
        });
        cleanupIds.batches.push(legacyBatch._id.toString());

        // Read batch - should work
        const batch = await BatchService.getBatchById(legacyBatch._id.toString());
        expect(batch).toBeDefined();
        expect(batch!.periodId).toBeNull();

        // Close legacy batch
        await BatchService.closeBatch(legacyBatch._id.toString());
    });
});
