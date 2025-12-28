import { FastifyInstance } from 'fastify';
import { InventoryController } from './inventory.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { Permission } from '../permissions/permission.enum';

export async function inventoryRoutes(fastify: FastifyInstance) {
    fastify.post('/inventory', {
        preHandler: [authMiddleware, requirePermission(Permission.INVENTORY_CREATE)],
    }, InventoryController.createItem);

    fastify.patch('/inventory/:id', {
        preHandler: [authMiddleware, requirePermission(Permission.INVENTORY_UPDATE)],
    }, InventoryController.updateItem);

    fastify.get('/inventory', {
        preHandler: [authMiddleware, requirePermission(Permission.INVENTORY_READ)],
    }, InventoryController.getItems);

    fastify.delete('/inventory/:id', {
        preHandler: [authMiddleware, requirePermission(Permission.INVENTORY_DELETE)],
    }, InventoryController.deleteItem);

    fastify.get('/inventory/:id/history', {
        preHandler: [authMiddleware, requirePermission(Permission.INVENTORY_READ)],
    }, InventoryController.getHistory);

    fastify.get('/inventory/alerts', {
        preHandler: [authMiddleware, requirePermission(Permission.INVENTORY_ALERT_VIEW)],
    }, InventoryController.getAlerts);

    fastify.patch('/inventory/alerts/:id/resolve', {
        preHandler: [authMiddleware, requirePermission(Permission.INVENTORY_ALERT_RESOLVE)],
    }, InventoryController.resolveAlert);
}
