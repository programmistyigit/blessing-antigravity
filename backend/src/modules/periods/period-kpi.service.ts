import { Period } from './period.model';
import { Batch } from '../sections/batch.model';
import { ChickOut, ChickOutStatus } from '../sections/chick-out.model';
import { PeriodPLService } from './period-pl.service';

/**
 * Period KPI Totals Interface
 */
export interface IPeriodKPITotals {
    totalChicksIn: number;
    finalChicksOut: number;
    totalRevenue: number;
    totalExpenses: number;
    profit: number;
}

/**
 * Period KPI Metrics Interface
 */
export interface IPeriodKPIMetrics {
    profitMarginPercent: number;
    costPerChick: number;
    revenuePerChick: number;
    profitPerChick: number;
}

/**
 * Period KPI Full Response Interface
 */
export interface IPeriodKPI {
    periodId: string;
    totals: IPeriodKPITotals;
    kpis: IPeriodKPIMetrics;
}

/**
 * Period KPI Service
 * Davr bo'yicha asosiy KPI (Key Performance Indicators) hisoblash
 * 
 * A1 (Revenue), STEP 4 (P&L) ustiga quriladi
 */
export class PeriodKPIService {
    /**
     * Get Period KPI Metrics
     * 
     * Hisoblanadigan KPI'lar:
     * - profitMarginPercent = (profit / totalRevenue) * 100
     * - costPerChick = totalExpenses / totalChicksIn
     * - revenuePerChick = totalRevenue / finalChicksOut
     * - profitPerChick = profit / finalChicksOut
     * 
     * Nolga bo'lish:
     * - Agar bo'luvchi = 0 → natija = 0 (ERROR yo'q)
     */
    static async getPeriodKPI(periodId: string): Promise<IPeriodKPI> {
        // 1. Validate period exists
        const period = await Period.findById(periodId);
        if (!period) {
            throw new Error('Period not found');
        }

        // 2. Get P&L data (this will apply safety guards automatically)
        const plData = await PeriodPLService.getPeriodPL(periodId);

        // 3. Get all batches for this period
        const batches = await Batch.find({ periodId: period._id });
        const batchIds = batches.map(b => b._id);

        // 4. Calculate totalChicksIn from batches
        let totalChicksIn = 0;
        for (const batch of batches) {
            totalChicksIn += batch.totalChicksIn || 0;
        }

        // 5. Calculate finalChicksOut from COMPLETE ChickOuts
        let finalChicksOut = 0;
        if (batchIds.length > 0) {
            const completeChickOuts = await ChickOut.find({
                batchId: { $in: batchIds },
                status: ChickOutStatus.COMPLETE
            });
            for (const co of completeChickOuts) {
                finalChicksOut += co.count || 0;
            }
        }

        // 6. Extract totals from P&L
        const totalRevenue = plData.totalRevenue;
        const totalExpenses = plData.totalExpenses;
        const profit = plData.profit;

        // 7. Calculate KPIs with safe division
        const profitMarginPercent = totalRevenue > 0
            ? Math.round((profit / totalRevenue) * 10000) / 100
            : 0;

        const costPerChick = totalChicksIn > 0
            ? Math.round((totalExpenses / totalChicksIn) * 100) / 100
            : 0;

        const revenuePerChick = finalChicksOut > 0
            ? Math.round((totalRevenue / finalChicksOut) * 100) / 100
            : 0;

        const profitPerChick = finalChicksOut > 0
            ? Math.round((profit / finalChicksOut) * 100) / 100
            : 0;

        return {
            periodId,
            totals: {
                totalChicksIn,
                finalChicksOut,
                totalRevenue,
                totalExpenses,
                profit
            },
            kpis: {
                profitMarginPercent,
                costPerChick,
                revenuePerChick,
                profitPerChick
            }
        };
    }
}
