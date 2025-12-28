import mongoose from 'mongoose';
import { UtilityCost, IUtilityCost, UtilityType } from './utility.model';
import { PeriodExpense, ExpenseCategory } from '../periods/period-expense.model';
import { Period } from '../periods/period.model';
import { emitUtilityCostRecorded } from '../../realtime/events';

interface RecordUtilityCostData {
    type: UtilityType;
    sectionId?: string;
    periodId: string;
    amount: number;
    quantity?: number;
    unitCost?: number;
    date?: Date;
    createdBy: string;
    notes?: string;
}

export class UtilityService {
    /**
     * Record utility cost
     * Creates UtilityCost + PeriodExpense(WATER/ELECTRICITY)
     */
    static async recordCost(data: RecordUtilityCostData): Promise<IUtilityCost> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Validate period exists
            const period = await Period.findById(data.periodId);
            if (!period) {
                throw new Error('Period not found');
            }

            const date = data.date || new Date();
            const expenseCategory = data.type === UtilityType.WATER
                ? ExpenseCategory.WATER
                : ExpenseCategory.ELECTRICITY;

            const description = data.type === UtilityType.WATER
                ? `Suv xarajati${data.quantity ? `: ${data.quantity} litr` : ''}`
                : `Elektr xarajati${data.quantity ? `: ${data.quantity} kWh` : ''}`;

            // Create PeriodExpense
            const [expense] = await PeriodExpense.create([{
                periodId: data.periodId,
                category: expenseCategory,
                amount: data.amount,
                description,
                expenseDate: date,
                sectionId: data.sectionId || null,
                quantity: data.quantity,
                unitCost: data.unitCost,
                source: 'MANUAL',
                createdBy: data.createdBy,
            }], { session });

            // Create UtilityCost
            const utilityCost = new UtilityCost({
                type: data.type,
                sectionId: data.sectionId || null,
                periodId: data.periodId,
                amount: data.amount,
                quantity: data.quantity,
                unitCost: data.unitCost,
                date,
                createdBy: data.createdBy,
                expenseId: expense._id,
                notes: data.notes || '',
            });
            await utilityCost.save({ session });

            await session.commitTransaction();

            // Emit WebSocket event
            emitUtilityCostRecorded({
                type: data.type,
                sectionId: data.sectionId || null,
                periodId: data.periodId,
                amount: data.amount,
                date: date.toISOString(),
            });

            return utilityCost;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Get costs by period
     */
    static async getCostsByPeriod(periodId: string, type?: UtilityType): Promise<IUtilityCost[]> {
        const filter: any = { periodId };
        if (type) {
            filter.type = type;
        }
        return UtilityCost.find(filter)
            .populate('sectionId', 'name')
            .populate('createdBy', 'fullName username')
            .sort({ date: -1 });
    }

    /**
     * Get costs by section
     */
    static async getCostsBySection(sectionId: string, type?: UtilityType): Promise<IUtilityCost[]> {
        const filter: any = { sectionId };
        if (type) {
            filter.type = type;
        }
        return UtilityCost.find(filter)
            .populate('createdBy', 'fullName username')
            .sort({ date: -1 });
    }

    /**
     * Get period utility summary
     */
    static async getPeriodUtilitySummary(periodId: string): Promise<{
        water: { totalAmount: number; totalQuantity: number };
        electricity: { totalAmount: number; totalQuantity: number };
    }> {
        const result = await UtilityCost.aggregate([
            { $match: { periodId: new mongoose.Types.ObjectId(periodId) } },
            {
                $group: {
                    _id: '$type',
                    totalAmount: { $sum: '$amount' },
                    totalQuantity: { $sum: { $ifNull: ['$quantity', 0] } },
                },
            },
        ]);

        const summary = {
            water: { totalAmount: 0, totalQuantity: 0 },
            electricity: { totalAmount: 0, totalQuantity: 0 },
        };

        for (const item of result) {
            if (item._id === UtilityType.WATER) {
                summary.water = { totalAmount: item.totalAmount, totalQuantity: item.totalQuantity };
            } else if (item._id === UtilityType.ELECTRICITY) {
                summary.electricity = { totalAmount: item.totalAmount, totalQuantity: item.totalQuantity };
            }
        }

        return summary;
    }
}
