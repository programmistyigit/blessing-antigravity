import { Section } from '../sections/section.model';
import { Batch } from '../sections/batch.model';
import { ChickOut } from '../sections/chick-out.model';
import { SectionDailyReport } from '../sections/report.model';
import { PeriodExpense } from '../periods/period-expense.model';
import { Period } from '../periods/period.model';
import { ForecastPriceService } from './forecast-price.service';

/**
 * Forecast Result Status
 */
export type ForecastStatus = 'SUCCESS' | 'BLOCKED';

/**
 * Blocked Reason
 */
export type ForecastBlockedReason =
    | 'INSUFFICIENT_DATA'
    | 'PRICE_NOT_SET'
    | 'NO_BATCH'
    | 'NO_ACTIVE_PERIOD';

/**
 * Forecast Result Interface
 * BLOCKED yoki SUCCESS holati
 */
export interface IForecastResult {
    status: ForecastStatus;

    // BLOCKED holati uchun
    reason?: ForecastBlockedReason;
    missing?: string[];
    message?: string;

    // SUCCESS holati uchun
    sectionId?: string;
    sectionName?: string;
    periodId?: string;

    // Hisob-kitob natijalari
    estimatedRevenue?: number;
    estimatedCosts?: number;
    estimatedProfit?: number;
    profitPerChick?: number;
    breakEvenDay?: number;

    // Metrics
    aliveChicks?: number;
    soldChicks?: number;
    deadChicks?: number;
    initialChicks?: number;
    avgWeight?: number;
    forecastPricePerKg?: number;
    totalWeight?: number;
}

/**
 * Period Forecast Result
 */
export interface IPeriodForecastResult {
    status: ForecastStatus;
    reason?: ForecastBlockedReason;
    message?: string;

    periodId?: string;
    periodName?: string;

    // Aggregated values
    totalEstimatedRevenue?: number;
    totalEstimatedCosts?: number;
    totalEstimatedProfit?: number;

    // Section breakdowns
    sections?: IForecastResult[];

    // Blocked sections
    blockedSections?: Array<{
        sectionId: string;
        sectionName: string;
        reason: string;
    }>;
}

/**
 * Forecast P&L Service
 * Tahminiy foyda/zarar hisoblash
 * 
 * ⚠️ Bu real P&L ga TA'SIR QILMAYDI
 * ⚠️ Faqat strategik qarorlar uchun
 */
export class ForecastPLService {
    /**
     * Section uchun forecast hisoblash
     */
    static async getSectionForecast(sectionId: string): Promise<IForecastResult> {
        // 1. Validate section exists
        const section = await Section.findById(sectionId);
        if (!section) {
            return {
                status: 'BLOCKED',
                reason: 'INSUFFICIENT_DATA',
                missing: ['section'],
                message: 'Section topilmadi',
            };
        }

        // 2. Check active period
        if (!section.activePeriodId) {
            return {
                status: 'BLOCKED',
                reason: 'NO_ACTIVE_PERIOD',
                message: 'Section aktiv davrga biriktirilmagan',
            };
        }

        // 3. Get active batch
        const batch = await Batch.findOne({
            sectionId: section._id,
            status: { $in: ['ACTIVE', 'PARTIAL_OUT'] },
        });

        if (!batch) {
            return {
                status: 'BLOCKED',
                reason: 'NO_BATCH',
                message: 'Aktiv partiya topilmadi',
            };
        }

        // 4. Get forecast price
        const pricePerKg = await ForecastPriceService.getActivePrice(
            section.activePeriodId.toString(),
            sectionId
        );

        if (!pricePerKg) {
            return {
                status: 'BLOCKED',
                reason: 'PRICE_NOT_SET',
                missing: ['pricePerKg'],
                message: 'Tahminiy hisoblash uchun dastlabki sotuv narxini kiriting',
            };
        }

        // 5. Get latest report for avgWeight
        const latestReport = await SectionDailyReport.findOne({
            batchId: batch._id,
        }).sort({ date: -1 });

        if (!latestReport || !latestReport.avgWeight) {
            return {
                status: 'BLOCKED',
                reason: 'INSUFFICIENT_DATA',
                missing: ['avgWeight'],
                message: 'Kunlik hisobot va o\'rtacha vazn ma\'lumoti yetishmaydi',
            };
        }

        // 6. Calculate chick counts
        const initialChicks = batch.totalChicksIn;

        // Total deaths from reports
        const deathsResult = await SectionDailyReport.aggregate([
            { $match: { batchId: batch._id } },
            { $group: { _id: null, total: { $sum: '$deaths' } } },
        ]);
        const deadChicks = deathsResult.length > 0 ? deathsResult[0].total : 0;

        // Total sold chicks (all ChickOuts)
        const soldResult = await ChickOut.aggregate([
            { $match: { batchId: batch._id } },
            { $group: { _id: null, total: { $sum: '$count' } } },
        ]);
        const soldChicks = soldResult.length > 0 ? soldResult[0].total : 0;

        const aliveChicks = initialChicks - deadChicks - soldChicks;

        // 7. Calculate costs
        const costsResult = await PeriodExpense.aggregate([
            { $match: { sectionId: section._id } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const totalCostsSoFar = costsResult.length > 0 ? costsResult[0].total : 0;

        // 8. Calculate proportional costs (for partial sales)
        // Sotilgan joja o'z ulushidagi xarajatni olib chiqib ketadi
        let remainingCosts = totalCostsSoFar;
        if (soldChicks > 0 && initialChicks > 0) {
            const costPerChick = totalCostsSoFar / initialChicks;
            const soldCost = soldChicks * costPerChick;
            remainingCosts = totalCostsSoFar - soldCost;
        }

        // 9. Calculate estimated revenue
        const avgWeight = latestReport.avgWeight;
        const totalWeight = aliveChicks * avgWeight;
        const estimatedRevenue = totalWeight * pricePerKg;

        // 10. Calculate profit
        const estimatedProfit = estimatedRevenue - remainingCosts;
        const profitPerChick = aliveChicks > 0
            ? Math.round((estimatedProfit / aliveChicks) * 100) / 100
            : 0;

        // 11. Calculate break-even day estimate (simplified)
        // Agar profit manfiy bo'lsa, qancha kun kerak
        let breakEvenDay: number | undefined;
        if (estimatedProfit < 0) {
            // Simple estimate: assume daily weight gain ~50g
            const dailyWeightGain = 0.05; // kg
            const neededWeight = Math.abs(estimatedProfit) / pricePerKg / aliveChicks;
            breakEvenDay = Math.ceil(neededWeight / dailyWeightGain);
        }

        return {
            status: 'SUCCESS',
            sectionId: section._id.toString(),
            sectionName: section.name,
            periodId: section.activePeriodId.toString(),

            estimatedRevenue: Math.round(estimatedRevenue),
            estimatedCosts: Math.round(remainingCosts),
            estimatedProfit: Math.round(estimatedProfit),
            profitPerChick,
            breakEvenDay,

            aliveChicks,
            soldChicks,
            deadChicks,
            initialChicks,
            avgWeight,
            forecastPricePerKg: pricePerKg,
            totalWeight: Math.round(totalWeight * 100) / 100,
        };
    }

    /**
     * Period uchun barcha sectionlar forecast
     */
    static async getPeriodForecast(periodId: string): Promise<IPeriodForecastResult> {
        const period = await Period.findById(periodId);
        if (!period) {
            return {
                status: 'BLOCKED',
                reason: 'INSUFFICIENT_DATA',
                message: 'Period topilmadi',
            };
        }

        // Get all sections in this period
        const sections = await Section.find({ activePeriodId: periodId });

        if (sections.length === 0) {
            return {
                status: 'BLOCKED',
                reason: 'INSUFFICIENT_DATA',
                message: 'Davrda aktiv seksiya topilmadi',
            };
        }

        const successSections: IForecastResult[] = [];
        const blockedSections: Array<{ sectionId: string; sectionName: string; reason: string }> = [];

        let totalRevenue = 0;
        let totalCosts = 0;
        let totalProfit = 0;

        for (const section of sections) {
            const forecast = await this.getSectionForecast(section._id.toString());

            if (forecast.status === 'SUCCESS') {
                successSections.push(forecast);
                totalRevenue += forecast.estimatedRevenue || 0;
                totalCosts += forecast.estimatedCosts || 0;
                totalProfit += forecast.estimatedProfit || 0;
            } else {
                blockedSections.push({
                    sectionId: section._id.toString(),
                    sectionName: section.name,
                    reason: forecast.message || forecast.reason || 'Unknown',
                });
            }
        }

        // All blocked = return blocked
        if (successSections.length === 0) {
            return {
                status: 'BLOCKED',
                reason: 'INSUFFICIENT_DATA',
                message: 'Barcha seksiyalarda ma\'lumot yetishmaydi',
                periodId: period._id.toString(),
                periodName: period.name,
                blockedSections,
            };
        }

        return {
            status: 'SUCCESS',
            periodId: period._id.toString(),
            periodName: period.name,
            totalEstimatedRevenue: Math.round(totalRevenue),
            totalEstimatedCosts: Math.round(totalCosts),
            totalEstimatedProfit: Math.round(totalProfit),
            sections: successSections,
            blockedSections: blockedSections.length > 0 ? blockedSections : undefined,
        };
    }

    /**
     * What-if simulation: Qisman sotuv
     * ⚠️ Hech narsa saqlamaydi - faqat hisob
     */
    static async simulatePartialSale(
        batchId: string,
        soldChicks: number,
        pricePerKg: number
    ): Promise<IForecastResult> {
        const batch = await Batch.findById(batchId);
        if (!batch) {
            return {
                status: 'BLOCKED',
                reason: 'NO_BATCH',
                message: 'Partiya topilmadi',
            };
        }

        const section = await Section.findById(batch.sectionId);
        if (!section) {
            return {
                status: 'BLOCKED',
                reason: 'INSUFFICIENT_DATA',
                message: 'Section topilmadi',
            };
        }

        // Get latest avgWeight
        const latestReport = await SectionDailyReport.findOne({
            batchId: batch._id,
        }).sort({ date: -1 });

        if (!latestReport || !latestReport.avgWeight) {
            return {
                status: 'BLOCKED',
                reason: 'INSUFFICIENT_DATA',
                missing: ['avgWeight'],
                message: 'O\'rtacha vazn ma\'lumoti yo\'q',
            };
        }

        // Current counts
        const initialChicks = batch.totalChicksIn;

        const deathsResult = await SectionDailyReport.aggregate([
            { $match: { batchId: batch._id } },
            { $group: { _id: null, total: { $sum: '$deaths' } } },
        ]);
        const deadChicks = deathsResult.length > 0 ? deathsResult[0].total : 0;

        const currentSoldResult = await ChickOut.aggregate([
            { $match: { batchId: batch._id } },
            { $group: { _id: null, total: { $sum: '$count' } } },
        ]);
        const currentSoldChicks = currentSoldResult.length > 0 ? currentSoldResult[0].total : 0;

        const currentAlive = initialChicks - deadChicks - currentSoldChicks;

        // Validate simulation
        if (soldChicks > currentAlive) {
            return {
                status: 'BLOCKED',
                reason: 'INSUFFICIENT_DATA',
                message: `Sotish uchun yetarli joja yo'q. Mavjud: ${currentAlive}`,
            };
        }

        // Current costs
        const costsResult = await PeriodExpense.aggregate([
            { $match: { sectionId: section._id } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const totalCosts = costsResult.length > 0 ? costsResult[0].total : 0;

        // Simulate sale
        const avgWeight = latestReport.avgWeight;
        const saleWeight = soldChicks * avgWeight;
        const saleRevenue = saleWeight * pricePerKg;

        // Cost allocation
        const costPerChick = totalCosts / initialChicks;
        const soldCost = soldChicks * costPerChick;
        const remainingCost = totalCosts - soldCost;

        // After sale
        const remainingChicks = currentAlive - soldChicks;
        const remainingWeight = remainingChicks * avgWeight;
        const remainingRevenue = remainingWeight * pricePerKg;

        const totalSimulatedRevenue = saleRevenue + remainingRevenue;
        const simulatedProfit = totalSimulatedRevenue - totalCosts;

        return {
            status: 'SUCCESS',
            sectionId: section._id.toString(),
            sectionName: section.name,

            estimatedRevenue: Math.round(totalSimulatedRevenue),
            estimatedCosts: Math.round(remainingCost),
            estimatedProfit: Math.round(simulatedProfit),

            aliveChicks: remainingChicks,
            soldChicks: soldChicks,
            initialChicks,
            avgWeight,
            forecastPricePerKg: pricePerKg,

            message: `${soldChicks} joja sotilsa: ${Math.round(saleRevenue).toLocaleString()} so'm daromad`,
        };
    }
}
