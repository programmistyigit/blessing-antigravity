import { Period, IPeriod, PeriodStatus } from './period.model';

interface CreatePeriodData {
    name: string;
    startDate: Date;
    sections?: string[];
    notes?: string;
    createdBy: string;
}

interface UpdatePeriodData {
    name?: string;
    sections?: string[];
    notes?: string;
}

/**
 * Period Service
 * Simple CRUD operations for Period (Davr)
 */
export class PeriodService {
    /**
     * Create a new period
     * Bir vaqtda bir nechta ACTIVE davr bo'lishi MUMKIN
     */
    static async createPeriod(data: CreatePeriodData): Promise<IPeriod> {
        const period = new Period({
            name: data.name,
            status: PeriodStatus.ACTIVE,
            startDate: data.startDate,
            sections: data.sections || [],
            notes: data.notes || '',
            createdBy: data.createdBy,
        });

        await period.save();
        return period;
    }

    /**
     * Close a period
     * - status = CLOSED
     * - endDate = now
     */
    static async closePeriod(periodId: string): Promise<IPeriod> {
        const period = await Period.findById(periodId);
        if (!period) {
            throw new Error('Period not found');
        }

        if (period.status === PeriodStatus.CLOSED) {
            throw new Error('Period is already closed');
        }

        // STRICT RULE: Cannot close period with active batches
        const { Batch, BatchStatus } = await import('../sections/batch.model');
        const activeBatchCount = await Batch.countDocuments({
            periodId: period._id,
            status: { $ne: BatchStatus.CLOSED }
        });
        if (activeBatchCount > 0) {
            throw new Error('Cannot close period with active batches');
        }

        // STRICT RULE: Cannot close period with incomplete chick-outs
        const { ChickOut, ChickOutStatus } = await import('../sections/chick-out.model');
        const periodBatches = await Batch.find({ periodId: period._id });
        const batchIds = periodBatches.map(b => b._id);
        const incompleteCount = await ChickOut.countDocuments({
            batchId: { $in: batchIds },
            status: ChickOutStatus.INCOMPLETE
        });
        if (incompleteCount > 0) {
            throw new Error('Cannot close period: there are incomplete chick-outs. Please complete all chick-outs before closing the period.');
        }

        // STRICT RULE: Cannot close period with unresolved expense incidents
        const { TechnicalIncident } = await import('../assets/incident.model');
        const sectionIds = period.sections.map(s => s.toString());
        if (sectionIds.length > 0) {
            const unresolvedExpenseIncidents = await TechnicalIncident.countDocuments({
                sectionId: { $in: sectionIds },
                requiresExpense: true,
                expenseId: null,  // Hali xarajat yozilmagan
            });
            if (unresolvedExpenseIncidents > 0) {
                throw new Error('Moliyaviy yakunlanmagan texnik nosozliklar mavjud. Avval ularni tugating.');
            }
        }

        period.status = PeriodStatus.CLOSED;
        period.endDate = new Date();

        await period.save();
        return period;
    }

    /**
     * Update an ACTIVE period
     * CLOSED periods cannot be updated
     */
    static async updatePeriod(periodId: string, data: UpdatePeriodData): Promise<IPeriod> {
        const period = await Period.findById(periodId);
        if (!period) {
            throw new Error('Period not found');
        }

        if (period.status === PeriodStatus.CLOSED) {
            throw new Error('Cannot update a CLOSED period');
        }

        if (data.name !== undefined) period.name = data.name;
        if (data.sections !== undefined) period.sections = data.sections as any;
        if (data.notes !== undefined) period.notes = data.notes;

        await period.save();
        return period;
    }

    /**
     * Get period by ID
     */
    static async getPeriodById(periodId: string): Promise<IPeriod | null> {
        return Period.findById(periodId).populate('sections', 'name status');
    }

    /**
     * Get all periods
     */
    static async getAllPeriods(): Promise<IPeriod[]> {
        return Period.find().sort({ startDate: -1 }).populate('sections', 'name status');
    }

    /**
     * Get active periods only
     */
    static async getActivePeriods(): Promise<IPeriod[]> {
        return Period.find({ status: PeriodStatus.ACTIVE })
            .sort({ startDate: -1 })
            .populate('sections', 'name status');
    }
}
