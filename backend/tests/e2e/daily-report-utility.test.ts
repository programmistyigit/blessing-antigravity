import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../src/core/database';
import { initializeDatabase } from '../../src/utils/init.util';

// Models
import { Period, PeriodStatus } from '../../src/modules/periods/period.model';
import { PeriodExpense, ExpenseCategory } from '../../src/modules/periods/period-expense.model';
import { Section, SectionStatus } from '../../src/modules/sections/section.model';
import { Batch, BatchStatus } from '../../src/modules/sections/batch.model';
import { SectionDailyReport } from '../../src/modules/sections/report.model';
import { User } from '../../src/modules/users/user.model';
import { Role } from '../../src/modules/roles/role.model';
import { InventoryItem, InventoryHistory, InventoryCategory } from '../../src/modules/inventory/inventory.model';

// Services
import { PeriodService } from '../../src/modules/periods/period.service';
import { SectionService } from '../../src/modules/sections/section.service';
import { BatchService } from '../../src/modules/sections/batch.service';
import { ReportService } from '../../src/modules/sections/report.service';
import { UtilityExpenseService } from '../../src/modules/periods/utility-expense.service';

describe('Daily Report Utility Expense Integration', () => {
    let directorUser: any;
    let testSection: any;
    let testPeriod: any;
    let testBatch: any;
    let cleanupIds: {
        periods: string[],
        sections: string[],
        batches: string[],
        reports: string[],
        expenses: string[]
    } = {
        periods: [],
        sections: [],
        batches: [],
        reports: [],
        expenses: []
    };

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
        let director = await User.findOne({ username: 'test_director_utility' });
        if (!director) {
            director = await User.create({
                username: 'test_director_utility',
                passwordHash: 'hashed_password',
                fullName: 'Test Director Utility',
                role: directorRole._id,
                isActive: true
            });
        }
        directorUser = director;

        // Create test period
        testPeriod = await PeriodService.createPeriod({
            name: 'Utility Test Period ' + Date.now(),
            startDate: new Date(),
            createdBy: directorUser._id.toString()
        });
        cleanupIds.periods.push(testPeriod._id.toString());

        // Create test section
        testSection = await SectionService.createSection({
            name: 'Utility Test Section ' + Date.now(),
            createdBy: directorUser._id.toString()
        });
        cleanupIds.sections.push(testSection._id.toString());

        // Assign section to period
        testSection.activePeriodId = testPeriod._id;
        testSection.assignedWorkers = [directorUser._id];
        await testSection.save();

        // Create batch for section
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 45);

        testBatch = await BatchService.createBatch({
            sectionId: testSection._id.toString(),
            expectedEndAt: futureDate,
            totalChicksIn: 5000,
            createdBy: directorUser._id.toString()
        });
        cleanupIds.batches.push(testBatch._id.toString());
    });

    afterAll(async () => {
        // Cleanup in reverse order
        for (const id of cleanupIds.expenses) {
            await PeriodExpense.findByIdAndDelete(id);
        }
        for (const id of cleanupIds.reports) {
            await SectionDailyReport.findByIdAndDelete(id);
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

    it('Test 1: DailyReport with waterUsedLiters creates WATER PeriodExpense', async () => {
        const reportDate = new Date();
        reportDate.setDate(reportDate.getDate() - 1);

        const report = await ReportService.createReport({
            sectionId: testSection._id.toString(),
            date: reportDate.toISOString(),
            avgWeight: 1.2,
            totalWeight: 6000,
            deaths: 0,
            feedUsedKg: 100,
            waterUsedLiters: 500,
            electricityUsedKwh: 0,
            createdBy: directorUser._id.toString()
        }, directorUser);
        cleanupIds.reports.push(report._id.toString());

        // Check WATER expense was created
        const expenses = await PeriodExpense.find({
            dailyReportId: report._id,
            category: ExpenseCategory.WATER
        });

        expect(expenses.length).toBe(1);
        expect(expenses[0].quantity).toBe(500);
        expect(expenses[0].source).toBe('DAILY_REPORT');
        cleanupIds.expenses.push(expenses[0]._id.toString());
    });

    it('Test 2: DailyReport with electricityUsedKwh creates ELECTRICITY PeriodExpense', async () => {
        const reportDate = new Date();
        reportDate.setDate(reportDate.getDate() - 2);

        const report = await ReportService.createReport({
            sectionId: testSection._id.toString(),
            date: reportDate.toISOString(),
            avgWeight: 1.3,
            totalWeight: 6500,
            deaths: 0,
            feedUsedKg: 110,
            waterUsedLiters: 0,
            electricityUsedKwh: 250,
            createdBy: directorUser._id.toString()
        }, directorUser);
        cleanupIds.reports.push(report._id.toString());

        // Check ELECTRICITY expense was created
        const expenses = await PeriodExpense.find({
            dailyReportId: report._id,
            category: ExpenseCategory.ELECTRICITY
        });

        expect(expenses.length).toBe(1);
        expect(expenses[0].quantity).toBe(250);
        expect(expenses[0].source).toBe('DAILY_REPORT');
        cleanupIds.expenses.push(expenses[0]._id.toString());
    });

    it('Test 3: WATER expense amount = quantity × WATER_TARIFF', async () => {
        const reportDate = new Date();
        reportDate.setDate(reportDate.getDate() - 3);

        const waterLiters = 300;
        const report = await ReportService.createReport({
            sectionId: testSection._id.toString(),
            date: reportDate.toISOString(),
            avgWeight: 1.4,
            totalWeight: 7000,
            deaths: 0,
            feedUsedKg: 120,
            waterUsedLiters: waterLiters,
            electricityUsedKwh: 0,
            createdBy: directorUser._id.toString()
        }, directorUser);
        cleanupIds.reports.push(report._id.toString());

        const expense = await PeriodExpense.findOne({
            dailyReportId: report._id,
            category: ExpenseCategory.WATER
        });

        expect(expense).toBeDefined();
        expect(expense!.amount).toBe(waterLiters * UtilityExpenseService.WATER_TARIFF);
        expect(expense!.unitCost).toBe(UtilityExpenseService.WATER_TARIFF);
        cleanupIds.expenses.push(expense!._id.toString());
    });

    it('Test 4: ELECTRICITY expense amount = quantity × ELECTRICITY_TARIFF', async () => {
        const reportDate = new Date();
        reportDate.setDate(reportDate.getDate() - 4);

        const kwhUsed = 150;
        const report = await ReportService.createReport({
            sectionId: testSection._id.toString(),
            date: reportDate.toISOString(),
            avgWeight: 1.5,
            totalWeight: 7500,
            deaths: 0,
            feedUsedKg: 130,
            waterUsedLiters: 0,
            electricityUsedKwh: kwhUsed,
            createdBy: directorUser._id.toString()
        }, directorUser);
        cleanupIds.reports.push(report._id.toString());

        const expense = await PeriodExpense.findOne({
            dailyReportId: report._id,
            category: ExpenseCategory.ELECTRICITY
        });

        expect(expense).toBeDefined();
        expect(expense!.amount).toBe(kwhUsed * UtilityExpenseService.ELECTRICITY_TARIFF);
        expect(expense!.unitCost).toBe(UtilityExpenseService.ELECTRICITY_TARIFF);
        cleanupIds.expenses.push(expense!._id.toString());
    });

    it('Test 5: WATER/ELECTRICITY do NOT create InventoryHistory entries', async () => {
        // Get current inventory history count
        const beforeCount = await InventoryHistory.countDocuments();

        const reportDate = new Date();
        reportDate.setDate(reportDate.getDate() - 5);

        const report = await ReportService.createReport({
            sectionId: testSection._id.toString(),
            date: reportDate.toISOString(),
            avgWeight: 1.6,
            totalWeight: 8000,
            deaths: 0,
            feedUsedKg: 140,
            waterUsedLiters: 1000,
            electricityUsedKwh: 500,
            createdBy: directorUser._id.toString()
        }, directorUser);
        cleanupIds.reports.push(report._id.toString());

        // Check no new inventory history entries for WATER/ELECTRICITY
        const afterCount = await InventoryHistory.countDocuments();

        // Should be the same (no inventory consume for utilities)
        expect(afterCount).toBe(beforeCount);

        // Cleanup expenses
        const expenses = await PeriodExpense.find({ dailyReportId: report._id });
        for (const exp of expenses) {
            cleanupIds.expenses.push(exp._id.toString());
        }
    });

    it('Test 6: PeriodExpense.dailyReportId correctly links to report', async () => {
        const reportDate = new Date();
        reportDate.setDate(reportDate.getDate() - 6);

        const report = await ReportService.createReport({
            sectionId: testSection._id.toString(),
            date: reportDate.toISOString(),
            avgWeight: 1.7,
            totalWeight: 8500,
            deaths: 0,
            feedUsedKg: 150,
            waterUsedLiters: 200,
            electricityUsedKwh: 100,
            createdBy: directorUser._id.toString()
        }, directorUser);
        cleanupIds.reports.push(report._id.toString());

        // Both expenses should have dailyReportId
        const expenses = await PeriodExpense.find({ dailyReportId: report._id });

        expect(expenses.length).toBe(2);
        for (const exp of expenses) {
            expect(exp.dailyReportId?.toString()).toBe(report._id.toString());
            expect(exp.sectionId?.toString()).toBe(testSection._id.toString());
            expect(exp.periodId.toString()).toBe(testPeriod._id.toString());
            cleanupIds.expenses.push(exp._id.toString());
        }
    });
});
