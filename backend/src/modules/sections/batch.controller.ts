import { FastifyRequest, FastifyReply } from 'fastify';
import { BatchService } from './batch.service';
import { createBatchSchema, closeBatchSchema } from './batch.schema';
import { successResponse, errorResponse } from '../../utils/response.util';

// Define minimal user type expected on request
interface RequestUser {
    userId: string;
    roleId: string;
    permissions: string[];
}

export class BatchController {
    /**
     * POST /api/batches
     * Create a new batch
     */
    static async createBatch(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = (request as any).user as RequestUser;
            const result = createBatchSchema.safeParse(request.body);
            if (!result.success) {
                return reply.code(400).send(errorResponse(result.error.errors[0].message));
            }

            const batch = await BatchService.createBatch({
                sectionId: result.data.sectionId,
                startedAt: result.data.startedAt ? new Date(result.data.startedAt) : undefined,
                expectedEndAt: new Date(result.data.expectedEndAt),
                totalChicksIn: result.data.totalChicksIn,
                createdBy: user.userId,
            });

            return reply.code(201).send(successResponse(batch, 'Batch created successfully'));
        } catch (error: any) {
            return reply.code(400).send(errorResponse(error.message));
        }
    }

    /**
     * POST /api/batches/:id/close
     * Close a batch
     */
    static async closeBatch(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const result = closeBatchSchema.safeParse(request.body || {});

            const batch = await BatchService.closeBatch(
                id,
                result.success && result.data.endedAt ? new Date(result.data.endedAt) : undefined
            );

            return reply.send(successResponse(batch, 'Batch closed successfully'));
        } catch (error: any) {
            return reply.code(400).send(errorResponse(error.message));
        }
    }

    /**
     * GET /api/batches/:id
     * Get batch by ID
     */
    static async getBatch(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const batch = await BatchService.getBatchById(id);
            if (!batch) {
                return reply.code(404).send(errorResponse('Batch not found'));
            }
            return reply.send(successResponse(batch));
        } catch (error: any) {
            return reply.code(400).send(errorResponse(error.message));
        }
    }

    /**
     * GET /api/sections/:id/batches
     * Get all batches for a section
     */
    static async getSectionBatches(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const batches = await BatchService.getBatchesBySectionId(id);
            return reply.send(successResponse(batches));
        } catch (error: any) {
            return reply.code(400).send(errorResponse(error.message));
        }
    }
}
