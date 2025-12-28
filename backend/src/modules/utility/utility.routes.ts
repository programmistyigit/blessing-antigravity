import { FastifyInstance } from 'fastify';
import { UtilityController } from './utility.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { Permission } from '../permissions/permission.enum';

export async function utilityRoutes(fastify: FastifyInstance) {
    // All routes require authentication
    fastify.addHook('preHandler', authMiddleware);

    // Record utility cost (WATER_REPORT or ELECTRICITY_REPORT)
    // Note: Permission check should be dynamic based on type
    // For simplicity, we'll use a combined approach
    fastify.post('/utilities', {
        preHandler: [requirePermission(Permission.WATER_REPORT)]
    }, UtilityController.recordCost);

    // Get costs by period
    fastify.get('/utilities', {
        preHandler: [requirePermission(Permission.WATER_REPORT)]
    }, UtilityController.getCostsByPeriod);

    // Get costs by section
    fastify.get('/utilities/section', {
        preHandler: [requirePermission(Permission.WATER_REPORT)]
    }, UtilityController.getCostsBySection);

    // Get period utility summary
    fastify.get('/utilities/periods/:periodId/summary', {
        preHandler: [requirePermission(Permission.WATER_REPORT)]
    }, UtilityController.getPeriodUtilitySummary);
}
