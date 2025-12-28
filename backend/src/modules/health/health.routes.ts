import { FastifyInstance } from 'fastify';
import { HealthController } from './health.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { Permission } from '../permissions/permission.enum';

export async function healthRoutes(fastify: FastifyInstance) {
    // DISEASE ROUTES
    fastify.post('/sections/:id/diseases', {
        preHandler: [authMiddleware, requirePermission(Permission.DISEASE_CREATE)],
    }, HealthController.createDisease);

    fastify.patch('/diseases/:id', {
        preHandler: [authMiddleware, requirePermission(Permission.DISEASE_UPDATE)],
    }, HealthController.updateDisease);

    fastify.get('/sections/:id/diseases', {
        preHandler: [authMiddleware, requirePermission(Permission.DISEASE_READ)],
    }, HealthController.getDiseases);

    fastify.delete('/diseases/:id', {
        preHandler: [authMiddleware, requirePermission(Permission.DISEASE_DELETE)],
    }, HealthController.deleteDisease);

    // MEDICATION ROUTES
    fastify.post('/sections/:id/medications', {
        preHandler: [authMiddleware, requirePermission(Permission.MEDICATION_CREATE)],
    }, HealthController.createMedication);

    fastify.patch('/medications/:id', {
        preHandler: [authMiddleware, requirePermission(Permission.MEDICATION_UPDATE)],
    }, HealthController.updateMedication);

    fastify.get('/sections/:id/medications', {
        preHandler: [authMiddleware, requirePermission(Permission.MEDICATION_READ)],
    }, HealthController.getMedications);

    fastify.delete('/medications/:id', {
        preHandler: [authMiddleware, requirePermission(Permission.MEDICATION_DELETE)],
    }, HealthController.deleteMedication);
}
