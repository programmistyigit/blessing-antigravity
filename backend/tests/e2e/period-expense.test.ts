import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../src/core/database';
import { initializeDatabase } from '../../src/utils/init.util';

// Models
import { Period, PeriodStatus } from '../../src/modules/periods/period.model';
import { PeriodExpense, ExpenseCategory } from '../../src/modules/periods/period-expense.model';
import { User } from '../../src/modules/users/user.model';

// Services
import { PeriodService } from '../../src/modules/periods/period.service';
import { PeriodExpenseService } from '../../src/modules/periods/period-expense.service';

describe('Period Expense E2E Tests', () => {
    let directorUserId: string;
    let cleanupIds: { periods: string[], expenses: string[] } = {
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

    it('Test 1: Can add expense to ACTIVE period', async () => {
        // Create period
        const period = await PeriodService.createPeriod({
            name: 'Expense Test Period',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // Add expense
        const expense = await PeriodExpenseService.addExpense({
            periodId: period._id.toString(),
            category: ExpenseCategory.ELECTRICITY,
            amount: 500000,
            description: 'Test elektr',
            expenseDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.expenses.push(expense._id.toString());

        expect(expense.periodId.toString()).toBe(period._id.toString());
        expect(expense.category).toBe(ExpenseCategory.ELECTRICITY);
        expect(expense.amount).toBe(500000);
    });

    it('Test 2: Cannot add expense to CLOSED period', async () => {
        // Create and close period
        const period = await PeriodService.createPeriod({
            name: 'Closed Expense Period',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());
        await PeriodService.closePeriod(period._id.toString());

        // Try to add expense -> should fail
        await expect(
            PeriodExpenseService.addExpense({
                periodId: period._id.toString(),
                category: ExpenseCategory.LABOR_FIXED,
                amount: 100000,
                expenseDate: new Date(),
                createdBy: directorUserId
            })
        ).rejects.toThrow('Cannot add expense to closed period');
    });

    it('Test 3: GET expenses returns correct list', async () => {
        // Create period
        const period = await PeriodService.createPeriod({
            name: 'List Expense Period',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // Add multiple expenses
        const expense1 = await PeriodExpenseService.addExpense({
            periodId: period._id.toString(),
            category: ExpenseCategory.TRANSPORT,
            amount: 200000,
            expenseDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.expenses.push(expense1._id.toString());

        const expense2 = await PeriodExpenseService.addExpense({
            periodId: period._id.toString(),
            category: ExpenseCategory.MAINTENANCE,
            amount: 300000,
            expenseDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.expenses.push(expense2._id.toString());

        // Get expenses
        const expenses = await PeriodExpenseService.getExpensesByPeriod(period._id.toString());

        expect(expenses.length).toBe(2);
        expect(expenses.some(e => e.category === ExpenseCategory.TRANSPORT)).toBe(true);
        expect(expenses.some(e => e.category === ExpenseCategory.MAINTENANCE)).toBe(true);
    });

    it('Test 4: Expense periodId saved correctly', async () => {
        // Create period
        const period = await PeriodService.createPeriod({
            name: 'ID Check Period',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // Add expense
        const expense = await PeriodExpenseService.addExpense({
            periodId: period._id.toString(),
            category: ExpenseCategory.OTHER,
            amount: 50000,
            description: 'Boshqa xarajat',
            expenseDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.expenses.push(expense._id.toString());

        // Verify from DB directly
        const dbExpense = await PeriodExpense.findById(expense._id);
        expect(dbExpense).toBeDefined();
        expect(dbExpense!.periodId.toString()).toBe(period._id.toString());
    });
});
