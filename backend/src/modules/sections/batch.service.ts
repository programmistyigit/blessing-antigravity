import { Batch, BatchStatus, IBatch } from './batch.model';
import { Section, SectionStatus } from './section.model';
import { Period, PeriodStatus } from '../periods/period.model';
import { DailyBalanceService } from './daily-balance.service';
import { emitBatchStarted, emitBatchClosed, emitSectionStatusChanged } from '../../realtime/events';

interface CreateBatchData {
    name: string;
    sectionId: string;
    startedAt?: Date;
    expectedEndAt: Date;
    totalChicksIn: number;
    createdBy: string;
}

export class BatchService {
    /**
     * Create a new batch for a section
     * Rule: Only one ACTIVE batch per section is allowed
     */
    static async createBatch(data: CreateBatchData): Promise<IBatch> {
        // Check if section exists
        const section = await Section.findById(data.sectionId);
        if (!section) {
            throw new Error('Section not found');
        }

        // Check for existing ACTIVE batch in this section
        const existingActiveBatch = await Batch.findOne({
            sectionId: data.sectionId,
            status: BatchStatus.ACTIVE,
        });

        if (existingActiveBatch) {
            throw new Error('This section already has an ACTIVE batch. Close it first.');
        }

        // STRICT RULE: Section MUST have an active period assigned
        if (!section.activePeriodId) {
            throw new Error('Section is not assigned to an active period');
        }

        // Fetch and validate the period
        const period = await Period.findById(section.activePeriodId.toString());
        if (!period) {
            throw new Error('Assigned period not found');
        }
        if (period.status !== PeriodStatus.ACTIVE) {
            throw new Error('Cannot create batch in closed period');
        }

        // Period ID is now MANDATORY
        const periodId = period._id;

        // Create the batch
        const batch = new Batch({
            name: data.name,
            sectionId: data.sectionId,
            periodId: periodId,
            startedAt: data.startedAt || new Date(),
            expectedEndAt: data.expectedEndAt,
            totalChicksIn: data.totalChicksIn,
            totalChicksOut: 0,
            status: BatchStatus.ACTIVE,
            createdBy: data.createdBy,
        });

        await batch.save();

        // Update section status to ACTIVE and link the batch
        section.status = SectionStatus.ACTIVE;
        section.activeBatchId = batch._id;
        section.chickArrivalDate = batch.startedAt;
        section.expectedEndDate = batch.expectedEndAt;
        await section.save();

        // Create first day balance (snapshot of starting state)
        // Now section is ACTIVE, so DailyBalanceService should allow it
        await DailyBalanceService.getOrCreateForDate(batch._id.toString(), batch.startedAt);

        // Emit realtime events
        emitBatchStarted(batch);
        emitSectionStatusChanged(section);

        return batch;
    }

    /**
     * Close a batch
     */
    static async closeBatch(batchId: string, endedAt?: Date): Promise<IBatch> {
        const batch = await Batch.findById(batchId);
        if (!batch) {
            throw new Error('Batch not found');
        }

        if (batch.status === BatchStatus.CLOSED) {
            throw new Error('Batch is already closed');
        }

        // STRICT RULE: Cannot close batch with incomplete chick-outs
        const { ChickOut, ChickOutStatus } = await import('./chick-out.model');
        const incompleteCount = await ChickOut.countDocuments({
            batchId: batch._id,
            status: ChickOutStatus.INCOMPLETE
        });
        if (incompleteCount > 0) {
            throw new Error('Cannot close batch: incomplete chick-outs exist for this section. Please complete all chick-outs first.');
        }

        // STRICT RULE: Must have at least one COMPLETED chick-out OR all chicks are dead
        const completedChickOutCount = await ChickOut.countDocuments({
            batchId: batch._id,
            status: ChickOutStatus.COMPLETE
        });
        if (completedChickOutCount === 0 && batch.totalChicksIn > 0) {
            throw new Error('Cannot close batch: no chick-outs have been completed. At least one chick-out must be done before closing.');
        }

        // STRICT RULE: Cannot close batch with unresolved expense incidents
        const { TechnicalIncident } = await import('../assets/incident.model');
        const unresolvedExpenseIncidents = await TechnicalIncident.countDocuments({
            sectionId: batch.sectionId,
            requiresExpense: true,
            expenseId: null,  // Hali xarajat yozilmagan
        });
        if (unresolvedExpenseIncidents > 0) {
            throw new Error('Moliyaviy yakunlanmagan texnik nosozliklar mavjud. Avval ularni tugating.');
        }

        // Close the batch
        batch.status = BatchStatus.CLOSED;
        batch.endedAt = endedAt || new Date();
        await batch.save();

        // Update section status to CLEANING
        const section = await Section.findById(batch.sectionId);
        if (section) {
            section.status = SectionStatus.CLEANING;
            section.activeBatchId = undefined;
            section.closedAt = batch.endedAt;
            await section.save();

            emitSectionStatusChanged(section);
        }

        emitBatchClosed(batch);

        return batch;
    }

    /**
     * Get batch by ID
     */
    static async getBatchById(batchId: string): Promise<IBatch | null> {
        return Batch.findById(batchId).populate('sectionId', 'name status');
    }

    /**
     * Get all batches for a section
     */
    static async getBatchesBySectionId(sectionId: string): Promise<IBatch[]> {
        return Batch.find({ sectionId }).sort({ startedAt: -1 });
    }

    /**
     * Get all batches (with optional status filter)
     */
    static async getAllBatches(status?: BatchStatus): Promise<IBatch[]> {
        const query = status ? { status } : {};
        return Batch.find(query)
            .populate('sectionId', 'name status')
            .sort({ startedAt: -1 });
    }

    /**
     * Get active batch for a section
     */
    static async getActiveBatchForSection(sectionId: string): Promise<IBatch | null> {
        return Batch.findOne({ sectionId, status: BatchStatus.ACTIVE });
    }

    /**
     * Update totalChicksOut (called by ChickOutService)
     */
    static async updateChicksOut(batchId: string, count: number): Promise<void> {
        await Batch.findByIdAndUpdate(batchId, {
            $inc: { totalChicksOut: count },
        });
    }
}
