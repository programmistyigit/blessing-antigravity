import { ChickOut, IChickOut, ChickOutStatus } from './chick-out.model';
import { Section, SectionStatus } from './section.model';
import { Batch, BatchStatus } from './batch.model';
import { BatchService } from './batch.service';
import { DailyBalanceService } from './daily-balance.service';
import { emitChickOutCreated, emitSectionStatusChanged, emitBatchClosed } from '../../realtime/events';

interface CreateChickOutData {
    sectionId: string;
    date?: Date;
    count: number;
    vehicleNumber: string;
    machineNumber: string;
    isFinal: boolean;
    createdBy: string;
}

export class ChickOutService {
    /**
     * Create a chick out record
     * Rules:
     * - isFinal=false → Section becomes PARTIAL_OUT
     * - isFinal=true → Batch CLOSED, Section CLEANING
     */
    static async createChickOut(data: CreateChickOutData): Promise<IChickOut> {
        // Get section
        const section = await Section.findById(data.sectionId);
        if (!section) {
            throw new Error('Section not found');
        }

        // Must have an active batch
        if (!section.activeBatchId) {
            throw new Error('No active batch in this section');
        }

        const batch = await Batch.findById(section.activeBatchId);
        if (!batch || (batch.status !== BatchStatus.ACTIVE && batch.status !== BatchStatus.PARTIAL_OUT)) {
            throw new Error('No active batch found');
        }

        // Create chick out record
        const chickOut = new ChickOut({
            sectionId: data.sectionId,
            batchId: batch._id,
            date: data.date || new Date(),
            count: data.count,
            vehicleNumber: data.vehicleNumber,
            machineNumber: data.machineNumber,
            isFinal: data.isFinal,
            createdBy: data.createdBy,
        });

        await chickOut.save();

        // Update batch totalChicksOut
        await BatchService.updateChicksOut(batch._id.toString(), data.count);

        // Update daily balance with chick out
        await DailyBalanceService.updateChickOut(batch._id.toString(), chickOut.date, data.count);

        // Emit chick out event
        emitChickOutCreated(chickOut);

        // Handle section/batch status changes
        if (data.isFinal) {
            // Close the batch
            batch.status = BatchStatus.CLOSED;
            batch.endedAt = chickOut.date;
            await batch.save();

            // Set section to CLEANING
            section.status = SectionStatus.CLEANING;
            section.activeBatchId = undefined;
            section.closedAt = chickOut.date;
            await section.save();

            emitBatchClosed(batch);
            emitSectionStatusChanged(section);
        } else {
            // Set section to PARTIAL_OUT if not already
            if (section.status !== SectionStatus.PARTIAL_OUT) {
                section.status = SectionStatus.PARTIAL_OUT;
                await section.save();

                emitSectionStatusChanged(section);
            }
        }

        return chickOut;
    }

    /**
     * Get all chick outs for a section
     */
    static async getChickOutsBySectionId(sectionId: string): Promise<IChickOut[]> {
        return ChickOut.find({ sectionId }).sort({ date: -1 });
    }

    /**
     * Get all chick outs for a batch
     */
    static async getChickOutsByBatchId(batchId: string): Promise<IChickOut[]> {
        return ChickOut.find({ batchId }).sort({ date: -1 });
    }

    /**
     * Complete a chick out with financial data
     * Phase 2: Add weight, waste%, price and calculate revenue
     */
    static async complete(
        chickOutId: string,
        data: { totalWeightKg: number; wastePercent: number; pricePerKg: number },
        userId: string
    ): Promise<IChickOut> {
        const chickOut = await ChickOut.findById(chickOutId);
        if (!chickOut) {
            throw new Error('ChickOut not found');
        }

        // Already complete?
        if (chickOut.status === ChickOutStatus.COMPLETE) {
            throw new Error('ChickOut is already complete');
        }

        // Get batch to check period
        const batch = await Batch.findById(chickOut.batchId);
        if (!batch) {
            throw new Error('Batch not found');
        }

        // Check if period is ACTIVE (if batch has periodId)
        if (batch.periodId) {
            const { Period, PeriodStatus } = await import('../periods/period.model');
            const period = await Period.findById(batch.periodId);
            if (period && period.status !== PeriodStatus.ACTIVE) {
                throw new Error('Cannot complete chick-out in closed period');
            }
        }

        // Validate wastePercent
        if (data.wastePercent < 0 || data.wastePercent > 100) {
            throw new Error('Waste percent must be between 0 and 100');
        }

        // Calculate financial values
        const netWeightKg = data.totalWeightKg * (1 - data.wastePercent / 100);
        const totalRevenue = netWeightKg * data.pricePerKg;

        // Update chick out
        chickOut.status = ChickOutStatus.COMPLETE;
        chickOut.totalWeightKg = data.totalWeightKg;
        chickOut.wastePercent = data.wastePercent;
        chickOut.netWeightKg = netWeightKg;
        chickOut.pricePerKg = data.pricePerKg;
        chickOut.totalRevenue = totalRevenue;
        chickOut.completedAt = new Date();
        chickOut.completedBy = new (await import('mongoose')).Types.ObjectId(userId);

        await chickOut.save();
        return chickOut;
    }

    /**
     * Check if batch has incomplete chick outs
     */
    static async hasIncompleteChickOuts(batchId: string): Promise<boolean> {
        const count = await ChickOut.countDocuments({
            batchId,
            status: ChickOutStatus.INCOMPLETE
        });
        return count > 0;
    }

    /**
     * Count incomplete chick outs for a period
     */
    static async countIncompleteForPeriod(periodId: string): Promise<number> {
        // Get all batches for this period
        const batches = await Batch.find({ periodId });
        const batchIds = batches.map(b => b._id);

        return ChickOut.countDocuments({
            batchId: { $in: batchIds },
            status: ChickOutStatus.INCOMPLETE
        });
    }
}
