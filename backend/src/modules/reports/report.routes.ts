import { FastifyInstance } from 'fastify';
import { ReportController } from './report.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { Permission } from '../permissions/permission.enum';

export async function reportRoutes(fastify: FastifyInstance) {
    fastify.get('/reports/sections/:id', {
        preHandler: [authMiddleware, requirePermission(Permission.REPORT_VIEW)],
    }, ReportController.getSectionReport);

    fastify.get('/reports/sections/:id/export', {
        preHandler: [authMiddleware, requirePermission(Permission.REPORT_EXPORT)],
    }, ReportController.exportSectionReport);
}
