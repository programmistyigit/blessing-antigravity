import { FastifyRequest, FastifyReply } from 'fastify';
import { ReportService } from './report.service';
import { successResponse, errorResponse } from '../../utils/response.util';




export class ReportController {

    static async getSectionReport(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const query = request.query as { start?: string; end?: string };

            // Default to last 30 days if not provided
            const end = query.end || new Date().toISOString();
            const start = query.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

            const report = await ReportService.generateSectionReport(id, start, end);
            return reply.code(200).send(successResponse(report, 'Section report generated successfully'));
        } catch (error) {
            return ReportController.handleError(error, reply);
        }
    }

    static async exportSectionReport(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const query = request.query as { start?: string; end?: string };

            const end = query.end || new Date().toISOString();
            const start = query.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

            const report = await ReportService.generateSectionReport(id, start, end);
            const csv = ReportService.generateCSV(report);

            reply.header('Content-Type', 'text/csv');
            reply.header('Content-Disposition', `attachment; filename="report-${id}-${start.split('T')[0]}.csv"`);
            return reply.send(csv);
        } catch (error) {
            return ReportController.handleError(error, reply);
        }
    }

    private static handleError(error: unknown, reply: FastifyReply) {
        console.error('Report Error:', error);
        if (error instanceof Error) {
            if (error.message.includes('not found')) return reply.code(404).send(errorResponse(error.message));
            return reply.code(400).send(errorResponse(error.message));
        }
        return reply.code(500).send(errorResponse('Internal server error'));
    }
}
