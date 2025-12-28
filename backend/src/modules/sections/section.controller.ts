import { FastifyRequest, FastifyReply } from 'fastify';
import { SectionService } from './section.service';
import { ReportService } from './report.service';
import { SectionPLService } from './section-pl.service';
import { SectionInsightService } from './section-insight.service';
import { createSectionSchema, updateSectionSchema, assignWorkersSchema, assignPeriodSchema } from './section.schema';
import { createReportSchema, updateReportSchema } from './report.schema';
import { successResponse, errorResponse } from '../../utils/response.util';
import { z } from 'zod';

// Define minimal user type expected on request
interface RequestUser {
    userId: string;
    roleId: string;
    permissions: string[];
}

export class SectionController {
    // --- SECTION HANDLERS ---

    static async createSection(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = (request as any).user as RequestUser;
            const validatedData = createSectionSchema.parse(request.body);

            const section = await SectionService.createSection({
                ...validatedData,
                createdBy: user.userId,
            });

            return reply.code(201).send(successResponse(section, 'Section created successfully'));
        } catch (error) {
            return SectionController.handleError(error, reply);
        }
    }

    static async updateSection(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const validatedData = updateSectionSchema.parse(request.body);

            const section = await SectionService.updateSection(id, validatedData);

            return reply.code(200).send(successResponse(section, 'Section updated successfully'));
        } catch (error) {
            return SectionController.handleError(error, reply);
        }
    }

    static async getSections(_request: FastifyRequest, reply: FastifyReply) {
        try {
            // Can add query filters later
            const sections = await SectionService.getAllSections();
            return reply.code(200).send(successResponse(sections, 'Sections retrieved successfully'));
        } catch (error) {
            return SectionController.handleError(error, reply);
        }
    }

    static async assignWorkers(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const validatedData = assignWorkersSchema.parse(request.body);

            const section = await SectionService.assignWorkers(id, validatedData.workerIds);

            return reply.code(200).send(successResponse(section, 'Workers assigned successfully'));
        } catch (error) {
            return SectionController.handleError(error, reply);
        }
    }

    static async closeSection(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const section = await SectionService.closeSection(id);

            return reply.code(200).send(successResponse(section, 'Section closed successfully'));
        } catch (error) {
            return SectionController.handleError(error, reply);
        }
    }

    static async updateSectionStatus(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const { status } = request.body as { status: string };

            if (!status) {
                return reply.code(400).send(errorResponse('Status is required'));
            }

            const section = await SectionService.updateSection(id, { status: status as any });

            return reply.code(200).send(successResponse(section, 'Section status updated successfully'));
        } catch (error) {
            return SectionController.handleError(error, reply);
        }
    }

    static async assignPeriod(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const validatedData = assignPeriodSchema.parse(request.body);

            const section = await SectionService.assignPeriod(id, validatedData.periodId);

            return reply.code(200).send(successResponse(section, 'Section assigned to period successfully'));
        } catch (error) {
            return SectionController.handleError(error, reply);
        }
    }

    static async unassignPeriod(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };

            const section = await SectionService.unassignPeriod(id);

            return reply.code(200).send(successResponse(section, 'Section unassigned from period successfully'));
        } catch (error) {
            return SectionController.handleError(error, reply);
        }
    }

    // --- REPORT HANDLERS ---

    static async createReport(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = (request as any).user as RequestUser; // JWT Payload
            const { id: sectionId } = request.params as { id: string };
            const validatedData = createReportSchema.parse(request.body);

            // Pass the user object (mocked somewhat as we only have ID in payload)
            // But service expects IUser to check ID matching.
            // We can construct a partial User object or fetch it.
            // ReportService.createReport expects IUser to check ._id
            // Let's fetch the actual user or just pass { _id: user.userId } casted.
            const userStub = { _id: user.userId } as any;

            const report = await ReportService.createReport({
                ...validatedData,
                sectionId,
                createdBy: user.userId,
            }, userStub);

            return reply.code(201).send(successResponse(report, 'Daily report created successfully'));
        } catch (error) {
            return SectionController.handleError(error, reply);
        }
    }

    static async updateReport(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = (request as any).user as RequestUser;
            const { id } = request.params as { id: string };
            const validatedData = updateReportSchema.parse(request.body);

            const report = await ReportService.updateReport(id, validatedData, user.userId);

            return reply.code(200).send(successResponse(report, 'Daily report updated successfully'));
        } catch (error) {
            return SectionController.handleError(error, reply);
        }
    }

    static async getReports(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id: sectionId } = request.params as { id: string };
            const reports = await ReportService.getReportsBySectionId(sectionId);

            return reply.code(200).send(successResponse(reports, 'Reports retrieved successfully'));
        } catch (error) {
            return SectionController.handleError(error, reply);
        }
    }

    // --- SECTION P&L HANDLER ---

    static async getSectionPL(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const pl = await SectionPLService.getSectionPL(id);

            return reply.code(200).send(successResponse(pl, 'Section P&L retrieved successfully'));
        } catch (error) {
            return SectionController.handleError(error, reply);
        }
    }

    // --- SECTION ANALYTICS HANDLER ---

    static async getPeriodAnalytics(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id: periodId } = request.params as { id: string };
            const analytics = await SectionInsightService.getPeriodAnalytics(periodId);

            return reply.code(200).send(successResponse(analytics, 'Section analytics retrieved successfully'));
        } catch (error) {
            return SectionController.handleError(error, reply);
        }
    }

    // Helper
    private static handleError(error: unknown, reply: FastifyReply) {
        if (error instanceof z.ZodError) {
            return reply.code(400).send(errorResponse('Validation failed', error));
        }
        if (error instanceof Error) {
            if (error.message.includes('not found')) return reply.code(404).send(errorResponse(error.message));
            if (error.message.includes('already exists')) return reply.code(409).send(errorResponse(error.message));
            if (error.message.includes('permission') || error.message.includes('not assigned')) return reply.code(403).send(errorResponse(error.message));
            if (error.message.includes('CLOSED')) return reply.code(400).send(errorResponse(error.message));
            return reply.code(400).send(errorResponse(error.message)); // Default to 400 for logic errors
        }
        console.error('Unhandled error:', error);
        return reply.code(500).send(errorResponse('Internal server error'));
    }
}
