import { ForecastPrice, IForecastPrice, ForecastPriceSource } from './forecast-price.model';
import { ChickOut, ChickOutStatus } from '../sections/chick-out.model';
import { Period } from '../periods/period.model';

/**
 * ForecastPrice Service
 * Forecast uchun narx boshqaruvi
 * 
 * ⚠️ Real ChickOut narxiga TA'SIR QILMAYDI
 */
export class ForecastPriceService {
    /**
     * Director tomonidan dastlabki narx kiritish
     * Faqat SYSTEM_ALL permission bilan
     */
    static async setInitialPrice(data: {
        periodId: string;
        sectionId?: string;
        pricePerKg: number;
        createdBy: string;
    }): Promise<IForecastPrice> {
        // Validate period exists
        const period = await Period.findById(data.periodId);
        if (!period) {
            throw new Error('Period not found');
        }

        // Deactivate existing prices for this period/section
        await ForecastPrice.updateMany(
            {
                periodId: data.periodId,
                sectionId: data.sectionId || null,
                isActive: true,
            },
            { isActive: false }
        );

        // Create new forecast price
        const forecastPrice = new ForecastPrice({
            periodId: data.periodId,
            sectionId: data.sectionId || null,
            pricePerKg: data.pricePerKg,
            source: ForecastPriceSource.MANUAL_INITIAL,
            isActive: true,
            createdBy: data.createdBy,
        });

        await forecastPrice.save();
        return forecastPrice;
    }

    /**
     * ChickOut COMPLETE bo'lganda avtomatik narx yangilash
     * Bu method ChickOut.complete() dan chaqiriladi
     */
    static async updateFromChickOut(chickOutId: string): Promise<IForecastPrice | null> {
        const chickOut = await ChickOut.findById(chickOutId);
        if (!chickOut) {
            return null;
        }

        // Only update from COMPLETE chick outs with price
        if (chickOut.status !== ChickOutStatus.COMPLETE || !chickOut.pricePerKg) {
            return null;
        }

        // Get batch to find periodId
        const { Batch } = await import('../sections/batch.model');
        const batch = await Batch.findById(chickOut.batchId);
        if (!batch || !batch.periodId) {
            return null;
        }

        // Deactivate existing prices for this section
        await ForecastPrice.updateMany(
            {
                periodId: batch.periodId,
                sectionId: batch.sectionId,
                isActive: true,
            },
            { isActive: false }
        );

        // Create new price from real sale
        const forecastPrice = new ForecastPrice({
            periodId: batch.periodId,
            sectionId: batch.sectionId,
            pricePerKg: chickOut.pricePerKg,
            source: ForecastPriceSource.LAST_REAL_SALE,
            linkedChickOutId: chickOut._id,
            isActive: true,
            createdBy: chickOut.completedBy,
        });

        await forecastPrice.save();
        return forecastPrice;
    }

    /**
     * Joriy aktiv narxni olish
     * Avval section-specific, keyin period-wide qidiriladi
     */
    static async getActivePrice(periodId: string, sectionId?: string): Promise<number | null> {
        // First try section-specific price
        if (sectionId) {
            const sectionPrice = await ForecastPrice.findOne({
                periodId,
                sectionId,
                isActive: true,
            }).sort({ createdAt: -1 });

            if (sectionPrice) {
                return sectionPrice.pricePerKg;
            }
        }

        // Fall back to period-wide price
        const periodPrice = await ForecastPrice.findOne({
            periodId,
            sectionId: null,
            isActive: true,
        }).sort({ createdAt: -1 });

        return periodPrice?.pricePerKg || null;
    }

    /**
     * Check if price exists for a period
     */
    static async hasPriceSet(periodId: string): Promise<boolean> {
        const count = await ForecastPrice.countDocuments({
            periodId,
            isActive: true,
        });
        return count > 0;
    }
}
