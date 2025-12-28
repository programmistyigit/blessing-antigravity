import { FastifyInstance } from 'fastify';
import { RoleController } from './role.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission, requireCanCreateRoles } from '../../middlewares/permission.middleware';
import { Permission } from '../permissions/permission.enum';

export async function roleRoutes(fastify: FastifyInstance) {
    // All role routes require authentication
    fastify.addHook('preHandler', authMiddleware);

    // POST /roles - Create role
    // Requires SYSTEM_ALL or ROLE_CREATE permission
    fastify.post(
        '/',
        { preHandler: [requireCanCreateRoles] },
        RoleController.createRole
    );

    // PATCH /roles/:id - Update role
    // Requires SYSTEM_ALL or ROLE_UPDATE permission
    fastify.patch(
        '/:id',
        { preHandler: [requirePermission(Permission.ROLE_UPDATE)] },
        RoleController.updateRole
    );

    // GET /roles - List all roles
    // Requires SYSTEM_ALL or ROLE_VIEW permission
    fastify.get(
        '/',
        { preHandler: [requirePermission(Permission.ROLE_VIEW)] },
        RoleController.getAllRoles
    );
}
