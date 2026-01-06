import { FastifyRequest, FastifyReply } from 'fastify';
import { FeedService } from './feed.service';

export class FeedController {
    /**
     * Record feed delivery
     */
    static async recordDelivery(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { batchId, quantityKg, pricePerKg, deliveredAt, notes } = request.body as any;
            const userId = (request as any).user?.id;

            if (!batchId || !quantityKg || !pricePerKg) {
                return reply.status(400).send({
                    error: 'batchId, quantityKg, and pricePerKg are required'
                });
            }

            if (quantityKg <= 0 || pricePerKg < 0) {
                return reply.status(400).send({
                    error: 'quantityKg must be positive and pricePerKg cannot be negative'
                });
            }

            const delivery = await FeedService.recordDelivery({
                batchId,
                quantityKg,
                pricePerKg,
                deliveredAt: deliveredAt ? new Date(deliveredAt) : undefined,
                deliveredBy: userId,
                notes,
            });

            return reply.status(201).send(delivery);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }

    /**
     * Get deliveries by batch
     */
    static async getDeliveriesByBatch(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { batchId } = request.query as { batchId: string };

            if (!batchId) {
                return reply.status(400).send({ error: 'batchId query param is required' });
            }

            const deliveries = await FeedService.getDeliveriesByBatch(batchId);
            return reply.send(deliveries);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }

    /**
     * Get deliveries by period
     */
    static async getDeliveriesByPeriod(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { periodId } = request.query as { periodId: string };

            if (!periodId) {
                return reply.status(400).send({ error: 'periodId query param is required' });
            }

            const deliveries = await FeedService.getDeliveriesByPeriod(periodId);
            return reply.send(deliveries);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }

    /**
     * Get period feed total
     */
    static async getPeriodFeedTotal(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { periodId } = request.params as { periodId: string };

            const summary = await FeedService.getPeriodFeedTotal(periodId);
            return reply.send(summary);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }

    /**
     * Get batch feed summary
     */
    static async getBatchFeedSummary(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { batchId } = request.params as { batchId: string };

            const summary = await FeedService.getBatchFeedSummary(batchId);
            return reply.send(summary);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }
}
