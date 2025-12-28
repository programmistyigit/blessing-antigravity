import { FastifyRequest, FastifyReply } from 'fastify';
import { RoleService } from './role.service';
import { createRoleSchema, updateRoleSchema, roleIdParamSchema } from './role.schema';
import { successResponse, errorResponse } from '../../utils/response.util';

export class RoleController {
    /**
     * POST /roles
     * Create a new role
     */
    static async createRole(request: FastifyRequest, reply: FastifyReply) {
        try {
            const validatedData = createRoleSchema.parse(request.body);

            const role = await RoleService.createRole(validatedData);

            return reply.code(201).send(
                successResponse(role, 'Role created successfully')
            );

        } catch (error) {
            if (error instanceof Error) {
                if (error.name === 'ZodError') {
                    return reply.code(400).send(errorResponse('Validation failed', error));
                }

                if (error.message.includes('already exists')) {
                    return reply.code(409).send(errorResponse(error.message));
                }
            }

            console.error('Create role error:', error);
            return reply.code(500).send(errorResponse('Internal server error'));
        }
    }

    /**
     * PATCH /roles/:id
     * Update an existing role
     */
    static async updateRole(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = roleIdParamSchema.parse(request.params);
            const validatedData = updateRoleSchema.parse(request.body);

            const role = await RoleService.updateRole(id, validatedData);

            return reply.code(200).send(
                successResponse(role, 'Role updated successfully')
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
            }

            console.error('Update role error:', error);
            return reply.code(500).send(errorResponse('Internal server error'));
        }
    }

    /**
     * GET /roles
     * Get all roles
     */
    static async getAllRoles(_request: FastifyRequest, reply: FastifyReply) {
        try {
            const roles = await RoleService.getAllRoles();

            return reply.code(200).send(
                successResponse(roles, 'Roles retrieved successfully')
            );

        } catch (error) {
            console.error('Get roles error:', error);
            return reply.code(500).send(errorResponse('Internal server error'));
        }
    }
}
