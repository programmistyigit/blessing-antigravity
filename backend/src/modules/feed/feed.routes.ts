import { FastifyInstance } from 'fastify';
import { FeedController } from './feed.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { Permission } from '../permissions/permission.enum';

export async function feedRoutes(fastify: FastifyInstance) {
    // All routes require authentication
    fastify.addHook('preHandler', authMiddleware);

    // Record feed delivery (FEED_MANAGE)
    fastify.post('/feed/deliveries', {
        preHandler: [requirePermission(Permission.FEED_MANAGE)]
    }, FeedController.recordDelivery);

    // Get deliveries by batch (FEED_MANAGE)
    fastify.get('/feed/deliveries', {
        preHandler: [requirePermission(Permission.FEED_MANAGE)]
    }, FeedController.getDeliveriesByBatch);

    // Get deliveries by period (FEED_MANAGE)
    fastify.get('/feed/deliveries/period', {
        preHandler: [requirePermission(Permission.FEED_MANAGE)]
    }, FeedController.getDeliveriesByPeriod);

    // Get period feed total (FEED_MANAGE)
    fastify.get('/feed/periods/:periodId/total', {
        preHandler: [requirePermission(Permission.FEED_MANAGE)]
    }, FeedController.getPeriodFeedTotal);

    // Get batch feed summary (FEED_MANAGE)
    fastify.get('/feed/batches/:batchId/summary', {
        preHandler: [requirePermission(Permission.FEED_MANAGE)]
    }, FeedController.getBatchFeedSummary);
}
