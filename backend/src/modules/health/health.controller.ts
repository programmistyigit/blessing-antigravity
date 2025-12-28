import { FastifyRequest, FastifyReply } from 'fastify';
import { HealthService } from './health.service';
import { createDiseaseSchema, updateDiseaseSchema, createMedicationSchema, updateMedicationSchema } from './health.schema';
import { successResponse, errorResponse } from '../../utils/response.util';
import { z } from 'zod';

interface RequestUser {
    userId: string;
}

export class HealthController {
    // --- DISEASE ---

    static async createDisease(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = (request as any).user as RequestUser;
            const { id: sectionId } = request.params as { id: string };
            const validatedData = createDiseaseSchema.parse(request.body);

            const disease = await HealthService.createDisease({
                ...validatedData,
                sectionId,
                createdBy: user.userId,
            });

            return reply.code(201).send(successResponse(disease, 'Disease record created successfully'));
        } catch (error) {
            return HealthController.handleError(error, reply);
        }
    }

    static async updateDisease(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const validatedData = updateDiseaseSchema.parse(request.body);

            const disease = await HealthService.updateDisease(id, validatedData);

            return reply.code(200).send(successResponse(disease, 'Disease record updated successfully'));
        } catch (error) {
            return HealthController.handleError(error, reply);
        }
    }

    static async getDiseases(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id: sectionId } = request.params as { id: string };
            const diseases = await HealthService.getDiseases(sectionId);
            return reply.code(200).send(successResponse(diseases, 'Disease records retrieved successfully'));
        } catch (error) {
            return HealthController.handleError(error, reply);
        }
    }

    static async deleteDisease(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            await HealthService.deleteDisease(id);
            return reply.code(200).send(successResponse(null, 'Disease record deleted successfully'));
        } catch (error) {
            return HealthController.handleError(error, reply);
        }
    }

    // --- MEDICATION ---

    static async createMedication(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = (request as any).user as RequestUser;
            const { id: sectionId } = request.params as { id: string };
            const validatedData = createMedicationSchema.parse(request.body);

            const medication = await HealthService.createMedication({
                ...validatedData,
                sectionId,
                createdBy: user.userId,
            });

            return reply.code(201).send(successResponse(medication, 'Medication record created successfully'));
        } catch (error) {
            return HealthController.handleError(error, reply);
        }
    }

    static async updateMedication(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const validatedData = updateMedicationSchema.parse(request.body);

            const medication = await HealthService.updateMedication(id, validatedData);

            return reply.code(200).send(successResponse(medication, 'Medication record updated successfully'));
        } catch (error) {
            return HealthController.handleError(error, reply);
        }
    }

    static async getMedications(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id: sectionId } = request.params as { id: string };
            const medications = await HealthService.getMedications(sectionId);
            return reply.code(200).send(successResponse(medications, 'Medication records retrieved successfully'));
        } catch (error) {
            return HealthController.handleError(error, reply);
        }
    }

    static async deleteMedication(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            await HealthService.deleteMedication(id);
            return reply.code(200).send(successResponse(null, 'Medication record deleted successfully'));
        } catch (error) {
            return HealthController.handleError(error, reply);
        }
    }

    private static handleError(error: unknown, reply: FastifyReply) {
        if (error instanceof z.ZodError) {
            return reply.code(400).send(errorResponse('Validation failed', error));
        }
        if (error instanceof Error) {
            if (error.message.includes('not found')) return reply.code(404).send(errorResponse(error.message));
            if (error.message.includes('inactive section')) return reply.code(400).send(errorResponse(error.message));
            return reply.code(400).send(errorResponse(error.message));
        }
        console.error('Health Error:', error);
        return reply.code(500).send(errorResponse('Internal server error'));
    }
}
