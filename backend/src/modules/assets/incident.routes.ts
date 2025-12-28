import { FastifyInstance } from 'fastify';
import { IncidentController } from './incident.controller';
import { RepairExpenseController } from './repair-expense.controller';
import { Permission } from '../permissions/permission.enum';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';

export async function incidentRoutes(fastify: FastifyInstance) {
    // Create incident
    fastify.post('/incidents', {
        preHandler: [authMiddleware, requirePermission(Permission.TECH_REPORT_CREATE)],
    }, IncidentController.createIncident as any);

    // Get all incidents
    fastify.get('/incidents', {
        preHandler: [authMiddleware, requirePermission(Permission.TECH_REPORT_VIEW)],
    }, IncidentController.getAllIncidents as any);

    // Get incident by ID
    fastify.get('/incidents/:id', {
        preHandler: [authMiddleware, requirePermission(Permission.TECH_REPORT_VIEW)],
    }, IncidentController.getIncident as any);

    // Get incidents by asset
    fastify.get('/assets/:id/incidents', {
        preHandler: [authMiddleware, requirePermission(Permission.TECH_REPORT_VIEW)],
    }, IncidentController.getIncidentsByAsset as any);

    // Get incidents by section
    fastify.get('/sections/:id/incidents', {
        preHandler: [authMiddleware, requirePermission(Permission.TECH_REPORT_VIEW)],
    }, IncidentController.getIncidentsBySection as any);

    // Resolve/unresolve incident
    fastify.patch('/incidents/:id/resolve', {
        preHandler: [authMiddleware, requirePermission(Permission.TECH_REPORT_UPDATE)],
    }, IncidentController.resolveIncident as any);

    // =========================================
    // REPAIR EXPENSE ROUTES
    // =========================================

    // Create repair expense for incident
    fastify.post('/incidents/:id/expense', {
        preHandler: [authMiddleware, requirePermission(Permission.FINANCE_EXPENSE_APPROVE)],
    }, RepairExpenseController.createRepairExpense as any);

    // Get expense for incident
    fastify.get('/incidents/:id/expense', {
        preHandler: [authMiddleware, requirePermission(Permission.TECH_REPORT_VIEW)],
    }, RepairExpenseController.getExpenseByIncident as any);
}

