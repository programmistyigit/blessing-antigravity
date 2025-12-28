import { TechnicalIncident } from './incident.model';
import { PeriodExpense, ExpenseCategory } from '../periods/period-expense.model';
import { Period, PeriodStatus } from '../periods/period.model';
import { Asset } from './asset.model';

interface CreateRepairExpenseData {
    incidentId: string;
    amount: number;
    description: string;
    periodId?: string;  // Faqat sectionId yo'q bo'lganda majburiy
    createdBy: string;
}

/**
 * Repair Expense Service
 * Incident asosida ta'mirlash xarajatini yozish
 */
export class RepairExpenseService {
    /**
     * Create repair expense for an incident
     * 
     * Qoidalar:
     * 1. Incident mavjud va requiresExpense = true bo'lishi shart
     * 2. Incident hali xarajat bilan yopilmagan (expenseId = null)
     * 3. Period aniqlash:
     *    - sectionId mavjud → ACTIVE period avtomatik
     *    - sectionId null → periodId majburiy
     * 4. PeriodExpense yaratish (category: ASSET_REPAIR)
     * 5. Incident'ga expenseId va resolved = true yozish
     */
    static async createRepairExpense(data: CreateRepairExpenseData): Promise<{
        expense: any;
        incident: any;
    }> {
        // 1. Validate incident exists
        const incident = await TechnicalIncident.findById(data.incidentId);
        if (!incident) {
            throw new Error('Incident not found');
        }

        // 2. Validate requiresExpense = true
        if (!incident.requiresExpense) {
            throw new Error('This incident does not require expense (requiresExpense = false)');
        }

        // 3. Validate incident not already has expense
        if (incident.expenseId) {
            throw new Error('This incident already has an expense attached');
        }

        // 4. Validate amount
        if (!data.amount || data.amount <= 0) {
            throw new Error('Amount must be a positive number');
        }

        // 5. Validate description
        if (!data.description || data.description.trim().length < 5) {
            throw new Error('Description must be at least 5 characters');
        }

        // 6. Get asset for additional info
        const asset = await Asset.findById(incident.assetId);
        if (!asset) {
            throw new Error('Asset not found');
        }

        // 7. Determine period
        let periodId: string;

        if (incident.sectionId) {
            // Section'li asset → ACTIVE period Section orqali olinadi
            const { Section } = await import('../sections/section.model');
            const section = await Section.findById(incident.sectionId);

            if (!section) {
                throw new Error('Section not found');
            }

            if (!section.activePeriodId) {
                throw new Error('No active period assigned to this section');
            }

            const activePeriod = await Period.findById(section.activePeriodId);

            if (!activePeriod || activePeriod.status !== PeriodStatus.ACTIVE) {
                // Agar section activePeriodId bo'lsa-yu, u period topilmasa yoki yopiq bo'lsa
                throw new Error('Section active period is invalid or closed');
            }

            periodId = activePeriod._id.toString();
        } else {
            // Section'siz asset → periodId majburiy
            if (!data.periodId) {
                throw new Error('periodId is required for assets without section');
            }

            // Validate period exists and is ACTIVE
            const period = await Period.findById(data.periodId);
            if (!period) {
                throw new Error('Period not found');
            }
            if (period.status !== PeriodStatus.ACTIVE) {
                throw new Error('Cannot add expense to closed period');
            }

            periodId = data.periodId;
        }

        // 8. Create PeriodExpense
        const expense = await PeriodExpense.create({
            periodId: periodId,
            category: ExpenseCategory.ASSET_REPAIR,
            amount: data.amount,
            description: data.description.trim(),
            expenseDate: new Date(),
            incidentId: incident._id,
            assetId: incident.assetId,
            sectionId: incident.sectionId || null,
            createdBy: data.createdBy,
        });

        // 9. Update incident with expenseId and mark as resolved
        incident.expenseId = expense._id;
        incident.resolved = true;
        incident.linkedPeriodId = periodId as any;
        await incident.save();

        return {
            expense,
            incident,
        };
    }

    /**
     * Get expense by incident ID
     */
    static async getExpenseByIncident(incidentId: string) {
        return PeriodExpense.findOne({ incidentId })
            .populate('periodId', 'name status')
            .populate('assetId', 'name category')
            .populate('sectionId', 'name status')
            .populate('createdBy', 'fullName username');
    }

    /**
     * Get unresolved expense incidents count for a section
     * (Used in safety guards)
     */
    static async getUnresolvedExpenseIncidentCount(sectionId: string): Promise<number> {
        return TechnicalIncident.countDocuments({
            sectionId,
            requiresExpense: true,
            expenseId: null,  // Hali xarajat yozilmagan
        });
    }

    /**
     * Get unresolved expense incidents count for multiple sections
     * (Used in period closing safety guard)
     */
    static async getUnresolvedExpenseIncidentCountForSections(sectionIds: string[]): Promise<number> {
        return TechnicalIncident.countDocuments({
            sectionId: { $in: sectionIds },
            requiresExpense: true,
            expenseId: null,
        });
    }
}
