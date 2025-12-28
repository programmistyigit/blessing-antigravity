import { FastifyInstance } from 'fastify';
import { DashboardController } from './dashboard.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { Permission } from '../permissions/permission.enum';

export async function dashboardRoutes(fastify: FastifyInstance) {
    fastify.get('/dashboard/sections/:id', {
        preHandler: [authMiddleware, requirePermission(Permission.DASHBOARD_READ)],
    }, DashboardController.getSectionDashboard);

    fastify.get('/dashboard/company', {
        preHandler: [authMiddleware, requirePermission(Permission.DASHBOARD_READ)], // Or strict permission if needed
    }, DashboardController.getCompanyDashboard);
}
