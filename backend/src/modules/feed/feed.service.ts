import mongoose from 'mongoose';
import { FeedDelivery, IFeedDelivery } from './feed.model';
import { PeriodExpense, ExpenseCategory } from '../periods/period-expense.model';
import { Batch } from '../sections/batch.model';
import { Section } from '../sections/section.model';
import { emitFeedDeliveryRecorded } from '../../realtime/events';

interface RecordDeliveryData {
    batchId: string;
    quantityKg: number;
    pricePerKg: number;
    deliveredAt?: Date;
    deliveredBy: string;
    notes?: string;
}

export class FeedService {
    /**
     * Record feed delivery
     * Creates FeedDelivery + PeriodExpense(FEED)
     */
    static async recordDelivery(data: RecordDeliveryData): Promise<IFeedDelivery> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Get batch and validate
            const batch = await Batch.findById(data.batchId);
            if (!batch) {
                throw new Error('Batch not found');
            }

            // Get section for period info
            const section = await Section.findById(batch.sectionId);
            if (!section) {
                throw new Error('Section not found');
            }

            if (!section.activePeriodId) {
                throw new Error('Section has no active period');
            }

            const periodId = section.activePeriodId.toString();
            const totalCost = data.quantityKg * data.pricePerKg;
            const deliveredAt = data.deliveredAt || new Date();

            // Create PeriodExpense first
            const [expense] = await PeriodExpense.create([{
                periodId,
                category: ExpenseCategory.FEED,
                amount: totalCost,
                description: `Yem yetkazib berish: ${data.quantityKg} kg × ${data.pricePerKg} so'm`,
                expenseDate: deliveredAt,
                sectionId: batch.sectionId,
                source: 'MANUAL',
                createdBy: data.deliveredBy,
            }], { session });

            // Create FeedDelivery
            const delivery = new FeedDelivery({
                batchId: data.batchId,
                periodId,
                quantityKg: data.quantityKg,
                pricePerKg: data.pricePerKg,
                totalCost,
                deliveredAt,
                deliveredBy: data.deliveredBy,
                expenseId: expense._id,
                notes: data.notes || '',
            });
            await delivery.save({ session });

            await session.commitTransaction();

            // Emit WebSocket event
            emitFeedDeliveryRecorded({
                sectionId: batch.sectionId.toString(),
                periodId,
                quantityKg: data.quantityKg,
                totalCost,
                deliveredAt: deliveredAt.toISOString(),
            });

            return delivery;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Get deliveries by batch
     */
    static async getDeliveriesByBatch(batchId: string): Promise<IFeedDelivery[]> {
        return FeedDelivery.find({ batchId })
            .populate('deliveredBy', 'fullName username')
            .sort({ deliveredAt: -1 });
    }

    /**
     * Get deliveries by period
     */
    static async getDeliveriesByPeriod(periodId: string): Promise<IFeedDelivery[]> {
        return FeedDelivery.find({ periodId })
            .populate('batchId', 'name')
            .populate('deliveredBy', 'fullName username')
            .sort({ deliveredAt: -1 });
    }

    /**
     * Get total feed cost for period
     */
    static async getPeriodFeedTotal(periodId: string): Promise<{ totalKg: number; totalCost: number }> {
        const result = await FeedDelivery.aggregate([
            { $match: { periodId: new mongoose.Types.ObjectId(periodId) } },
            {
                $group: {
                    _id: null,
                    totalKg: { $sum: '$quantityKg' },
                    totalCost: { $sum: '$totalCost' },
                },
            },
        ]);

        return result.length > 0
            ? { totalKg: result[0].totalKg, totalCost: result[0].totalCost }
            : { totalKg: 0, totalCost: 0 };
    }

    /**
     * Get batch feed summary
     */
    static async getBatchFeedSummary(batchId: string): Promise<{ totalKg: number; totalCost: number; deliveryCount: number }> {
        const result = await FeedDelivery.aggregate([
            { $match: { batchId: new mongoose.Types.ObjectId(batchId) } },
            {
                $group: {
                    _id: null,
                    totalKg: { $sum: '$quantityKg' },
                    totalCost: { $sum: '$totalCost' },
                    deliveryCount: { $sum: 1 },
                },
            },
        ]);

        return result.length > 0
            ? { totalKg: result[0].totalKg, totalCost: result[0].totalCost, deliveryCount: result[0].deliveryCount }
            : { totalKg: 0, totalCost: 0, deliveryCount: 0 };
    }
}
