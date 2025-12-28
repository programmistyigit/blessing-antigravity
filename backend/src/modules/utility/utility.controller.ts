import { FastifyRequest, FastifyReply } from 'fastify';
import { UtilityService } from './utility.service';
import { UtilityType } from './utility.model';

export class UtilityController {
    /**
     * Record utility cost
     */
    static async recordCost(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { type, sectionId, periodId, amount, quantity, unitCost, date, notes } = request.body as any;
            const userId = (request as any).user?.id;

            if (!type || !periodId || !amount) {
                return reply.status(400).send({
                    error: 'type, periodId, and amount are required'
                });
            }

            if (!Object.values(UtilityType).includes(type)) {
                return reply.status(400).send({
                    error: 'type must be WATER or ELECTRICITY'
                });
            }

            if (amount <= 0) {
                return reply.status(400).send({
                    error: 'amount must be positive'
                });
            }

            const utilityCost = await UtilityService.recordCost({
                type,
                sectionId,
                periodId,
                amount,
                quantity,
                unitCost,
                date: date ? new Date(date) : undefined,
                createdBy: userId,
                notes,
            });

            return reply.status(201).send(utilityCost);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }

    /**
     * Get costs by period
     */
    static async getCostsByPeriod(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { periodId, type } = request.query as { periodId: string; type?: UtilityType };

            if (!periodId) {
                return reply.status(400).send({ error: 'periodId query param is required' });
            }

            const costs = await UtilityService.getCostsByPeriod(periodId, type);
            return reply.send(costs);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }

    /**
     * Get costs by section
     */
    static async getCostsBySection(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { sectionId, type } = request.query as { sectionId: string; type?: UtilityType };

            if (!sectionId) {
                return reply.status(400).send({ error: 'sectionId query param is required' });
            }

            const costs = await UtilityService.getCostsBySection(sectionId, type);
            return reply.send(costs);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }

    /**
     * Get period utility summary
     */
    static async getPeriodUtilitySummary(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { periodId } = request.params as { periodId: string };

            const summary = await UtilityService.getPeriodUtilitySummary(periodId);
            return reply.send(summary);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }
}
