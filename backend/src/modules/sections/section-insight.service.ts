import mongoose from 'mongoose';
import { SectionPLService, ISectionPL } from './section-pl.service';
import { PeriodExpense, ExpenseCategory } from '../periods/period-expense.model';

/**
 * Section Performance Status
 */
export type SectionStatus =
    | 'TOP_PERFORMER'      // Eng yaxshi natija
    | 'GOOD'               // Yaxshi
    | 'AVERAGE'            // O'rtacha
    | 'UNDERPERFORMING'    // Past natija
    | 'LOSS_MAKING';       // Zarar keltirayotgan

/**
 * Section Insight Interface
 * Har bir section uchun tahlil
 */
export interface ISectionInsight {
    sectionId: string;
    sectionName: string;
    profit: number;
    revenue: number;
    expenses: number;
    rank: number;
    status: SectionStatus;
    mainCostDriver: ExpenseCategory | null;
    costBreakdown: Record<string, number>;
    kpi: {
        profitMarginPercent: number;
        revenuePerSoldChick: number | null;
        costPerAliveChick: number | null;
        profitPerSoldChick: number | null;
    };
    notes: string;
}

/**
 * Period Insight Summary
 */
export interface IPeriodInsightSummary {
    bestSection: string | null;
    worstSection: string | null;
    mostExpensiveCategory: ExpenseCategory | null;
    totalPeriodProfit: number;
    totalPeriodRevenue: number;
    totalPeriodExpenses: number;
    profitableSectionsCount: number;
    lossMakingSectionsCount: number;
}

/**
 * Full Period Analytics Response
 */
export interface IPeriodAnalytics {
    status: 'SUCCESS' | 'BLOCKED';
    message?: string;
    periodId: string;
    sections: ISectionInsight[];
    summary: IPeriodInsightSummary;
}

/**
 * Section Insight Service
 * Qaror qabul qilish uchun tahlil
 * 
 * ⚠️ Bu P&L o'zgartirmaydi - faqat ANALYSIS
 */
export class SectionInsightService {
    /**
     * Get full analytics for all sections in a period
     */
    static async getPeriodAnalytics(periodId: string): Promise<IPeriodAnalytics> {
        // 1. Get P&L for all sections
        let sectionsPL: ISectionPL[];
        try {
            sectionsPL = await SectionPLService.getAllSectionsPLForPeriod(periodId);
        } catch (error: any) {
            return {
                status: 'BLOCKED',
                message: error.message,
                periodId,
                sections: [],
                summary: this.getEmptySummary(),
            };
        }

        if (sectionsPL.length === 0) {
            return {
                status: 'BLOCKED',
                message: 'Davrda seksiyalar topilmadi',
                periodId,
                sections: [],
                summary: this.getEmptySummary(),
            };
        }

        // 2. Get expense breakdown for each section
        const sectionInsights: ISectionInsight[] = [];

        for (const pl of sectionsPL) {
            const costBreakdown = await this.getSectionCostBreakdown(pl.sectionId);
            const mainCostDriver = this.getMainCostDriver(costBreakdown);
            const profitMarginPercent = pl.totalRevenue > 0
                ? Math.round((pl.profit / pl.totalRevenue) * 10000) / 100
                : 0;

            sectionInsights.push({
                sectionId: pl.sectionId,
                sectionName: pl.sectionName,
                profit: pl.profit,
                revenue: pl.totalRevenue,
                expenses: pl.totalExpenses,
                rank: 0, // Will be calculated after sorting
                status: 'AVERAGE', // Will be calculated
                mainCostDriver,
                costBreakdown,
                kpi: {
                    profitMarginPercent,
                    revenuePerSoldChick: pl.metrics.revenuePerSoldChick,
                    costPerAliveChick: pl.metrics.costPerAliveChick,
                    profitPerSoldChick: pl.metrics.profitPerSoldChick,
                },
                notes: '', // Will be generated
            });
        }

        // 3. Sort by profit and assign ranks
        sectionInsights.sort((a, b) => b.profit - a.profit);
        sectionInsights.forEach((s, i) => {
            s.rank = i + 1;
        });

        // 4. Assign status based on rank and profitability
        const totalSections = sectionInsights.length;
        sectionInsights.forEach(s => {
            s.status = this.calculateStatus(s, totalSections);
            s.notes = this.generateNotes(s);
        });

        // 5. Calculate summary
        const summary = this.calculateSummary(sectionInsights);

        return {
            status: 'SUCCESS',
            periodId,
            sections: sectionInsights,
            summary,
        };
    }

    /**
     * Get cost breakdown by category for a section
     */
    private static async getSectionCostBreakdown(sectionId: string): Promise<Record<string, number>> {
        const expenses = await PeriodExpense.aggregate([
            { $match: { sectionId: { $eq: new mongoose.Types.ObjectId(sectionId) } } },
            { $group: { _id: '$category', total: { $sum: '$amount' } } },
        ]);

        const breakdown: Record<string, number> = {};
        for (const exp of expenses) {
            breakdown[exp._id] = exp.total;
        }

        return breakdown;
    }

    /**
     * Find the main cost driver (highest expense category)
     */
    private static getMainCostDriver(costBreakdown: Record<string, number>): ExpenseCategory | null {
        let maxCategory: ExpenseCategory | null = null;
        let maxAmount = 0;

        for (const [category, amount] of Object.entries(costBreakdown)) {
            if (amount > maxAmount) {
                maxAmount = amount;
                maxCategory = category as ExpenseCategory;
            }
        }

        return maxCategory;
    }

    /**
     * Calculate section status based on rank and profit
     */
    private static calculateStatus(insight: ISectionInsight, totalSections: number): SectionStatus {
        // If losing money, immediately mark as loss-making
        if (insight.profit < 0) {
            return 'LOSS_MAKING';
        }

        // Calculate percentile rank
        const percentile = (insight.rank / totalSections) * 100;

        if (percentile <= 20) return 'TOP_PERFORMER';
        if (percentile <= 40) return 'GOOD';
        if (percentile <= 70) return 'AVERAGE';
        return 'UNDERPERFORMING';
    }

    /**
     * Generate human-readable notes for a section
     */
    private static generateNotes(insight: ISectionInsight): string {
        const notes: string[] = [];

        // Profit status
        if (insight.profit < 0) {
            notes.push(`Zarar: ${Math.abs(insight.profit).toLocaleString()} so'm`);
        } else if (insight.kpi.profitMarginPercent > 30) {
            notes.push(`Yuqori margin: ${insight.kpi.profitMarginPercent}%`);
        }

        // Main cost driver
        if (insight.mainCostDriver) {
            notes.push(`Asosiy xarajat: ${insight.mainCostDriver}`);
        }

        // Performance insights
        if (insight.status === 'TOP_PERFORMER') {
            notes.push("Eng yaxshi natija ko'rsatmoqda");
        } else if (insight.status === 'UNDERPERFORMING') {
            notes.push("Natijani yaxshilash imkoniyati bor");
        }

        return notes.join('. ') || 'Ma\'lumot yetarli';
    }

    /**
     * Calculate period-level summary
     */
    private static calculateSummary(insights: ISectionInsight[]): IPeriodInsightSummary {
        if (insights.length === 0) {
            return this.getEmptySummary();
        }

        const bestSection = insights[0]; // Already sorted by profit desc
        const worstSection = insights[insights.length - 1];

        // Aggregate all costs to find most expensive category globally
        const globalCosts: Record<string, number> = {};
        for (const insight of insights) {
            for (const [cat, amount] of Object.entries(insight.costBreakdown)) {
                globalCosts[cat] = (globalCosts[cat] || 0) + amount;
            }
        }

        const mostExpensiveCategory = this.getMainCostDriver(globalCosts);

        const totalRevenue = insights.reduce((sum, s) => sum + s.revenue, 0);
        const totalExpenses = insights.reduce((sum, s) => sum + s.expenses, 0);
        const totalProfit = insights.reduce((sum, s) => sum + s.profit, 0);

        const profitableSectionsCount = insights.filter(s => s.profit > 0).length;
        const lossMakingSectionsCount = insights.filter(s => s.profit < 0).length;

        return {
            bestSection: bestSection?.sectionName || null,
            worstSection: worstSection?.sectionName || null,
            mostExpensiveCategory,
            totalPeriodProfit: totalProfit,
            totalPeriodRevenue: totalRevenue,
            totalPeriodExpenses: totalExpenses,
            profitableSectionsCount,
            lossMakingSectionsCount,
        };
    }

    /**
     * Get empty summary for error cases
     */
    private static getEmptySummary(): IPeriodInsightSummary {
        return {
            bestSection: null,
            worstSection: null,
            mostExpensiveCategory: null,
            totalPeriodProfit: 0,
            totalPeriodRevenue: 0,
            totalPeriodExpenses: 0,
            profitableSectionsCount: 0,
            lossMakingSectionsCount: 0,
        };
    }

    /**
     * Compare two sections
     */
    static async compareSections(sectionId1: string, sectionId2: string): Promise<{
        section1: ISectionPL;
        section2: ISectionPL;
        comparison: {
            profitDifference: number;
            revenueDifference: number;
            costDifference: number;
            winner: string;
        };
    }> {
        const [pl1, pl2] = await Promise.all([
            SectionPLService.getSectionPL(sectionId1),
            SectionPLService.getSectionPL(sectionId2),
        ]);

        return {
            section1: pl1,
            section2: pl2,
            comparison: {
                profitDifference: pl1.profit - pl2.profit,
                revenueDifference: pl1.totalRevenue - pl2.totalRevenue,
                costDifference: pl1.totalExpenses - pl2.totalExpenses,
                winner: pl1.profit > pl2.profit ? pl1.sectionName : pl2.sectionName,
            },
        };
    }
}
