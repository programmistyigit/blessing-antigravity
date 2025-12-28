import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
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
import { SectionPLService } from '../../src/modules/sections/section-pl.service';

describe('Section P&L E2E Tests', () => {
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
        let director = await User.findOne({ username: 'test_director_section_pl' });
        if (!director) {
            director = await User.create({
                username: 'test_director_section_pl',
                passwordHash: 'hashed_password',
                fullName: 'Test Director Section PL',
                role: directorRole._id,
                isActive: true
            });
        }
        directorUser = director;
    });

    afterAll(async () => {
        await disconnectDatabase();
    });

    it('Test 1: Section revenue from COMPLETE ChickOuts', async () => {
        // Create fresh test data
        const period = await Period.create({
            name: 'Test Period Revenue ' + Date.now(),
            startDate: new Date(),
            status: 'ACTIVE',
            createdBy: directorUser._id
        });

        const section = await Section.create({
            name: 'Test Section Revenue ' + Date.now(),
            status: 'ACTIVE',
            activePeriodId: period._id,
            createdBy: directorUser._id
        });

        const batch = await Batch.create({
            sectionId: section._id,
            periodId: period._id,
            totalChicksIn: 5000,
            startedAt: new Date(),
            expectedEndAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            status: 'ACTIVE',
            createdBy: directorUser._id
        });

        // Create COMPLETE ChickOut
        await ChickOut.create({
            batchId: batch._id,
            sectionId: section._id,
            date: new Date(),
            count: 1000,
            vehicleNumber: 'Test',
            machineNumber: 'M001',
            isFinal: false,
            status: ChickOutStatus.COMPLETE,
            totalWeightKg: 2500,
            netWeightKg: 2375,
            wastePercent: 5,
            pricePerKg: 20000,
            totalRevenue: 47500000,
            createdBy: directorUser._id,
            completedBy: directorUser._id,
            completedAt: new Date()
        });

        const pl = await SectionPLService.getSectionPL(section._id.toString());

        expect(pl.totalRevenue).toBe(47500000);
        expect(pl.sectionName).toBe(section.name);

        // Cleanup
        await ChickOut.deleteMany({ batchId: batch._id });
        await Batch.findByIdAndDelete(batch._id);
        await Section.findByIdAndDelete(section._id);
        await Period.findByIdAndDelete(period._id);
    });

    it('Test 2: Section expenses from PeriodExpense', async () => {
        const period = await Period.create({
            name: 'Test Period Expense ' + Date.now(),
            startDate: new Date(),
            status: 'ACTIVE',
            createdBy: directorUser._id
        });

        const section = await Section.create({
            name: 'Test Section Expense ' + Date.now(),
            status: 'ACTIVE',
            activePeriodId: period._id,
            createdBy: directorUser._id
        });

        // Add expenses for this section
        await PeriodExpense.create({
            periodId: period._id,
            sectionId: section._id,
            category: ExpenseCategory.ELECTRICITY,
            amount: 5000000,
            expenseDate: new Date(),
            createdBy: directorUser._id
        });

        await PeriodExpense.create({
            periodId: period._id,
            sectionId: section._id,
            category: ExpenseCategory.LABOR_FIXED,
            amount: 3000000,
            expenseDate: new Date(),
            createdBy: directorUser._id
        });

        const pl = await SectionPLService.getSectionPL(section._id.toString());

        expect(pl.totalExpenses).toBe(8000000);

        // Cleanup
        await PeriodExpense.deleteMany({ sectionId: section._id });
        await Section.findByIdAndDelete(section._id);
        await Period.findByIdAndDelete(period._id);
    });

    it('Test 3: profit = revenue - expense', async () => {
        const period = await Period.create({
            name: 'Test Period Profit ' + Date.now(),
            startDate: new Date(),
            status: 'ACTIVE',
            createdBy: directorUser._id
        });

        const section = await Section.create({
            name: 'Test Section Profit ' + Date.now(),
            status: 'ACTIVE',
            activePeriodId: period._id,
            createdBy: directorUser._id
        });

        const batch = await Batch.create({
            sectionId: section._id,
            periodId: period._id,
            totalChicksIn: 5000,
            startedAt: new Date(),
            expectedEndAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            status: 'ACTIVE',
            createdBy: directorUser._id
        });

        // Revenue: 10,000,000
        await ChickOut.create({
            batchId: batch._id,
            sectionId: section._id,
            date: new Date(),
            count: 500,
            vehicleNumber: 'Test',
            machineNumber: 'M001',
            isFinal: false,
            status: ChickOutStatus.COMPLETE,
            totalWeightKg: 1000,
            netWeightKg: 1000,
            wastePercent: 0,
            pricePerKg: 10000,
            totalRevenue: 10000000,
            createdBy: directorUser._id,
            completedBy: directorUser._id,
            completedAt: new Date()
        });

        // Expense: 3,000,000
        await PeriodExpense.create({
            periodId: period._id,
            sectionId: section._id,
            category: ExpenseCategory.ELECTRICITY,
            amount: 3000000,
            expenseDate: new Date(),
            createdBy: directorUser._id
        });

        const pl = await SectionPLService.getSectionPL(section._id.toString());

        expect(pl.profit).toBe(10000000 - 3000000);
        expect(pl.isProfitable).toBe(true);

        // Cleanup
        await PeriodExpense.deleteMany({ sectionId: section._id });
        await ChickOut.deleteMany({ batchId: batch._id });
        await Batch.findByIdAndDelete(batch._id);
        await Section.findByIdAndDelete(section._id);
        await Period.findByIdAndDelete(period._id);
    });

    it('Test 4: INCOMPLETE ChickOut causes ERROR', async () => {
        const period = await Period.create({
            name: 'Test Period Incomplete ' + Date.now(),
            startDate: new Date(),
            status: 'ACTIVE',
            createdBy: directorUser._id
        });

        const section = await Section.create({
            name: 'Test Section Incomplete ' + Date.now(),
            status: 'ACTIVE',
            activePeriodId: period._id,
            createdBy: directorUser._id
        });

        const batch = await Batch.create({
            sectionId: section._id,
            periodId: period._id,
            totalChicksIn: 3000,
            startedAt: new Date(),
            expectedEndAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            status: 'ACTIVE',
            createdBy: directorUser._id
        });

        // Create INCOMPLETE ChickOut
        await ChickOut.create({
            batchId: batch._id,
            sectionId: section._id,
            date: new Date(),
            count: 500,
            vehicleNumber: 'Test',
            machineNumber: 'M002',
            isFinal: false,
            status: ChickOutStatus.INCOMPLETE,
            createdBy: directorUser._id
        });

        await expect(
            SectionPLService.getSectionPL(section._id.toString())
        ).rejects.toThrow('yakunlanmagan moliyaviy operatsiyalar');

        // Cleanup
        await ChickOut.deleteMany({ batchId: batch._id });
        await Batch.findByIdAndDelete(batch._id);
        await Section.findByIdAndDelete(section._id);
        await Period.findByIdAndDelete(period._id);
    });

    it('Test 5: No expenses - profit = revenue', async () => {
        const period = await Period.create({
            name: 'Test Period NoExp ' + Date.now(),
            startDate: new Date(),
            status: 'ACTIVE',
            createdBy: directorUser._id
        });

        const section = await Section.create({
            name: 'Test Section NoExp ' + Date.now(),
            status: 'ACTIVE',
            activePeriodId: period._id,
            createdBy: directorUser._id
        });

        const batch = await Batch.create({
            sectionId: section._id,
            periodId: period._id,
            totalChicksIn: 2000,
            startedAt: new Date(),
            expectedEndAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            status: 'ACTIVE',
            createdBy: directorUser._id
        });

        await ChickOut.create({
            batchId: batch._id,
            sectionId: section._id,
            date: new Date(),
            count: 800,
            vehicleNumber: 'Test',
            machineNumber: 'M003',
            isFinal: false,
            status: ChickOutStatus.COMPLETE,
            totalWeightKg: 2000,
            netWeightKg: 2000,
            wastePercent: 0,
            pricePerKg: 15000,
            totalRevenue: 30000000,
            createdBy: directorUser._id,
            completedBy: directorUser._id,
            completedAt: new Date()
        });

        const pl = await SectionPLService.getSectionPL(section._id.toString());

        expect(pl.totalExpenses).toBe(0);
        expect(pl.profit).toBe(pl.totalRevenue);
        expect(pl.isProfitable).toBe(true);

        // Cleanup
        await ChickOut.deleteMany({ batchId: batch._id });
        await Batch.findByIdAndDelete(batch._id);
        await Section.findByIdAndDelete(section._id);
        await Period.findByIdAndDelete(period._id);
    });

    it('Test 6: No revenue - profit = -expense', async () => {
        const period = await Period.create({
            name: 'Test Period NoRev ' + Date.now(),
            startDate: new Date(),
            status: 'ACTIVE',
            createdBy: directorUser._id
        });

        const section = await Section.create({
            name: 'Test Section NoRev ' + Date.now(),
            status: 'ACTIVE',
            activePeriodId: period._id,
            createdBy: directorUser._id
        });

        await PeriodExpense.create({
            periodId: period._id,
            sectionId: section._id,
            category: ExpenseCategory.MAINTENANCE,
            amount: 2000000,
            expenseDate: new Date(),
            createdBy: directorUser._id
        });

        const pl = await SectionPLService.getSectionPL(section._id.toString());

        expect(pl.totalRevenue).toBe(0);
        expect(pl.totalExpenses).toBe(2000000);
        expect(pl.profit).toBe(-2000000);
        expect(pl.isProfitable).toBe(false);

        // Cleanup
        await PeriodExpense.deleteMany({ sectionId: section._id });
        await Section.findByIdAndDelete(section._id);
        await Period.findByIdAndDelete(period._id);
    });
});
