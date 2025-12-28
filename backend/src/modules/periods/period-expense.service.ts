import { PeriodExpense, IPeriodExpense, ExpenseCategory } from './period-expense.model';
import { Period, PeriodStatus } from './period.model';

interface CreateExpenseData {
    periodId: string;
    category: ExpenseCategory;
    amount: number;
    description?: string;
    expenseDate: Date;
    createdBy: string;
}

/**
 * Period Expense Service
 * Period darajasidagi xarajatlarni boshqarish
 */
export class PeriodExpenseService {
    /**
     * Add expense to a period
     * Qoidalar:
     * - Period ACTIVE bo'lishi kerak
     * - Amount > 0
     * - expenseDate >= period.startDate
     */
    static async addExpense(data: CreateExpenseData): Promise<IPeriodExpense> {
        // Fetch period
        const period = await Period.findById(data.periodId);
        if (!period) {
            throw new Error('Period not found');
        }

        // Check period status
        if (period.status !== PeriodStatus.ACTIVE) {
            throw new Error('Cannot add expense to closed period');
        }

        // Validate amount
        if (data.amount <= 0) {
            throw new Error('Amount must be positive');
        }

        // Validate expense date
        if (data.expenseDate < period.startDate) {
            throw new Error('Expense date cannot be before period start date');
        }

        // Create expense
        const expense = new PeriodExpense({
            periodId: data.periodId,
            category: data.category,
            amount: data.amount,
            description: data.description || '',
            expenseDate: data.expenseDate,
            createdBy: data.createdBy,
        });

        await expense.save();
        return expense;
    }

    /**
     * Get all expenses for a period
     */
    static async getExpensesByPeriod(periodId: string): Promise<IPeriodExpense[]> {
        return PeriodExpense.find({ periodId })
            .sort({ expenseDate: -1 })
            .populate('createdBy', 'fullName username');
    }

    /**
     * Get total expenses by category for a period
     */
    static async getTotalByCategory(periodId: string): Promise<Record<ExpenseCategory, number>> {
        const expenses = await PeriodExpense.find({ periodId });

        const totals: Record<ExpenseCategory, number> = {
            [ExpenseCategory.ELECTRICITY]: 0,
            [ExpenseCategory.WATER]: 0,
            [ExpenseCategory.LABOR_FIXED]: 0,
            [ExpenseCategory.LABOR_DAILY]: 0,
            [ExpenseCategory.MAINTENANCE]: 0,
            [ExpenseCategory.TRANSPORT]: 0,
            [ExpenseCategory.ASSET_PURCHASE]: 0,
            [ExpenseCategory.ASSET_REPAIR]: 0,
            [ExpenseCategory.OTHER]: 0,
        };

        for (const expense of expenses) {
            totals[expense.category] += expense.amount;
        }

        return totals;
    }

    /**
     * Get total expenses for a period
     */
    static async getTotalExpenses(periodId: string): Promise<number> {
        const result = await PeriodExpense.aggregate([
            { $match: { periodId: periodId } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        return result.length > 0 ? result[0].total : 0;
    }
}
