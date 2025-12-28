import { FastifyRequest, FastifyReply } from 'fastify';
import { BatchSummaryService } from './batch-summary.service';

/**
 * BatchSummary Controller
 * Read-only endpoints for batch summary and timeline
 */
export class BatchSummaryController {
    /**
     * GET /api/batches/:batchId/summary
     * Get batch summary (yakuniy hisob)
     */
    static async getBatchSummary(
        request: FastifyRequest<{ Params: { batchId: string } }>,
        reply: FastifyReply
    ) {
        try {
            const { batchId } = request.params;

            const summary = await BatchSummaryService.getBatchSummary(batchId);

            return reply.status(200).send({
                success: true,
                data: summary,
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                error: error.message || 'Failed to get batch summary',
            });
        }
    }

    /**
     * GET /api/batches/:batchId/timeline
     * Get batch timeline (kunma-kun jadval)
     */
    static async getBatchTimeline(
        request: FastifyRequest<{ Params: { batchId: string } }>,
        reply: FastifyReply
    ) {
        try {
            const { batchId } = request.params;

            const timeline = await BatchSummaryService.getBatchTimeline(batchId);

            return reply.status(200).send({
                success: true,
                data: timeline,
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                error: error.message || 'Failed to get batch timeline',
            });
        }
    }

    /**
     * GET /api/sections/:sectionId/batch-summaries
     * Get all batch summaries for a section
     */
    static async getBatchSummariesBySection(
        request: FastifyRequest<{ Params: { sectionId: string } }>,
        reply: FastifyReply
    ) {
        try {
            const { sectionId } = request.params;

            const summaries = await BatchSummaryService.getBatchSummariesBySection(sectionId);

            return reply.status(200).send({
                success: true,
                data: summaries,
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                error: error.message || 'Failed to get batch summaries',
            });
        }
    }

    /**
     * GET /api/batches/:batchId/verify-totals
     * Verify data integrity between DailyBalance and ChickOut
     */
    static async verifyTotals(
        request: FastifyRequest<{ Params: { batchId: string } }>,
        reply: FastifyReply
    ) {
        try {
            const { batchId } = request.params;

            const verification = await BatchSummaryService.verifyTotals(batchId);

            return reply.status(200).send({
                success: true,
                data: verification,
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                error: error.message || 'Failed to verify totals',
            });
        }
    }
}
