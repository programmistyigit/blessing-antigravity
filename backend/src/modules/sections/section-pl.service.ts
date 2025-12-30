import mongoose from 'mongoose';
import { Section } from './section.model';
import { Batch } from './batch.model';
import { ChickOut, ChickOutStatus } from './chick-out.model';
import { SectionDailyReport } from './report.model';
import { PeriodExpense } from '../periods/period-expense.model';
import { TechnicalIncident } from '../assets/incident.model';

/**
 * Section P&L Metrics Interface
 * Corrected per-chick calculations
 */
export interface ISectionPLMetrics {
    costPerAliveChick: number | null;      // totalExpenses / aliveChicks
    revenuePerSoldChick: number | null;    // totalRevenue / soldChicks
    profitPerSoldChick: number | null;     // profit / soldChicks
    aliveChicks: number;                   // total still alive
    soldChicks: number;                    // total sold (from COMPLETE ChickOuts)
    deadChicks: number;                    // total deaths
}

/**
 * Section P&L (Profit & Loss) Interface
 * Sex bo'yicha moliyaviy natija
 */
export interface ISectionPL {
    sectionId: string;
    sectionName: string;
    totalRevenue: number;
    totalExpenses: number;
    profit: number;
    isProfitable: boolean;
    metrics: ISectionPLMetrics;
}

/**
 * Section P&L Service
 * Sex bo'yicha foyda/zarar hisoblash
 * 
 * FORMULA: PROFIT = SECTION_REVENUE − SECTION_EXPENSES
 * 
 * Revenue = SUM(ChickOut.totalRevenue) WHERE batch.sectionId = X AND status = COMPLETE
 * Expenses = SUM(PeriodExpense.amount) WHERE sectionId = X
 */
export class SectionPLService {
    /**
     * Get Section Profit & Loss
     * 
     * Qoidalar:
     * 1. Section mavjud bo'lishi shart
     * 2. INCOMPLETE ChickOut bo'lsa → BLOKLANGAN
     * 3. Xarajatsiz requiresExpense=true Incident bo'lsa → BLOKLANGAN
     * 4. Daromad yo'q bo'lsa → 0 (ERROR EMAS)
     * 5. Xarajat yo'q bo'lsa → 0 (ERROR EMAS)
     */
    static async getSectionPL(sectionId: string): Promise<ISectionPL> {
        // 1. Validate section exists
        const section = await Section.findById(sectionId);
        if (!section) {
            throw new Error('Section not found');
        }

        // 2. Get all batches for this section
        const batches = await Batch.find({ sectionId: section._id });
        const batchIds = batches.map(b => b._id);

        // 3. Safety Guard #1: Check for INCOMPLETE ChickOuts
        if (batchIds.length > 0) {
            const incompleteChickOutCount = await ChickOut.countDocuments({
                batchId: { $in: batchIds },
                status: ChickOutStatus.INCOMPLETE
            });

            if (incompleteChickOutCount > 0) {
                throw new Error('Sex bo\'yicha yakunlanmagan moliyaviy operatsiyalar mavjud.');
            }
        }

        // 4. Safety Guard #2: Check for unresolved expense incidents
        const unresolvedExpenseIncidents = await TechnicalIncident.countDocuments({
            sectionId: section._id,
            requiresExpense: true,
            expenseId: null,
        });

        if (unresolvedExpenseIncidents > 0) {
            throw new Error('Sex bo\'yicha yakunlanmagan moliyaviy operatsiyalar mavjud.');
        }

        // 5. Calculate Revenue from COMPLETE ChickOuts
        let totalRevenue = 0;
        let totalChicksOut = 0;

        if (batchIds.length > 0) {
            const completeChickOuts = await ChickOut.find({
                batchId: { $in: batchIds },
                status: ChickOutStatus.COMPLETE
            });

            for (const co of completeChickOuts) {
                totalRevenue += co.totalRevenue || 0;
                totalChicksOut += co.count || 0;
            }
        }

        // 6. Calculate Expenses for this section
        const sectionObjectId = new mongoose.Types.ObjectId(section._id.toString());
        const expenseResult = await PeriodExpense.aggregate([
            { $match: { sectionId: sectionObjectId } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalExpenses = expenseResult.length > 0 ? expenseResult[0].total : 0;

        // 7. Calculate chick counts for metrics
        let totalChicksIn = 0;
        for (const batch of batches) {
            totalChicksIn += batch.totalChicksIn || 0;
        }

        // Aggregate deaths from DailyReports
        let totalDeaths = 0;
        if (batchIds.length > 0) {
            const deathsResult = await SectionDailyReport.aggregate([
                { $match: { batchId: { $in: batchIds } } },
                { $group: { _id: null, total: { $sum: '$deaths' } } }
            ]);
            totalDeaths = deathsResult.length > 0 ? deathsResult[0].total : 0;
        }

        const soldChicks = totalChicksOut;
        const aliveChicks = Math.max(0, totalChicksIn - soldChicks - totalDeaths);

        // 8. Calculate profit and metrics
        const profit = totalRevenue - totalExpenses;
        const isProfitable = profit > 0;

        // Corrected metrics with edge cases:
        // All metrics return null when denominator is 0 for consistency
        // Frontend can distinguish between "no data" (null) and "zero value" (0)
        const metrics: ISectionPLMetrics = {
            costPerAliveChick: totalChicksIn > 0
                ? Math.round((totalExpenses / totalChicksIn) * 100) / 100
                : null,
            revenuePerSoldChick: soldChicks > 0
                ? Math.round((totalRevenue / soldChicks) * 100) / 100
                : null,
            profitPerSoldChick: soldChicks > 0
                ? Math.round((profit / soldChicks) * 100) / 100
                : null,
            aliveChicks,
            soldChicks,
            deadChicks: totalDeaths,
        };

        return {
            sectionId: section._id.toString(),
            sectionName: section.name,
            totalRevenue,
            totalExpenses,
            profit,
            isProfitable,
            metrics,
        };
    }

    /**
     * Get P&L for all sections in a period
     * Uses Batch.periodId for historical data (not Section.activePeriodId)
     */
    static async getAllSectionsPLForPeriod(periodId: string): Promise<ISectionPL[]> {
        const mongoose = await import('mongoose');
        const periodObjectId = new mongoose.Types.ObjectId(periodId);

        // Find all batches for this period → then get unique sectionIds
        const batches = await Batch.find({ periodId: periodObjectId });
        const sectionIds = [...new Set(batches.map(b => b.sectionId.toString()))];

        if (sectionIds.length === 0) {
            return [];
        }

        // Get sections
        const sections = await Section.find({ _id: { $in: sectionIds } });

        const results: ISectionPL[] = [];
        const errors: string[] = [];

        for (const section of sections) {
            try {
                const pl = await this.getSectionPL(section._id.toString());
                results.push(pl);
            } catch (err: any) {
                // Collect errors but continue with other sections
                errors.push(`${section.name}: ${err.message}`);
            }
        }

        // If all sections have errors, throw
        if (results.length === 0 && errors.length > 0) {
            throw new Error(`Barcha seksiyalarda xatolik: ${errors.join('; ')}`);
        }

        return results;
    }

    /**
     * Check if section has unfinished financial operations
     */
    static async hasUnfinishedOperations(sectionId: string): Promise<boolean> {
        const section = await Section.findById(sectionId);
        if (!section) {
            throw new Error('Section not found');
        }

        // Check INCOMPLETE ChickOuts
        const batches = await Batch.find({ sectionId: section._id });
        const batchIds = batches.map(b => b._id);

        if (batchIds.length > 0) {
            const incompleteCount = await ChickOut.countDocuments({
                batchId: { $in: batchIds },
                status: ChickOutStatus.INCOMPLETE
            });
            if (incompleteCount > 0) return true;
        }

        // Check unresolved expense incidents
        const unresolvedCount = await TechnicalIncident.countDocuments({
            sectionId: section._id,
            requiresExpense: true,
            expenseId: null,
        });
        if (unresolvedCount > 0) return true;

        return false;
    }
}
