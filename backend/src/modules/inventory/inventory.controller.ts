import { FastifyRequest, FastifyReply } from 'fastify';
import { InventoryService } from './inventory.service';
import { createInventoryItemSchema, updateInventoryItemSchema } from './inventory.schema';
import { successResponse, errorResponse } from '../../utils/response.util';
import { z } from 'zod';

interface RequestUser {
    userId: string;
}

export class InventoryController {
    static async createItem(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = (request as any).user as RequestUser;
            const validatedData = createInventoryItemSchema.parse(request.body);

            const item = await InventoryService.createItem({
                ...validatedData,
                createdBy: user.userId,
            });

            return reply.code(201).send(successResponse(item, 'Inventory item created successfully'));
        } catch (error) {
            return InventoryController.handleError(error, reply);
        }
    }

    static async updateItem(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = (request as any).user as RequestUser;
            const { id } = request.params as { id: string };
            const validatedData = updateInventoryItemSchema.parse(request.body);

            const item = await InventoryService.updateItem(id, {
                ...validatedData,
                updatedBy: user.userId,
            });

            return reply.code(200).send(successResponse(item, 'Inventory item updated successfully'));
        } catch (error) {
            return InventoryController.handleError(error, reply);
        }
    }

    static async getItems(_request: FastifyRequest, reply: FastifyReply) {
        try {
            const items = await InventoryService.getAllItems();
            return reply.code(200).send(successResponse(items, 'Inventory items retrieved successfully'));
        } catch (error) {
            return InventoryController.handleError(error, reply);
        }
    }

    static async deleteItem(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = (request as any).user as RequestUser;
            const { id } = request.params as { id: string };
            await InventoryService.deleteItem(id, user.userId);
            return reply.code(200).send(successResponse(null, 'Inventory item deleted successfully'));
        } catch (error) {
            return InventoryController.handleError(error, reply);
        }
    }

    static async getHistory(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const history = await InventoryService.getHistory(id);
            return reply.code(200).send(successResponse(history, 'Inventory history retrieved successfully'));
        } catch (error) {
            return InventoryController.handleError(error, reply);
        }
    }

    private static handleError(error: unknown, reply: FastifyReply) {
        if (error instanceof z.ZodError) {
            return reply.code(400).send(errorResponse('Validation failed', error));
        }
        if (error instanceof Error) {
            if (error.message.includes('not found')) return reply.code(404).send(errorResponse(error.message));
            if (error.message.includes('Insufficient quantity')) return reply.code(400).send(errorResponse(error.message));
            return reply.code(400).send(errorResponse(error.message));
        }
        console.error('Inventory Error:', error);
        return reply.code(500).send(errorResponse('Internal server error'));
    }
}
