import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectDatabase, disconnectDatabase } from '../../src/core/database';
import { initializeDatabase } from '../../src/utils/init.util';

// Models
import { Period } from '../../src/modules/periods/period.model';
import { PeriodExpense, ExpenseCategory } from '../../src/modules/periods/period-expense.model';
import { Section } from '../../src/modules/sections/section.model';
import { Batch } from '../../src/modules/sections/batch.model';
import { ChickOut, ChickOutStatus } from '../../src/modules/sections/chick-out.model';
import { User } from '../../src/modules/users/user.model';
import { Role } from '../../src/modules/roles/role.model';

// Services
import { SectionInsightService } from '../../src/modules/sections/section-insight.service';

describe('Section Insight E2E Tests', () => {
    let directorUser: any;

    beforeAll(async () => {
        await connectDatabase();
        await initializeDatabase();

        // Find or create director role
        let directorRole = await Role.findOne({ name: 'Director' });
        if (!directorRole) {
            directorRole = await Role.create({
                name: 'Director',
                permissions: ['SYSTEM_ALL'],
                isSystem: true
            });
        }

        // Find or create director user
        let director = await User.findOne({ username: 'test_director_insight' });
        if (!director) {
            director = await User.create({
                username: 'test_director_insight',
                passwordHash: 'hashed_password',
                fullName: 'Test Director Insight',
                role: directorRole._id,
                isActive: true
            });
        }
        directorUser = director;
    });

    afterAll(async () => {
        await disconnectDatabase();
    });

    it('Test 1: getPeriodAnalytics ranks sections by profit correctly', async () => {
        // Create period and sections
        const period = await Period.create({
            name: 'Analytics Test Period ' + Date.now(),
            startDate: new Date(),
            status: 'ACTIVE',
            createdBy: directorUser._id
        });

        const section1 = await Section.create({
            name: 'High Profit Section',
            activePeriodId: period._id,
            createdBy: directorUser._id
        });

        const section2 = await Section.create({
            name: 'Low Profit Section',
            activePeriodId: period._id,
            createdBy: directorUser._id
        });

        // Create batches
        const batch1 = await Batch.create({
            sectionId: section1._id,
            periodId: period._id,
            startedAt: new Date(),
            expectedEndAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            totalChicksIn: 1000,
            totalChicksOut: 900,
            createdBy: directorUser._id
        });

        const batch2 = await Batch.create({
            sectionId: section2._id,
            periodId: period._id,
            startedAt: new Date(),
            expectedEndAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            totalChicksIn: 1000,
            totalChicksOut: 800,
            createdBy: directorUser._id
        });

        // Section 1: High revenue (10,000,000), Low expenses (2,000,000) = 8,000,000 profit
        await ChickOut.create({
            sectionId: section1._id,
            batchId: batch1._id,
            date: new Date(),
            count: 900,
            avgWeight: 2.5,
            pricePerKg: 4444.44,
            totalWeight: 2250,
            totalRevenue: 10000000,
            vehicleNumber: 'TEST-001',
            machineNumber: 'M001',
            isFinal: true,
            status: ChickOutStatus.COMPLETE,
            createdBy: directorUser._id
        });

        await PeriodExpense.create({
            periodId: period._id,
            sectionId: section1._id,
            category: ExpenseCategory.ELECTRICITY,
            amount: 2000000,
            description: 'Electricity cost',
            expenseDate: new Date(),
            createdBy: directorUser._id
        });

        // Section 2: Low revenue (5,000,000), High expenses (4,000,000) = 1,000,000 profit
        await ChickOut.create({
            sectionId: section2._id,
            batchId: batch2._id,
            date: new Date(),
            count: 800,
            avgWeight: 2.5,
            pricePerKg: 2500,
            totalWeight: 2000,
            totalRevenue: 5000000,
            vehicleNumber: 'TEST-002',
            machineNumber: 'M002',
            isFinal: true,
            status: ChickOutStatus.COMPLETE,
            createdBy: directorUser._id
        });

        await PeriodExpense.create({
            periodId: period._id,
            sectionId: section2._id,
            category: ExpenseCategory.LABOR_FIXED,
            amount: 4000000,
            description: 'Labor cost',
            expenseDate: new Date(),
            createdBy: directorUser._id
        });

        // Get analytics
        const analytics = await SectionInsightService.getPeriodAnalytics(period._id.toString());

        expect(analytics.status).toBe('SUCCESS');
        expect(analytics.sections.length).toBe(2);

        // First section should be High Profit (rank 1)
        expect(analytics.sections[0].sectionName).toBe('High Profit Section');
        expect(analytics.sections[0].rank).toBe(1);
        expect(analytics.sections[0].profit).toBe(8000000);

        // Second section should be Low Profit (rank 2)
        expect(analytics.sections[1].sectionName).toBe('Low Profit Section');
        expect(analytics.sections[1].rank).toBe(2);
        expect(analytics.sections[1].profit).toBe(1000000);

        // Summary check
        expect(analytics.summary.bestSection).toBe('High Profit Section');
        expect(analytics.summary.worstSection).toBe('Low Profit Section');
        expect(analytics.summary.totalPeriodProfit).toBe(9000000);
        expect(analytics.summary.profitableSectionsCount).toBe(2);
        expect(analytics.summary.lossMakingSectionsCount).toBe(0);

        // Cleanup
        await ChickOut.deleteMany({ batchId: { $in: [batch1._id, batch2._id] } });
        await Batch.deleteMany({ _id: { $in: [batch1._id, batch2._id] } });
        await PeriodExpense.deleteMany({ periodId: period._id });
        await Section.deleteMany({ _id: { $in: [section1._id, section2._id] } });
        await Period.deleteOne({ _id: period._id });
    });

    it('Test 2: Status classification works correctly (LOSS_MAKING)', async () => {
        const period = await Period.create({
            name: 'Loss Test Period ' + Date.now(),
            startDate: new Date(),
            status: 'ACTIVE',
            createdBy: directorUser._id
        });

        const section = await Section.create({
            name: 'Loss Making Section',
            activePeriodId: period._id,
            createdBy: directorUser._id
        });

        const batch = await Batch.create({
            sectionId: section._id,
            periodId: period._id,
            startedAt: new Date(),
            expectedEndAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            totalChicksIn: 1000,
            totalChicksOut: 500,
            createdBy: directorUser._id
        });

        // Low revenue
        await ChickOut.create({
            sectionId: section._id,
            batchId: batch._id,
            date: new Date(),
            count: 500,
            avgWeight: 2,
            pricePerKg: 2000,
            totalWeight: 1000,
            totalRevenue: 2000000,
            vehicleNumber: 'TEST-003',
            machineNumber: 'M003',
            isFinal: true,
            status: ChickOutStatus.COMPLETE,
            createdBy: directorUser._id
        });

        // High expenses (causes loss)
        await PeriodExpense.create({
            periodId: period._id,
            sectionId: section._id.toString(),
            category: ExpenseCategory.MAINTENANCE,
            amount: 5000000,
            description: 'Maintenance expenses',
            expenseDate: new Date(),
            createdBy: directorUser._id
        });

        const analytics = await SectionInsightService.getPeriodAnalytics(period._id.toString());

        expect(analytics.status).toBe('SUCCESS');
        expect(analytics.sections[0].status).toBe('LOSS_MAKING');
        expect(analytics.sections[0].profit).toBe(-3000000);
        expect(analytics.summary.lossMakingSectionsCount).toBe(1);

        // Cleanup
        await ChickOut.deleteMany({ batchId: batch._id });
        await Batch.deleteOne({ _id: batch._id });
        await PeriodExpense.deleteMany({ periodId: period._id });
        await Section.deleteOne({ _id: section._id });
        await Period.deleteOne({ _id: period._id });
    });

    it('Test 3: Main cost driver identification', async () => {
        const period = await Period.create({
            name: 'Cost Driver Test ' + Date.now(),
            startDate: new Date(),
            status: 'ACTIVE',
            createdBy: directorUser._id
        });

        const section = await Section.create({
            name: 'Cost Analysis Section',
            activePeriodId: period._id,
            createdBy: directorUser._id
        });

        const batch = await Batch.create({
            sectionId: section._id,
            periodId: period._id,
            startedAt: new Date(),
            expectedEndAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            totalChicksIn: 1000,
            totalChicksOut: 900,
            createdBy: directorUser._id
        });

        await ChickOut.create({
            sectionId: section._id,
            batchId: batch._id,
            date: new Date(),
            count: 900,
            avgWeight: 2.5,
            pricePerKg: 5000,
            totalWeight: 2250,
            totalRevenue: 11250000,
            vehicleNumber: 'TEST-004',
            machineNumber: 'M004',
            isFinal: true,
            status: ChickOutStatus.COMPLETE,
            createdBy: directorUser._id
        });

        // Multiple expense categories - ELECTRICITY should be main driver (highest amount)
        await PeriodExpense.create({
            periodId: period._id,
            sectionId: section._id.toString(),
            category: ExpenseCategory.ELECTRICITY,
            amount: 5000000,
            description: 'Electricity',
            expenseDate: new Date(),
            createdBy: directorUser._id
        });

        await PeriodExpense.create({
            periodId: period._id,
            sectionId: section._id.toString(),
            category: ExpenseCategory.LABOR_FIXED,
            amount: 1000000,
            description: 'Labor',
            expenseDate: new Date(),
            createdBy: directorUser._id
        });

        await PeriodExpense.create({
            periodId: period._id,
            sectionId: section._id.toString(),
            category: ExpenseCategory.MAINTENANCE,
            amount: 500000,
            description: 'Maintenance',
            expenseDate: new Date(),
            createdBy: directorUser._id
        });

        const analytics = await SectionInsightService.getPeriodAnalytics(period._id.toString());

        expect(analytics.status).toBe('SUCCESS');
        expect(analytics.sections[0].mainCostDriver).toBe(ExpenseCategory.ELECTRICITY);
        expect(analytics.sections[0].costBreakdown[ExpenseCategory.ELECTRICITY]).toBe(5000000);
        expect(analytics.sections[0].costBreakdown[ExpenseCategory.LABOR_FIXED]).toBe(1000000);
        expect(analytics.sections[0].costBreakdown[ExpenseCategory.MAINTENANCE]).toBe(500000);

        // Cleanup
        await ChickOut.deleteMany({ batchId: batch._id });
        await Batch.deleteOne({ _id: batch._id });
        await PeriodExpense.deleteMany({ periodId: period._id });
        await Section.deleteOne({ _id: section._id });
        await Period.deleteOne({ _id: period._id });
    });

    it('Test 4: BLOCKED status when no sections in period', async () => {
        const period = await Period.create({
            name: 'Empty Period ' + Date.now(),
            startDate: new Date(),
            status: 'ACTIVE',
            createdBy: directorUser._id
        });

        const analytics = await SectionInsightService.getPeriodAnalytics(period._id.toString());

        expect(analytics.status).toBe('BLOCKED');
        expect(analytics.sections.length).toBe(0);
        expect(analytics.summary.totalPeriodProfit).toBe(0);

        // Cleanup
        await Period.deleteOne({ _id: period._id });
    });

    it('Test 5: compareSections returns correct comparison', async () => {
        const period = await Period.create({
            name: 'Compare Test ' + Date.now(),
            startDate: new Date(),
            status: 'ACTIVE',
            createdBy: directorUser._id
        });

        const section1 = await Section.create({
            name: 'Winner Section',
            activePeriodId: period._id,
            createdBy: directorUser._id
        });

        const section2 = await Section.create({
            name: 'Loser Section',
            activePeriodId: period._id,
            createdBy: directorUser._id
        });

        const batch1 = await Batch.create({
            sectionId: section1._id,
            periodId: period._id,
            startedAt: new Date(),
            expectedEndAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            totalChicksIn: 1000,
            totalChicksOut: 900,
            createdBy: directorUser._id
        });

        const batch2 = await Batch.create({
            sectionId: section2._id,
            periodId: period._id,
            startedAt: new Date(),
            expectedEndAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            totalChicksIn: 1000,
            totalChicksOut: 800,
            createdBy: directorUser._id
        });

        // Winner: 10M revenue, 2M cost = 8M profit
        await ChickOut.create({
            sectionId: section1._id,
            batchId: batch1._id,
            date: new Date(),
            count: 900,
            avgWeight: 2.5,
            pricePerKg: 4444.44,
            totalWeight: 2250,
            totalRevenue: 10000000,
            vehicleNumber: 'TEST-005',
            machineNumber: 'M005',
            isFinal: true,
            status: ChickOutStatus.COMPLETE,
            createdBy: directorUser._id
        });

        await PeriodExpense.create({
            periodId: period._id,
            sectionId: section1._id.toString(),
            category: ExpenseCategory.ELECTRICITY,
            amount: 2000000,
            description: 'Electricity',
            expenseDate: new Date(),
            createdBy: directorUser._id
        });

        // Loser: 5M revenue, 3M cost = 2M profit
        await ChickOut.create({
            sectionId: section2._id,
            batchId: batch2._id,
            date: new Date(),
            count: 800,
            avgWeight: 2.5,
            pricePerKg: 2500,
            totalWeight: 2000,
            totalRevenue: 5000000,
            vehicleNumber: 'TEST-006',
            machineNumber: 'M006',
            isFinal: true,
            status: ChickOutStatus.COMPLETE,
            createdBy: directorUser._id
        });

        await PeriodExpense.create({
            periodId: period._id,
            sectionId: section2._id.toString(),
            category: ExpenseCategory.ELECTRICITY,
            amount: 3000000,
            description: 'Electricity',
            expenseDate: new Date(),
            createdBy: directorUser._id
        });

        const comparison = await SectionInsightService.compareSections(
            section1._id.toString(),
            section2._id.toString()
        );

        expect(comparison.section1.sectionName).toBe('Winner Section');
        expect(comparison.section2.sectionName).toBe('Loser Section');
        expect(comparison.comparison.winner).toBe('Winner Section');
        expect(comparison.comparison.profitDifference).toBe(6000000); // 8M - 2M

        // Cleanup
        await ChickOut.deleteMany({ batchId: { $in: [batch1._id, batch2._id] } });
        await Batch.deleteMany({ _id: { $in: [batch1._id, batch2._id] } });
        await PeriodExpense.deleteMany({ periodId: period._id });
        await Section.deleteMany({ _id: { $in: [section1._id, section2._id] } });
        await Period.deleteOne({ _id: period._id });
    });
});
