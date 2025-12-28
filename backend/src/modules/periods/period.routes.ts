import { FastifyInstance } from 'fastify';
import { PeriodController } from './period.controller';
import { Permission } from '../permissions/permission.enum';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';

export async function periodRoutes(fastify: FastifyInstance) {
    // Create new period
    fastify.post('/periods', {
        preHandler: [authMiddleware, requirePermission(Permission.PERIOD_CREATE)],
    }, PeriodController.createPeriod as any);

    // Close a period
    fastify.post('/periods/:id/close', {
        preHandler: [authMiddleware, requirePermission(Permission.PERIOD_CLOSE)],
    }, PeriodController.closePeriod as any);

    // Get all periods
    fastify.get('/periods', {
        preHandler: [authMiddleware, requirePermission(Permission.PERIOD_VIEW)],
    }, PeriodController.getAllPeriods as any);

    // Get period by ID
    fastify.get('/periods/:id', {
        preHandler: [authMiddleware, requirePermission(Permission.PERIOD_VIEW)],
    }, PeriodController.getPeriod as any);

    // Update an ACTIVE period
    fastify.patch('/periods/:id', {
        preHandler: [authMiddleware, requirePermission(Permission.PERIOD_UPDATE)],
    }, PeriodController.updatePeriod as any);

    // Add expense to period
    fastify.post('/periods/:id/expenses', {
        preHandler: [authMiddleware, requirePermission(Permission.PERIOD_EXPENSE_CREATE)],
    }, PeriodController.addExpense as any);

    // Get expenses for period
    fastify.get('/periods/:id/expenses', {
        preHandler: [authMiddleware, requirePermission(Permission.PERIOD_VIEW)],
    }, PeriodController.getExpenses as any);

    // Get P&L for all sections in a period
    fastify.get('/periods/:id/sections/pl', {
        preHandler: [authMiddleware, requirePermission(Permission.PERIOD_VIEW)],
    }, PeriodController.getAllSectionsPL as any);
}
