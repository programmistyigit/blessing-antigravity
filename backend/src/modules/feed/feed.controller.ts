import { FastifyRequest, FastifyReply } from 'fastify';
import { FeedService } from './feed.service';

export class FeedController {
    /**
     * Record feed delivery
     */
    static async recordDelivery(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { sectionId, quantityKg, pricePerKg, deliveredAt, notes } = request.body as any;
            const userId = (request as any).user?.id;

            if (!sectionId || !quantityKg || !pricePerKg) {
                return reply.status(400).send({
                    error: 'sectionId, quantityKg, and pricePerKg are required'
                });
            }

            if (quantityKg <= 0 || pricePerKg < 0) {
                return reply.status(400).send({
                    error: 'quantityKg must be positive and pricePerKg cannot be negative'
                });
            }

            const delivery = await FeedService.recordDelivery({
                sectionId,
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
     * Get deliveries by section
     */
    static async getDeliveriesBySection(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { sectionId } = request.query as { sectionId: string };

            if (!sectionId) {
                return reply.status(400).send({ error: 'sectionId query param is required' });
            }

            const deliveries = await FeedService.getDeliveriesBySection(sectionId);
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
     * Get section feed summary
     */
    static async getSectionFeedSummary(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { sectionId } = request.params as { sectionId: string };
            const { periodId } = request.query as { periodId?: string };

            const summary = await FeedService.getSectionFeedSummary(sectionId, periodId);
            return reply.send(summary);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }
}
