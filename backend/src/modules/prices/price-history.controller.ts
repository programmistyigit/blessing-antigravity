import { FastifyRequest, FastifyReply } from 'fastify';
import { PriceHistoryService } from './price-history.service';
import { PriceType } from './price-history.model';

export class PriceHistoryController {
    /**
     * Set new price
     */
    static async setPrice(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { type, value, effectiveFrom, description } = request.body as any;
            const userId = (request as any).user?.id;

            if (!type || value === undefined) {
                return reply.status(400).send({
                    error: 'type and value are required'
                });
            }

            if (!Object.values(PriceType).includes(type)) {
                return reply.status(400).send({
                    error: 'Invalid price type. Must be FEED, WATER, ELECTRICITY, or CHICK_PRICE'
                });
            }

            if (value < 0) {
                return reply.status(400).send({
                    error: 'value cannot be negative'
                });
            }

            const price = await PriceHistoryService.setPrice({
                type,
                value,
                effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
                changedBy: userId,
                description,
            });

            return reply.status(201).send(price);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }

    /**
     * Get current price for a type
     */
    static async getCurrentPrice(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { type } = request.params as { type: PriceType };

            if (!Object.values(PriceType).includes(type)) {
                return reply.status(400).send({
                    error: 'Invalid price type'
                });
            }

            const value = await PriceHistoryService.getCurrentPrice(type);
            return reply.send({ type, value });
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }

    /**
     * Get all current prices
     */
    static async getAllCurrentPrices(request: FastifyRequest, reply: FastifyReply) {
        try {
            const prices = await PriceHistoryService.getAllCurrentPrices();
            return reply.send(prices);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }

    /**
     * Get price history
     */
    static async getHistory(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { type } = request.query as { type?: PriceType };
            const limit = 50;

            if (type) {
                if (!Object.values(PriceType).includes(type)) {
                    return reply.status(400).send({ error: 'Invalid price type' });
                }
                const history = await PriceHistoryService.getHistory(type, limit);
                return reply.send(history);
            }

            const history = await PriceHistoryService.getAllHistory(limit);
            return reply.send(history);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }
}
