import { Period } from './period.model';
import { PeriodExpense, ExpenseCategory } from './period-expense.model';

/**
 * Category Breakdown Item Interface
 * Har bir kategoriya uchun xarajat ma'lumoti
 */
export interface ICategoryBreakdown {
    category: ExpenseCategory;
    amount: number;
    percentage: number;
}

/**
 * Period Cost Breakdown Interface
 * Davr bo'yicha xarajat tahlili
 */
export interface IPeriodCostBreakdown {
    periodId: string;
    totalExpenses: number;
    breakdown: ICategoryBreakdown[];
}

/**
 * Period Cost Breakdown Service
 * Davr bo'yicha xarajatlarni kategoriyalar kesimida tahlil qilish
 * 
 * Savollar:
 * - Pul qayerga ketdi?
 * - Qaysi kategoriya eng katta ulushni oldi?
 */
export class PeriodCostBreakdownService {
    /**
     * Get cost breakdown for a period
     * 
     * Formulalar:
     * - totalExpenses = SUM(all amounts)
     * - categoryTotal = SUM(amount where category = X)
     * - percentage = (categoryTotal / totalExpenses) * 100
     * 
     * Qoidalar:
     * - Agar period mavjud bo'lmasa → ERROR
     * - Agar expense yo'q bo'lsa → bo'sh breakdown (0 qiymatlar)
     * - Agar totalExpenses = 0 → barcha percentage = 0
     */
    static async getCostBreakdown(periodId: string): Promise<IPeriodCostBreakdown> {
        // 1. Validate period exists
        const period = await Period.findById(periodId);
        if (!period) {
            throw new Error('Period not found');
        }

        // 2. Aggregate expenses by category
        const aggregation = await PeriodExpense.aggregate([
            { $match: { periodId: period._id } },
            {
                $group: {
                    _id: '$category',
                    amount: { $sum: '$amount' }
                }
            }
        ]);

        // 3. Calculate total expenses
        let totalExpenses = 0;
        const categoryTotals = new Map<string, number>();

        for (const item of aggregation) {
            totalExpenses += item.amount;
            categoryTotals.set(item._id, item.amount);
        }

        // 4. Build breakdown with all categories
        const allCategories = Object.values(ExpenseCategory);
        const breakdown: ICategoryBreakdown[] = allCategories.map(category => {
            const amount = categoryTotals.get(category) || 0;
            const percentage = totalExpenses > 0
                ? Math.round((amount / totalExpenses) * 10000) / 100  // Round to 2 decimals
                : 0;

            return {
                category,
                amount,
                percentage
            };
        });

        // 5. Sort by amount descending (highest first)
        breakdown.sort((a, b) => b.amount - a.amount);

        return {
            periodId,
            totalExpenses,
            breakdown
        };
    }

    /**
     * Get top expense categories
     * Utility method: eng katta xarajat kategoriyalarini olish
     */
    static async getTopCategories(periodId: string, limit: number = 3): Promise<ICategoryBreakdown[]> {
        const result = await this.getCostBreakdown(periodId);
        return result.breakdown.slice(0, limit);
    }
}
