import mongoose from 'mongoose';
import { FeedDelivery, IFeedDelivery } from './feed.model';
import { PeriodExpense, ExpenseCategory } from '../periods/period-expense.model';
import { Section } from '../sections/section.model';
import { emitFeedDeliveryRecorded } from '../../realtime/events';

interface RecordDeliveryData {
    sectionId: string;
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
            // Get section and validate
            const section = await Section.findById(data.sectionId);
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
                sectionId: data.sectionId,
                source: 'MANUAL',
                createdBy: data.deliveredBy,
            }], { session });

            // Create FeedDelivery
            const delivery = new FeedDelivery({
                sectionId: data.sectionId,
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
                sectionId: data.sectionId,
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
     * Get deliveries by section
     */
    static async getDeliveriesBySection(sectionId: string): Promise<IFeedDelivery[]> {
        return FeedDelivery.find({ sectionId })
            .populate('deliveredBy', 'fullName username')
            .sort({ deliveredAt: -1 });
    }

    /**
     * Get deliveries by period
     */
    static async getDeliveriesByPeriod(periodId: string): Promise<IFeedDelivery[]> {
        return FeedDelivery.find({ periodId })
            .populate('sectionId', 'name')
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
     * Get section feed summary
     */
    static async getSectionFeedSummary(sectionId: string, periodId?: string): Promise<{ totalKg: number; totalCost: number; deliveryCount: number }> {
        const filter: any = { sectionId: new mongoose.Types.ObjectId(sectionId) };
        if (periodId) {
            filter.periodId = new mongoose.Types.ObjectId(periodId);
        }

        const result = await FeedDelivery.aggregate([
            { $match: filter },
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
