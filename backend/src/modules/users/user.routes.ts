import { FastifyInstance } from 'fastify';
import { UserController } from './user.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission, requireCanCreateUsers } from '../../middlewares/permission.middleware';
import { Permission } from '../permissions/permission.enum';

export async function userRoutes(fastify: FastifyInstance) {
    // All user routes require authentication
    fastify.addHook('preHandler', authMiddleware);

    // POST /users - Create user
    // Requires SYSTEM_ALL or USER_CREATE permission
    fastify.post(
        '/',
        { preHandler: [requireCanCreateUsers] },
        UserController.createUser
    );

    // PATCH /users/:id - Update user
    // Requires SYSTEM_ALL or USER_UPDATE permission
    fastify.patch(
        '/:id',
        { preHandler: [requirePermission(Permission.USER_UPDATE)] },
        UserController.updateUser
    );

    // GET /users - List all users
    // Requires SYSTEM_ALL or USER_VIEW permission
    fastify.get(
        '/',
        { preHandler: [requirePermission(Permission.USER_VIEW)] },
        UserController.getAllUsers
    );
}
