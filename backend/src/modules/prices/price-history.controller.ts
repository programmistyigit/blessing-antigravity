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
            const user = (request as any).user;

            // Validate user is authenticated
            if (!user?.userId) {
                return reply.status(401).send({
                    success: false,
                    error: 'Authentication required'
                });
            }

            if (!type || value === undefined) {
                return reply.status(400).send({
                    success: false,
                    error: 'type and value are required'
                });
            }

            if (!Object.values(PriceType).includes(type)) {
                return reply.status(400).send({
                    success: false,
                    error: 'Invalid price type. Must be FEED, WATER, ELECTRICITY, or CHICK_PRICE'
                });
            }

            if (value < 0) {
                return reply.status(400).send({
                    success: false,
                    error: 'value cannot be negative'
                });
            }

            const price = await PriceHistoryService.setPrice({
                type,
                value,
                effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
                changedBy: user.userId,
                description,
            });

            return reply.status(201).send({ success: true, data: price });
        } catch (error: any) {
            return reply.status(500).send({ success: false, error: error.message });
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
                    success: false,
                    error: 'Invalid price type'
                });
            }

            const value = await PriceHistoryService.getCurrentPrice(type);
            return reply.send({ success: true, data: { type, value } });
        } catch (error: any) {
            return reply.status(500).send({ success: false, error: error.message });
        }
    }

    /**
     * Get all current prices
     */
    static async getAllCurrentPrices(_request: FastifyRequest, reply: FastifyReply) {
        try {
            const prices = await PriceHistoryService.getAllCurrentPrices();
            return reply.send({ success: true, data: prices });
        } catch (error: any) {
            return reply.status(500).send({ success: false, error: error.message });
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
                    return reply.status(400).send({ success: false, error: 'Invalid price type' });
                }
                const history = await PriceHistoryService.getHistory(type, limit);
                return reply.send({ success: true, data: history });
            }

            const history = await PriceHistoryService.getAllHistory(limit);
            return reply.send({ success: true, data: history });
        } catch (error: any) {
            return reply.status(500).send({ success: false, error: error.message });
        }
    }
}

