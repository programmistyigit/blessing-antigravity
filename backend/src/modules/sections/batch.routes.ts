import { FastifyInstance } from 'fastify';
import { BatchController } from './batch.controller';
import { BatchSummaryController } from './batch-summary.controller';
import { Permission } from '../permissions/permission.enum';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';

export async function batchRoutes(fastify: FastifyInstance) {
    // Create new batch
    fastify.post('/batches', {
        preHandler: [authMiddleware, requirePermission(Permission.BATCH_CREATE)],
    }, BatchController.createBatch as any);

    // Close a batch
    fastify.post('/batches/:id/close', {
        preHandler: [authMiddleware, requirePermission(Permission.BATCH_CLOSE)],
    }, BatchController.closeBatch as any);

    // Get batch by ID
    fastify.get('/batches/:id', {
        preHandler: [authMiddleware, requirePermission(Permission.SECTION_VIEW)],
    }, BatchController.getBatch as any);

    // Get all batches for a section
    fastify.get('/sections/:id/batches', {
        preHandler: [authMiddleware, requirePermission(Permission.SECTION_VIEW)],
    }, BatchController.getSectionBatches as any);

    // =========================================
    // READ-ONLY SUMMARY & TIMELINE ENDPOINTS
    // =========================================

    // Get batch summary (yakuniy hisob)
    fastify.get('/batches/:batchId/summary', {
        preHandler: [authMiddleware, requirePermission(Permission.SECTION_VIEW)],
    }, BatchSummaryController.getBatchSummary as any);

    // Get batch timeline (kunma-kun jadval)
    fastify.get('/batches/:batchId/timeline', {
        preHandler: [authMiddleware, requirePermission(Permission.SECTION_VIEW)],
    }, BatchSummaryController.getBatchTimeline as any);

    // Get all batch summaries for a section
    fastify.get('/sections/:sectionId/batch-summaries', {
        preHandler: [authMiddleware, requirePermission(Permission.SECTION_VIEW)],
    }, BatchSummaryController.getBatchSummariesBySection as any);

    // Verify totals (data integrity check)
    fastify.get('/batches/:batchId/verify-totals', {
        preHandler: [authMiddleware, requirePermission(Permission.SECTION_VIEW)],
    }, BatchSummaryController.verifyTotals as any);
}

