import { DailyBalance, IDailyBalance } from './daily-balance.model';
import { Batch, BatchStatus } from './batch.model';
import { Section, SectionStatus } from './section.model';

/**
 * DailyBalance Service
 * Kunlik qoldiq (ostatok) business logic
 */
export class DailyBalanceService {
    /**
     * Normalize date to start of day (00:00:00 UTC)
     */
    private static normalizeDate(date: Date): Date {
        const normalized = new Date(date);
        normalized.setUTCHours(0, 0, 0, 0);
        return normalized;
    }

    /**
     * Get or create DailyBalance for a specific date
     * Agar mavjud bo'lsa qaytaradi, aks holda yangi yaratadi
     */
    static async getOrCreateForDate(batchId: string, date: Date): Promise<IDailyBalance> {
        const normalizedDate = this.normalizeDate(date);

        // Check if already exists
        let balance = await DailyBalance.findOne({
            batchId,
            date: normalizedDate,
        });

        if (balance) {
            return balance;
        }

        // Get batch to check status and get start count
        const batch = await Batch.findById(batchId);
        if (!batch) {
            throw new Error('Batch not found');
        }

        // Business Rule: No balance for CLOSED batch
        if (batch.status === BatchStatus.CLOSED) {
            throw new Error('Cannot create balance for CLOSED batch');
        }

        // Get section to check status
        const section = await Section.findById(batch.sectionId);
        if (section) {
            // Business Rule: No balance for CLEANING or PREPARING sections
            if (section.status === SectionStatus.CLEANING || section.status === SectionStatus.PREPARING) {
                throw new Error(`Cannot create balance for ${section.status} section`);
            }
        }

        // Calculate startOfDayChicks
        let startOfDayChicks: number;

        // Check if this is the first day
        const previousBalance = await this.getPreviousDayBalance(batchId, normalizedDate);

        if (previousBalance) {
            // Use previous day's endOfDayChicks
            startOfDayChicks = previousBalance.endOfDayChicks;
        } else {
            // First day - use batch's startChickCount (or totalChicksIn for backward compatibility)
            startOfDayChicks = (batch as any).startChickCount ?? batch.totalChicksIn;
        }

        // Create new balance
        balance = new DailyBalance({
            batchId,
            date: normalizedDate,
            startOfDayChicks,
            deaths: 0,
            chickOut: 0,
            endOfDayChicks: startOfDayChicks, // Initially equal to start
            isClosed: false,
        });

        await balance.save();
        return balance;
    }

    /**
     * Get the previous day's balance
     */
    static async getPreviousDayBalance(batchId: string, date: Date): Promise<IDailyBalance | null> {
        const normalizedDate = this.normalizeDate(date);

        // Find the most recent balance before the given date
        return DailyBalance.findOne({
            batchId,
            date: { $lt: normalizedDate },
        }).sort({ date: -1 });
    }

    /**
     * Update deaths count for a specific date
     * Called when DailyReport is created/updated
     */
    static async updateDeaths(batchId: string, date: Date, deathCount: number): Promise<IDailyBalance> {
        const balance = await this.getOrCreateForDate(batchId, date);

        // Add to existing deaths (not replace)
        balance.deaths += deathCount;

        // Recalculate endOfDayChicks
        this.recalculateEndOfDay(balance);

        await balance.save();
        return balance;
    }

    /**
     * Update chick out count for a specific date
     * Called when ChickOut is created
     */
    static async updateChickOut(batchId: string, date: Date, outCount: number): Promise<IDailyBalance> {
        const balance = await this.getOrCreateForDate(batchId, date);

        // Add to existing chickOut (not replace)
        balance.chickOut += outCount;

        // Recalculate endOfDayChicks
        this.recalculateEndOfDay(balance);

        await balance.save();
        return balance;
    }

    /**
     * Recalculate endOfDayChicks
     * Formula: startOfDayChicks - deaths - chickOut
     */
    private static recalculateEndOfDay(balance: IDailyBalance): void {
        balance.endOfDayChicks = balance.startOfDayChicks - balance.deaths - balance.chickOut;

        // Ensure non-negative
        if (balance.endOfDayChicks < 0) {
            balance.endOfDayChicks = 0;
        }
    }

    /**
     * Get balance for a specific date
     */
    static async getBalanceForDate(batchId: string, date: Date): Promise<IDailyBalance | null> {
        const normalizedDate = this.normalizeDate(date);
        return DailyBalance.findOne({
            batchId,
            date: normalizedDate,
        });
    }

    /**
     * Get all balances for a batch
     */
    static async getBalancesByBatchId(batchId: string): Promise<IDailyBalance[]> {
        return DailyBalance.find({ batchId }).sort({ date: 1 });
    }

    /**
     * Get latest balance for a batch
     */
    static async getLatestBalance(batchId: string): Promise<IDailyBalance | null> {
        return DailyBalance.findOne({ batchId }).sort({ date: -1 });
    }

    /**
     * Check if batch can create new balance entries
     */
    static async canCreateBalance(batchId: string): Promise<boolean> {
        const batch = await Batch.findById(batchId);
        if (!batch) return false;

        if (batch.status === BatchStatus.CLOSED) return false;

        const section = await Section.findById(batch.sectionId);
        if (!section) return false;

        if (section.status === SectionStatus.CLEANING || section.status === SectionStatus.PREPARING) {
            return false;
        }

        return true;
    }
}
