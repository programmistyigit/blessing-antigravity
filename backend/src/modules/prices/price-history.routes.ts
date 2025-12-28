import { FastifyInstance } from 'fastify';
import { PriceHistoryController } from './price-history.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { Permission } from '../permissions/permission.enum';

export async function priceRoutes(fastify: FastifyInstance) {
    // All routes require authentication
    fastify.addHook('preHandler', authMiddleware);

    // Set new price (PRICE_MANAGE)
    fastify.post('/prices', {
        preHandler: [requirePermission(Permission.PRICE_MANAGE)]
    }, PriceHistoryController.setPrice);

    // Get all current prices (any authenticated user)
    fastify.get('/prices/current', PriceHistoryController.getAllCurrentPrices);

    // Get current price for specific type
    fastify.get('/prices/current/:type', PriceHistoryController.getCurrentPrice);

    // Get price history (PRICE_MANAGE)
    fastify.get('/prices/history', {
        preHandler: [requirePermission(Permission.PRICE_MANAGE)]
    }, PriceHistoryController.getHistory);
}
