import { DailyBalance } from './daily-balance.model';
import { Batch, BatchStatus } from './batch.model';
import { ChickOut } from './chick-out.model';
import { Section } from './section.model';

/**
 * BatchSummary Interface
 * Yakuniy hisob / Итого за период
 */
export interface IBatchSummary {
    batchId: string;
    sectionId: string;
    sectionName?: string;
    startChickCount: number;        // Batch snapshotdan
    totalDeaths: number;            // DailyBalance'dan yig'iladi
    totalChickOut: number;          // ChickOut'dan yig'iladi
    totalDays: number;              // Necha kun ACTIVE/PARTIAL_OUT bo'lgan
    finalChickCount: number;        // Oxirgi DailyBalance.endOfDayChicks
    averageDailyMortality: number;  // totalDeaths / totalDays
    status: BatchStatus;            // Current batch status
    startDate: Date;
    endDate?: Date;
    isFinal: boolean;               // CLOSED = final, otherwise current state
}

/**
 * BatchTimeline Item
 * Kunlik qator
 */
export interface IBatchTimelineItem {
    date: Date;
    dayNumber: number;              // 1-kun, 2-kun, ...
    startOfDayChicks: number;
    deaths: number;
    chickOut: number;
    endOfDayChicks: number;
}

/**
 * BatchSummary Service
 * Batch yakuniy hisob va timeline
 */
export class BatchSummaryService {
    /**
     * Get batch summary (yakuniy hisob)
     * Agar batch CLOSED bo'lsa - final holat
     * Agar batch ACTIVE bo'lsa - current state
     */
    static async getBatchSummary(batchId: string): Promise<IBatchSummary> {
        // Get batch
        const batch = await Batch.findById(batchId);
        if (!batch) {
            throw new Error('Batch not found');
        }

        // Get section for name
        const section = await Section.findById(batch.sectionId);

        // Get all daily balances for this batch
        const balances = await DailyBalance.find({ batchId }).sort({ date: 1 });

        // Calculate totals from DailyBalance
        let totalDeaths = 0;
        let totalChickOut = 0;

        for (const balance of balances) {
            totalDeaths += balance.deaths;
            totalChickOut += balance.chickOut;
        }

        // Get total days (number of balance entries)
        const totalDays = balances.length;

        // Get final chick count from latest balance
        let finalChickCount = 0;
        if (balances.length > 0) {
            const latestBalance = balances[balances.length - 1];
            finalChickCount = latestBalance.endOfDayChicks;
        } else {
            // No balances yet, use start count
            finalChickCount = batch.totalChicksIn;
        }

        // Calculate average daily mortality
        const averageDailyMortality = totalDays > 0
            ? Math.round((totalDeaths / totalDays) * 100) / 100
            : 0;

        // Start chick count (from batch)
        const startChickCount = batch.totalChicksIn;

        return {
            batchId: batch._id.toString(),
            sectionId: batch.sectionId.toString(),
            sectionName: section?.name,
            startChickCount,
            totalDeaths,
            totalChickOut,
            totalDays,
            finalChickCount,
            averageDailyMortality,
            status: batch.status,
            startDate: batch.startedAt,
            endDate: batch.endedAt || undefined,
            isFinal: batch.status === BatchStatus.CLOSED,
        };
    }

    /**
     * Get batch timeline (kunma-kun jadval)
     * READ-ONLY - faqat o'qish uchun
     */
    static async getBatchTimeline(batchId: string): Promise<IBatchTimelineItem[]> {
        // Get batch to verify it exists
        const batch = await Batch.findById(batchId);
        if (!batch) {
            throw new Error('Batch not found');
        }

        // Get all daily balances sorted by date
        const balances = await DailyBalance.find({ batchId }).sort({ date: 1 });

        // Map to timeline items
        const timeline: IBatchTimelineItem[] = balances.map((balance, index) => ({
            date: balance.date,
            dayNumber: index + 1,
            startOfDayChicks: balance.startOfDayChicks,
            deaths: balance.deaths,
            chickOut: balance.chickOut,
            endOfDayChicks: balance.endOfDayChicks,
        }));

        return timeline;
    }

    /**
     * Get summary for multiple batches (for section overview)
     */
    static async getBatchSummariesBySection(sectionId: string): Promise<IBatchSummary[]> {
        const batches = await Batch.find({ sectionId }).sort({ startedAt: -1 });

        const summaries: IBatchSummary[] = [];
        for (const batch of batches) {
            const summary = await this.getBatchSummary(batch._id.toString());
            summaries.push(summary);
        }

        return summaries;
    }

    /**
     * Verify totals match (for data integrity)
     * Returns true if ChickOut total matches DailyBalance chickOut total
     */
    static async verifyTotals(batchId: string): Promise<{
        isValid: boolean;
        dailyBalanceTotal: number;
        chickOutTotal: number;
        discrepancy: number;
    }> {
        // Sum from DailyBalance
        const balances = await DailyBalance.find({ batchId });
        const dailyBalanceTotal = balances.reduce((sum, b) => sum + b.chickOut, 0);

        // Sum from ChickOut records
        const chickOuts = await ChickOut.find({ batchId });
        const chickOutTotal = chickOuts.reduce((sum, c) => sum + c.count, 0);

        const discrepancy = Math.abs(dailyBalanceTotal - chickOutTotal);

        return {
            isValid: discrepancy === 0,
            dailyBalanceTotal,
            chickOutTotal,
            discrepancy,
        };
    }
}
