import { FastifyRequest, FastifyReply } from 'fastify';
import { AttendanceService } from './attendance.service';
import { createAttendanceSchema, updateAttendanceSchema, gpsUpdateSchema } from './attendance.schema';
import { successResponse, errorResponse } from '../../utils/response.util';
import { z } from 'zod';

interface RequestUser {
    userId: string;
}

export class AttendanceController {

    static async checkIn(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = (request as any).user as RequestUser;
            const { id: sectionId } = request.params as { id: string };
            const validatedData = createAttendanceSchema.parse(request.body);

            const attendance = await AttendanceService.checkIn({
                ...validatedData,
                userId: user.userId,
                sectionId,
            });

            return reply.code(201).send(successResponse(attendance, 'Check-in successful'));
        } catch (error) {
            return AttendanceController.handleError(error, reply);
        }
    }

    static async updateAttendance(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const validatedData = updateAttendanceSchema.parse(request.body);

            const attendance = await AttendanceService.updateAttendance(id, validatedData);

            return reply.code(200).send(successResponse(attendance, 'Attendance updated successfully'));
        } catch (error) {
            return AttendanceController.handleError(error, reply);
        }
    }

    static async approveAttendance(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const attendance = await AttendanceService.approveAttendance(id);
            return reply.code(200).send(successResponse(attendance, 'Attendance approved successfully'));
        } catch (error) {
            return AttendanceController.handleError(error, reply);
        }
    }

    static async getAttendance(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id: sectionId } = request.params as { id: string };
            const { date } = request.query as { date?: string };
            const records = await AttendanceService.getAttendanceBySection(sectionId, date);
            return reply.code(200).send(successResponse(records, 'Attendance records retrieved'));
        } catch (error) {
            return AttendanceController.handleError(error, reply);
        }
    }

    static async deleteAttendance(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            await AttendanceService.deleteAttendance(id);
            return reply.code(200).send(successResponse(null, 'Attendance deleted successfully'));
        } catch (error) {
            return AttendanceController.handleError(error, reply);
        }
    }

    static async logGPS(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = (request as any).user as RequestUser;
            const { id: sectionId } = request.params as { id: string };
            const validatedData = gpsUpdateSchema.parse(request.body);

            await AttendanceService.logGPS({
                ...validatedData,
                userId: user.userId,
                sectionId,
            });

            return reply.code(200).send(successResponse(null, 'GPS location logged'));
        } catch (error) {
            return AttendanceController.handleError(error, reply);
        }
    }

    static async getGPSHistory(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id: sectionId } = request.params as { id: string };
            const { userId } = request.query as { userId: string };

            if (!userId) {
                return reply.code(400).send(errorResponse('userId query parameter is required'));
            }

            const history = await AttendanceService.getGPSHistory(sectionId, userId);
            return reply.code(200).send(successResponse(history, 'GPS history retrieved'));
        } catch (error) {
            return AttendanceController.handleError(error, reply);
        }
    }

    private static handleError(error: unknown, reply: FastifyReply) {
        if (error instanceof z.ZodError) {
            return reply.code(400).send(errorResponse('Validation failed', error));
        }
        if (error instanceof Error) {
            if (error.message.includes('not found')) return reply.code(404).send(errorResponse(error.message));
            if (error.message.includes('inactive section')) return reply.code(400).send(errorResponse(error.message));
            if (error.message.includes('already checked in')) return reply.code(409).send(errorResponse(error.message));
            return reply.code(400).send(errorResponse(error.message));
        }
        console.error('Attendance Error:', error);
        return reply.code(500).send(errorResponse('Internal server error'));
    }
}
