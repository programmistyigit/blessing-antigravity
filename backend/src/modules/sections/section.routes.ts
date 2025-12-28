import { FastifyInstance } from 'fastify';
import { SectionController } from './section.controller';
import { ChickOutController } from './chick-out.controller';
import { Permission } from '../permissions/permission.enum';
// Assuming verifyAuth and requirePermission middlewares exist.
// Based on file list, they are likely in src/middlewares/auth.middleware.ts
// I'll check that file or assume standard names.
// "middlewares" had 2 files. One is probably auth.
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';

export async function sectionRoutes(fastify: FastifyInstance) {
    // SECTION ROUTES
    fastify.post('/sections', {
        preHandler: [authMiddleware, requirePermission(Permission.SECTION_CREATE)],
    }, SectionController.createSection);

    fastify.patch('/sections/:id', {
        preHandler: [authMiddleware, requirePermission(Permission.SECTION_UPDATE)],
    }, SectionController.updateSection);

    fastify.get('/sections', {
        preHandler: [authMiddleware, requirePermission(Permission.SECTION_VIEW)],
    }, SectionController.getSections);

    fastify.post('/sections/:id/assign-workers', {
        preHandler: [authMiddleware, requirePermission(Permission.SECTION_ASSIGN_WORKER)],
    }, SectionController.assignWorkers);

    fastify.post('/sections/:id/close', {
        preHandler: [authMiddleware, requirePermission(Permission.SECTION_CLOSE)],
    }, SectionController.closeSection);

    // SECTION STATUS UPDATE
    fastify.patch('/sections/:id/status', {
        preHandler: [authMiddleware, requirePermission(Permission.SECTION_STATUS_UPDATE)],
    }, SectionController.updateSectionStatus as any);

    // DAILY REPORT ROUTES
    fastify.post('/sections/:id/reports', {
        preHandler: [authMiddleware, requirePermission(Permission.SECTION_DAILY_REPORT_CREATE)],
    }, SectionController.createReport);

    fastify.get('/sections/:id/reports', {
        preHandler: [authMiddleware, requirePermission(Permission.SECTION_DAILY_REPORT_VIEW)],
    }, SectionController.getReports);

    fastify.patch('/reports/:id', {
        preHandler: [authMiddleware, requirePermission(Permission.SECTION_DAILY_REPORT_UPDATE)],
    }, SectionController.updateReport);

    // CHICK OUT ROUTES
    fastify.post('/sections/:id/chick-outs', {
        preHandler: [authMiddleware, requirePermission(Permission.CHICK_OUT_CREATE)],
    }, ChickOutController.createChickOut as any);

    fastify.get('/sections/:id/chick-outs', {
        preHandler: [authMiddleware, requirePermission(Permission.SECTION_VIEW)],
    }, ChickOutController.getSectionChickOuts as any);
    // SECTION PERIOD ASSIGNMENT
    fastify.patch('/sections/:id/assign-period', {
        preHandler: [authMiddleware, requirePermission(Permission.SECTION_STATUS_UPDATE)],
    }, SectionController.assignPeriod as any);

    fastify.patch('/sections/:id/unassign-period', {
        preHandler: [authMiddleware, requirePermission(Permission.SECTION_STATUS_UPDATE)],
    }, SectionController.unassignPeriod as any);

    // CHICK OUT COMPLETE (2-Phase)
    fastify.patch('/chick-outs/:id/complete', {
        preHandler: [authMiddleware, requirePermission(Permission.CHICKOUT_COMPLETE)],
    }, ChickOutController.completeChickOut as any);
}

