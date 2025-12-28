import { FastifyRequest, FastifyReply } from 'fastify';
import { DashboardService } from './dashboard.service';
import { successResponse, errorResponse } from '../../utils/response.util';

export class DashboardController {

    static async getSectionDashboard(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const dashboard = await DashboardService.getSectionDashboard(id);
            return reply.code(200).send(successResponse(dashboard, 'Section dashboard data retrieved'));
        } catch (error) {
            return DashboardController.handleError(error, reply);
        }
    }

    static async getCompanyDashboard(_request: FastifyRequest, reply: FastifyReply) {
        try {
            const dashboard = await DashboardService.getCompanyDashboard();
            return reply.code(200).send(successResponse(dashboard, 'Company dashboard data retrieved'));
        } catch (error) {
            return DashboardController.handleError(error, reply);
        }
    }

    private static handleError(error: unknown, reply: FastifyReply) {
        console.error('Dashboard Error:', error);
        if (error instanceof Error) {
            if (error.message.includes('not found')) return reply.code(404).send(errorResponse(error.message));
            return reply.code(400).send(errorResponse(error.message));
        }
        return reply.code(500).send(errorResponse('Internal server error'));
    }
}
