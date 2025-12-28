import { PriceHistory, IPriceHistory, PriceType } from './price-history.model';
import { emitPriceChanged } from '../../realtime/events';

interface SetPriceData {
    type: PriceType;
    value: number;
    effectiveFrom?: Date;
    changedBy: string;
    description?: string;
}

export class PriceHistoryService {
    /**
     * Set new price
     * Creates new price entry (does not modify existing)
     */
    static async setPrice(data: SetPriceData): Promise<IPriceHistory> {
        const effectiveFrom = data.effectiveFrom || new Date();

        const price = new PriceHistory({
            type: data.type,
            value: data.value,
            effectiveFrom,
            changedBy: data.changedBy,
            description: data.description || '',
        });

        await price.save();

        // Emit WebSocket event
        emitPriceChanged({
            type: data.type,
            value: data.value,
            effectiveFrom: effectiveFrom.toISOString(),
        });

        return price;
    }

    /**
     * Get current price for a type
     * Returns the latest price effective as of now
     */
    static async getCurrentPrice(type: PriceType): Promise<number | null> {
        const now = new Date();
        const price = await PriceHistory.findOne({
            type,
            effectiveFrom: { $lte: now },
        }).sort({ effectiveFrom: -1 });

        return price ? price.value : null;
    }

    /**
     * Get price at a specific date
     */
    static async getPriceAt(type: PriceType, date: Date): Promise<number | null> {
        const price = await PriceHistory.findOne({
            type,
            effectiveFrom: { $lte: date },
        }).sort({ effectiveFrom: -1 });

        return price ? price.value : null;
    }

    /**
     * Get all current prices
     */
    static async getAllCurrentPrices(): Promise<{ [key: string]: number | null }> {
        const prices: { [key: string]: number | null } = {};

        for (const type of Object.values(PriceType)) {
            prices[type] = await this.getCurrentPrice(type);
        }

        return prices;
    }

    /**
     * Get price history for a type
     */
    static async getHistory(type: PriceType, limit: number = 50): Promise<IPriceHistory[]> {
        return PriceHistory.find({ type })
            .populate('changedBy', 'fullName username')
            .sort({ effectiveFrom: -1 })
            .limit(limit);
    }

    /**
     * Get all price history
     */
    static async getAllHistory(limit: number = 100): Promise<IPriceHistory[]> {
        return PriceHistory.find()
            .populate('changedBy', 'fullName username')
            .sort({ effectiveFrom: -1 })
            .limit(limit);
    }
}
