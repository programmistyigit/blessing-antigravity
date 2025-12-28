import { Period } from './period.model';
import { Batch } from '../sections/batch.model';
import { ChickOut, ChickOutStatus } from '../sections/chick-out.model';

/**
 * Period Revenue Aggregation Interface
 * Davr bo'yicha daromad ma'lumotlari
 */
export interface IPeriodRevenueAggregation {
    periodId: string;
    totalRevenue: number;
    completedChickOutCount: number;
    batchCountWithRevenue: number;
}

/**
 * Period Revenue Service
 * FAQAT COMPLETE ChickOut'lardan daromad hisoblanadi
 */
export class PeriodRevenueService {
    /**
     * Get revenue aggregation for a period
     * 
     * Qoidalar:
     * 1. Faqat COMPLETE statusli ChickOut'lar hisobga olinadi
     * 2. INCOMPLETE ChickOut'lar → 0 daromad
     * 3. ChickOut yo'q bo'lsa → totalRevenue = 0, ERROR yo'q
     */
    static async getRevenueAggregation(periodId: string): Promise<IPeriodRevenueAggregation> {
        // 1. Validate period exists
        const period = await Period.findById(periodId);
        if (!period) {
            throw new Error('Period not found');
        }

        // 2. Get all batches for this period
        const batches = await Batch.find({ periodId });
        const batchIds = batches.map(b => b._id);

        // 3. If no batches, return zero revenue
        if (batchIds.length === 0) {
            return {
                periodId,
                totalRevenue: 0,
                completedChickOutCount: 0,
                batchCountWithRevenue: 0,
            };
        }

        // 4. Get all COMPLETE ChickOuts for these batches
        const completeChickOuts = await ChickOut.find({
            batchId: { $in: batchIds },
            status: ChickOutStatus.COMPLETE,
        });

        // 5. Calculate total revenue
        let totalRevenue = 0;
        const batchesWithRevenue = new Set<string>();

        for (const chickOut of completeChickOuts) {
            // totalRevenue is guaranteed to exist for COMPLETE status
            totalRevenue += chickOut.totalRevenue || 0;
            batchesWithRevenue.add(chickOut.batchId.toString());
        }

        return {
            periodId,
            totalRevenue,
            completedChickOutCount: completeChickOuts.length,
            batchCountWithRevenue: batchesWithRevenue.size,
        };
    }

    /**
     * Check if period has any revenue
     * Utility method for quick checks
     */
    static async hasRevenue(periodId: string): Promise<boolean> {
        const aggregation = await this.getRevenueAggregation(periodId);
        return aggregation.totalRevenue > 0;
    }
}
