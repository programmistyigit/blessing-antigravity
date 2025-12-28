import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../src/core/database';
import { initializeDatabase } from '../../src/utils/init.util';

// Models
import { Period } from '../../src/modules/periods/period.model';
import { PeriodExpense, ExpenseCategory } from '../../src/modules/periods/period-expense.model';
import { User } from '../../src/modules/users/user.model';

// Services
import { PeriodService } from '../../src/modules/periods/period.service';
import { PeriodCostBreakdownService } from '../../src/modules/periods/period-cost-breakdown.service';

/**
 * Period Cost Breakdown E2E Tests
 * A2 — Faqat shu bosqichga oid testlar
 * 
 * ❗ FULL TEST QILINMASIN
 * ❗ npm test tests/e2e/period-cost-breakdown.test.ts
 */
describe('Period Cost Breakdown E2E Tests', () => {
    let directorUserId: string;
    let cleanupIds: {
        periods: string[],
        expenses: string[]
    } = {
        periods: [],
        expenses: []
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
        for (const id of cleanupIds.expenses) {
            await PeriodExpense.findByIdAndDelete(id);
        }
        for (const id of cleanupIds.periods) {
            await Period.findByIdAndDelete(id);
        }
        await disconnectDatabase();
    });

    // =========================================
    // TEST 1: Bir nechta kategoriyalar → to'g'ri jamlanadi
    // =========================================
    it('Test 1: Bir nechta kategoriyalar → to\'g\'ri jamlanadi', async () => {
        // Create period
        const period = await PeriodService.createPeriod({
            name: 'Cost Breakdown Test 1',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // Add expenses in different categories
        const expense1 = await PeriodExpense.create({
            periodId: period._id,
            category: ExpenseCategory.ELECTRICITY,
            amount: 5000000,  // 5M
            description: 'Elektr',
            expenseDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.expenses.push(expense1._id.toString());

        const expense2 = await PeriodExpense.create({
            periodId: period._id,
            category: ExpenseCategory.LABOR_FIXED,
            amount: 10000000,  // 10M
            description: 'Ish haqi',
            expenseDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.expenses.push(expense2._id.toString());

        const expense3 = await PeriodExpense.create({
            periodId: period._id,
            category: ExpenseCategory.MAINTENANCE,
            amount: 3000000,  // 3M
            description: 'Ta\'mirlash',
            expenseDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.expenses.push(expense3._id.toString());

        // Get breakdown
        const breakdown = await PeriodCostBreakdownService.getCostBreakdown(period._id.toString());

        expect(breakdown.periodId).toBe(period._id.toString());
        expect(breakdown.totalExpenses).toBe(18000000);  // 5M + 10M + 3M = 18M

        // Check category amounts
        const electricityItem = breakdown.breakdown.find(b => b.category === ExpenseCategory.ELECTRICITY);
        const laborItem = breakdown.breakdown.find(b => b.category === ExpenseCategory.LABOR_FIXED);
        const maintenanceItem = breakdown.breakdown.find(b => b.category === ExpenseCategory.MAINTENANCE);

        expect(electricityItem?.amount).toBe(5000000);
        expect(laborItem?.amount).toBe(10000000);
        expect(maintenanceItem?.amount).toBe(3000000);
    });

    // =========================================
    // TEST 2: Percentage to'g'ri hisoblanadi
    // =========================================
    it('Test 2: Percentage to\'g\'ri hisoblanadi', async () => {
        // Create period
        const period = await PeriodService.createPeriod({
            name: 'Cost Breakdown Test 2',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // Add expenses: 75% ELECTRICITY, 25% LABOR
        const expense1 = await PeriodExpense.create({
            periodId: period._id,
            category: ExpenseCategory.ELECTRICITY,
            amount: 75000000,  // 75M
            description: 'Elektr',
            expenseDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.expenses.push(expense1._id.toString());

        const expense2 = await PeriodExpense.create({
            periodId: period._id,
            category: ExpenseCategory.LABOR_FIXED,
            amount: 25000000,  // 25M
            description: 'Ish haqi',
            expenseDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.expenses.push(expense2._id.toString());

        // Get breakdown
        const breakdown = await PeriodCostBreakdownService.getCostBreakdown(period._id.toString());

        expect(breakdown.totalExpenses).toBe(100000000);  // 100M

        // Check percentages
        const electricityItem = breakdown.breakdown.find(b => b.category === ExpenseCategory.ELECTRICITY);
        const laborItem = breakdown.breakdown.find(b => b.category === ExpenseCategory.LABOR_FIXED);

        expect(electricityItem?.percentage).toBe(75);
        expect(laborItem?.percentage).toBe(25);
    });

    // =========================================
    // TEST 3: totalExpenses = 0 → breakdown 0%
    // =========================================
    it('Test 3: totalExpenses = 0 → barcha percentage = 0', async () => {
        // Create period with NO expenses
        const period = await PeriodService.createPeriod({
            name: 'Cost Breakdown Test 3 - No Expenses',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // Get breakdown - should return 0 for all without error
        const breakdown = await PeriodCostBreakdownService.getCostBreakdown(period._id.toString());

        expect(breakdown.periodId).toBe(period._id.toString());
        expect(breakdown.totalExpenses).toBe(0);

        // All categories should have 0 amount and 0 percentage
        for (const item of breakdown.breakdown) {
            expect(item.amount).toBe(0);
            expect(item.percentage).toBe(0);
        }
    });

    // =========================================
    // TEST 4: Noma'lum period → ERROR
    // =========================================
    it('Test 4: Noma\'lum period → ERROR', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();

        await expect(
            PeriodCostBreakdownService.getCostBreakdown(fakeId)
        ).rejects.toThrow('Period not found');
    });

    // =========================================
    // TEST 5: Breakdown sorted by amount (highest first)
    // =========================================
    it('Test 5: Breakdown sorted by amount (highest first)', async () => {
        // Create period
        const period = await PeriodService.createPeriod({
            name: 'Cost Breakdown Test 5',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // Add expenses in random order
        const expense1 = await PeriodExpense.create({
            periodId: period._id,
            category: ExpenseCategory.TRANSPORT,
            amount: 2000000,  // 2M (smallest)
            expenseDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.expenses.push(expense1._id.toString());

        const expense2 = await PeriodExpense.create({
            periodId: period._id,
            category: ExpenseCategory.ELECTRICITY,
            amount: 8000000,  // 8M (largest)
            expenseDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.expenses.push(expense2._id.toString());

        const expense3 = await PeriodExpense.create({
            periodId: period._id,
            category: ExpenseCategory.MAINTENANCE,
            amount: 5000000,  // 5M (middle)
            expenseDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.expenses.push(expense3._id.toString());

        // Get breakdown
        const breakdown = await PeriodCostBreakdownService.getCostBreakdown(period._id.toString());

        // First 3 should be sorted by amount (highest first)
        expect(breakdown.breakdown[0].category).toBe(ExpenseCategory.ELECTRICITY);
        expect(breakdown.breakdown[0].amount).toBe(8000000);
        expect(breakdown.breakdown[1].category).toBe(ExpenseCategory.MAINTENANCE);
        expect(breakdown.breakdown[1].amount).toBe(5000000);
        expect(breakdown.breakdown[2].category).toBe(ExpenseCategory.TRANSPORT);
        expect(breakdown.breakdown[2].amount).toBe(2000000);
    });
});
