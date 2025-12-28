import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../src/core/database';
import { initializeDatabase } from '../../src/utils/init.util';

// Models
import { Section, SectionStatus } from '../../src/modules/sections/section.model';
import { Period, PeriodStatus } from '../../src/modules/periods/period.model';
import { User } from '../../src/modules/users/user.model';

// Services
import { SectionService } from '../../src/modules/sections/section.service';
import { PeriodService } from '../../src/modules/periods/period.service';

describe('Section-Period Integration E2E Tests', () => {
    let directorUserId: string;
    let testSectionId: string;
    let testPeriodId: string;

    beforeAll(async () => {
        // Connect DB
        await connectDatabase();
        await initializeDatabase();

        // Get director user
        // Get director user
        let director = await User.findOne({ username: 'director' });
        if (!director) {
            // Fallback: Create a director if not found (though init should have done it)
            director = await User.create({
                username: 'director',
                password: 'director123',
                fullName: 'Director User',
                role: new mongoose.Types.ObjectId(), // Mock role ID if needed, or fetch a role
                status: 'ACTIVE'
            });
        }

        // Ensure we really have an ID
        if (!director) throw new Error('Failed to get director user for tests');
        directorUserId = director._id.toString();
    });

    afterAll(async () => {
        // Cleanup test data
        if (testSectionId) await Section.findByIdAndDelete(testSectionId);
        if (testPeriodId) await Period.findByIdAndDelete(testPeriodId);

        await disconnectDatabase();
    });

    it('Test 1: Setup - Create Section and Active Period', async () => {
        // Create Section
        const section = await SectionService.createSection({
            name: 'Integration Section',
            createdBy: directorUserId,
        });
        testSectionId = section._id.toString();

        expect(section.activePeriodId).toBeFalsy(); // Should be empty initially (null or undefined)

        // Create Active Period
        const period = await PeriodService.createPeriod({
            name: 'Integration Period',
            startDate: new Date(),
            createdBy: directorUserId,
        });
        testPeriodId = period._id.toString();

        expect(period.status).toBe(PeriodStatus.ACTIVE);
    });

    it('Test 2: Assign Section to Period', async () => {
        const updatedSection = await SectionService.assignPeriod(testSectionId, testPeriodId);

        expect(updatedSection.activePeriodId).toBeDefined();
        expect(updatedSection.activePeriodId!.toString()).toBe(testPeriodId);

        // Fetch fresh from DB to verify persistence
        const fetchedSection = await Section.findById(testSectionId);
        expect(fetchedSection?.activePeriodId?.toString()).toBe(testPeriodId);
    });

    it('Test 3: Cannot assign to CLOSED period', async () => {
        // Create a closed period
        const closedPeriod = await PeriodService.createPeriod({
            name: 'Closed Period',
            startDate: new Date(),
            createdBy: directorUserId,
        });
        await PeriodService.closePeriod(closedPeriod._id.toString());

        await expect(
            SectionService.assignPeriod(testSectionId, closedPeriod._id.toString())
        ).rejects.toThrow('Cannot assign section to a CLOSED period');

        // Cleanup closed period
        await Period.findByIdAndDelete(closedPeriod._id);
    });

    it('Test 4: Unassign Section from Period', async () => {
        const unassignedSection = await SectionService.unassignPeriod(testSectionId);

        expect(unassignedSection.activePeriodId).toBeFalsy();

        // Fetch fresh from DB
        const fetchedSection = await Section.findById(testSectionId);
        expect(fetchedSection?.activePeriodId).toBeFalsy();
    });

    it('Test 5: Assign to non-existent Period should fail', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();

        await expect(
            SectionService.assignPeriod(testSectionId, fakeId)
        ).rejects.toThrow('Period not found');
    });

    it('Test 6: Assign to non-existent Section should fail', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();

        await expect(
            SectionService.assignPeriod(fakeId, testPeriodId)
        ).rejects.toThrow('Section not found');
    });
});
