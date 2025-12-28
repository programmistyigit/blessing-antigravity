import { Period } from './period.model';
import { PeriodRevenueService } from './period-revenue.service';
import { PeriodExpense } from './period-expense.model';
import { Batch } from '../sections/batch.model';
import { ChickOut, ChickOutStatus } from '../sections/chick-out.model';
import { TechnicalIncident } from '../assets/incident.model';

/**
 * Period P&L (Profit & Loss) Interface
 * Davr bo'yicha moliyaviy natija
 */
export interface IPeriodPL {
    periodId: string;
    totalRevenue: number;
    totalExpenses: number;
    profit: number;          // revenue - expenses
    isProfitable: boolean;   // profit > 0
}

/**
 * Period P&L Service
 * Davr bo'yicha foyda/zarar hisoblash
 * 
 * FORMULA: PROFIT = TOTAL_REVENUE − TOTAL_EXPENSES
 */
export class PeriodPLService {
    /**
     * Get Period Profit & Loss
     * 
     * Qoidalar:
     * 1. Period mavjud bo'lishi shart
     * 2. INCOMPLETE ChickOut bo'lsa → BLOKLANGAN
     * 3. Xarajatsiz requiresExpense=true Incident bo'lsa → BLOKLANGAN
     * 4. Daromad yo'q bo'lsa → 0 (ERROR EMAS)
     * 5. Xarajat yo'q bo'lsa → 0 (ERROR EMAS)
     */
    static async getPeriodPL(periodId: string): Promise<IPeriodPL> {
        // 1. Validate period exists
        const period = await Period.findById(periodId);
        if (!period) {
            throw new Error('Period not found');
        }

        // 2. Get all batches for this period
        const batches = await Batch.find({ periodId });
        const batchIds = batches.map(b => b._id);

        // 3. Safety Guard #1: Check for INCOMPLETE ChickOuts
        if (batchIds.length > 0) {
            const incompleteChickOutCount = await ChickOut.countDocuments({
                batchId: { $in: batchIds },
                status: ChickOutStatus.INCOMPLETE
            });

            if (incompleteChickOutCount > 0) {
                throw new Error('Davrda yakunlanmagan moliyaviy operatsiyalar mavjud.');
            }
        }

        // 4. Safety Guard #2: Check for unresolved expense incidents
        // Query sections that are assigned to this period via activePeriodId
        const { Section } = await import('../sections/section.model');
        const assignedSections = await Section.find({ activePeriodId: period._id });
        const sectionIds = assignedSections.map(s => s._id);

        if (sectionIds.length > 0) {
            const unresolvedExpenseIncidents = await TechnicalIncident.countDocuments({
                sectionId: { $in: sectionIds },
                requiresExpense: true,
                expenseId: null,  // Hali xarajat yozilmagan
            });

            if (unresolvedExpenseIncidents > 0) {
                throw new Error('Davrda yakunlanmagan moliyaviy operatsiyalar mavjud.');
            }
        }

        // 5. Get revenue from PeriodRevenueService
        const revenueAggregation = await PeriodRevenueService.getRevenueAggregation(periodId);
        const totalRevenue = revenueAggregation.totalRevenue;

        // 6. Get total expenses using aggregation
        const expenseResult = await PeriodExpense.aggregate([
            { $match: { periodId: period._id } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalExpenses = expenseResult.length > 0 ? expenseResult[0].total : 0;

        // 7. Calculate profit
        const profit = totalRevenue - totalExpenses;
        const isProfitable = profit > 0;

        return {
            periodId,
            totalRevenue,
            totalExpenses,
            profit,
            isProfitable,
        };
    }

    /**
     * Check if period has unfinished financial operations
     * Utility method for quick checks
     */
    static async hasUnfinishedOperations(periodId: string): Promise<boolean> {
        const period = await Period.findById(periodId);
        if (!period) {
            throw new Error('Period not found');
        }

        // Check INCOMPLETE ChickOuts
        const batches = await Batch.find({ periodId });
        const batchIds = batches.map(b => b._id);

        if (batchIds.length > 0) {
            const incompleteCount = await ChickOut.countDocuments({
                batchId: { $in: batchIds },
                status: ChickOutStatus.INCOMPLETE
            });
            if (incompleteCount > 0) return true;
        }

        // Check unresolved expense incidents
        // Query sections that are assigned to this period via activePeriodId
        const { Section } = await import('../sections/section.model');
        const assignedSections = await Section.find({ activePeriodId: period._id });
        const sectionIdList = assignedSections.map(s => s._id);
        if (sectionIdList.length > 0) {
            const unresolvedCount = await TechnicalIncident.countDocuments({
                sectionId: { $in: sectionIdList },
                requiresExpense: true,
                expenseId: null,
            });
            if (unresolvedCount > 0) return true;
        }

        return false;
    }
}
