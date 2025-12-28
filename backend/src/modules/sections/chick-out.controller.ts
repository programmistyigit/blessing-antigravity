import { FastifyRequest, FastifyReply } from 'fastify';
import { ChickOutService } from './chick-out.service';
import { createChickOutSchema } from './chick-out.schema';
import { successResponse, errorResponse } from '../../utils/response.util';

// Define minimal user type expected on request
interface RequestUser {
    userId: string;
    roleId: string;
    permissions: string[];
}

export class ChickOutController {
    /**
     * POST /api/sections/:id/chick-outs
     * Create a chick out record
     */
    static async createChickOut(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = (request as any).user as RequestUser;
            const { id: sectionId } = request.params as { id: string };
            const result = createChickOutSchema.safeParse(request.body);
            if (!result.success) {
                return reply.code(400).send(errorResponse(result.error.errors[0].message));
            }

            const chickOut = await ChickOutService.createChickOut({
                sectionId,
                date: result.data.date ? new Date(result.data.date) : undefined,
                count: result.data.count,
                vehicleNumber: result.data.vehicleNumber,
                machineNumber: result.data.machineNumber,
                isFinal: result.data.isFinal,
                createdBy: user.userId,
            });

            return reply.code(201).send(successResponse(chickOut, 'Chick out recorded successfully'));
        } catch (error: any) {
            return reply.code(400).send(errorResponse(error.message));
        }
    }

    /**
     * GET /api/sections/:id/chick-outs
     * Get all chick outs for a section
     */
    static async getSectionChickOuts(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const chickOuts = await ChickOutService.getChickOutsBySectionId(id);
            return reply.send(successResponse(chickOuts));
        } catch (error: any) {
            return reply.code(400).send(errorResponse(error.message));
        }
    }

    /**
     * PATCH /api/chick-outs/:id/complete
     * Complete a chick out with financial data
     */
    static async completeChickOut(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = (request as any).user as RequestUser;
            const { id } = request.params as { id: string };
            const body = request.body as any;

            // Validate required fields
            if (typeof body.totalWeightKg !== 'number' || body.totalWeightKg <= 0) {
                return reply.code(400).send(errorResponse('totalWeightKg must be a positive number'));
            }
            if (typeof body.wastePercent !== 'number' || body.wastePercent < 0 || body.wastePercent > 100) {
                return reply.code(400).send(errorResponse('wastePercent must be between 0 and 100'));
            }
            if (typeof body.pricePerKg !== 'number' || body.pricePerKg <= 0) {
                return reply.code(400).send(errorResponse('pricePerKg must be a positive number'));
            }

            const chickOut = await ChickOutService.complete(
                id,
                {
                    totalWeightKg: body.totalWeightKg,
                    wastePercent: body.wastePercent,
                    pricePerKg: body.pricePerKg,
                },
                user.userId
            );

            return reply.send(successResponse(chickOut, 'ChickOut completed successfully'));
        } catch (error: any) {
            return reply.code(400).send(errorResponse(error.message));
        }
    }
}
