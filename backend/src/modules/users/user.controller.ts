import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from './user.service';
import { createUserSchema, updateUserSchema, userIdParamSchema } from './user.schema';
import { successResponse, errorResponse } from '../../utils/response.util';

export class UserController {
    /**
     * POST /users
     * Create a new user
     */
    static async createUser(request: FastifyRequest, reply: FastifyReply) {
        try {
            const validatedData = createUserSchema.parse(request.body);

            const user = await UserService.createUser(validatedData);

            return reply.code(201).send(
                successResponse(user, 'User created successfully')
            );

        } catch (error) {
            if (error instanceof Error) {
                if (error.name === 'ZodError') {
                    return reply.code(400).send(errorResponse('Validation failed', error));
                }

                if (error.message.includes('already exists')) {
                    return reply.code(409).send(errorResponse(error.message));
                }

                if (error.message.includes('Invalid role ID')) {
                    return reply.code(400).send(errorResponse(error.message));
                }
            }

            console.error('Create user error:', error);
            return reply.code(500).send(errorResponse('Internal server error'));
        }
    }

    /**
     * PATCH /users/:id
     * Update an existing user
     */
    static async updateUser(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = userIdParamSchema.parse(request.params);
            const validatedData = updateUserSchema.parse(request.body);

            const user = await UserService.updateUser(id, validatedData);

            return reply.code(200).send(
                successResponse(user, 'User updated successfully')
            );

        } catch (error) {
            if (error instanceof Error) {
                if (error.name === 'ZodError') {
                    return reply.code(400).send(errorResponse('Validation failed', error));
                }

                if (error.message.includes('not found')) {
                    return reply.code(404).send(errorResponse(error.message));
                }

                if (error.message.includes('already exists')) {
                    return reply.code(409).send(errorResponse(error.message));
                }

                if (error.message.includes('Invalid role ID')) {
                    return reply.code(400).send(errorResponse(error.message));
                }
            }

            console.error('Update user error:', error);
            return reply.code(500).send(errorResponse('Internal server error'));
        }
    }

    /**
     * GET /users
     * Get all users
     */
    static async getAllUsers(_request: FastifyRequest, reply: FastifyReply) {
        try {
            const users = await UserService.getAllUsers();

            return reply.code(200).send(
                successResponse(users, 'Users retrieved successfully')
            );

        } catch (error) {
            console.error('Get users error:', error);
            return reply.code(500).send(errorResponse('Internal server error'));
        }
    }
}
