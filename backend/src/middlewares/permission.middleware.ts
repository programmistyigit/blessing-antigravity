import { FastifyRequest, FastifyReply } from 'fastify';
import { Permission } from '../modules/permissions/permission.enum';
import { DelegationService } from '../modules/users/delegation.service';
import { errorResponse } from '../utils/response.util';

/**
 * Permission middleware factory
 * Creates a middleware that checks if user has the required permission
 * 
 * Permission check order:
 * 1. SYSTEM_ALL permission bypasses all checks
 * 2. Check user's own role permissions
 * 3. Check active delegations
 */
export function requirePermission(requiredPermission: Permission) {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
        // Ensure user is authenticated
        if (!request.user) {
            return reply.code(401).send(errorResponse('Authentication required'));
        }

        const { permissions, userId } = request.user as any;

        // SYSTEM_ALL grants access to everything
        if (permissions.includes(Permission.SYSTEM_ALL)) {
            return; // Allow access
        }

        // Check for specific permission in user's role
        if (permissions.includes(requiredPermission)) {
            return; // Permission granted via role
        }

        // Check for delegated permissions
        try {
            const delegatedPermissions = await DelegationService.getDelegatedPermissions(userId);
            if (delegatedPermissions.includes(requiredPermission)) {
                return; // Permission granted via delegation
            }
        } catch (error) {
            // Delegation check failed, continue with denial
            console.error('Delegation check error:', error);
        }

        // No permission found
        return reply.code(403).send(
            errorResponse(`Permission denied. Required: ${requiredPermission}`)
        );
    };
}

/**
 * Check if user can create users
 * Requires either SYSTEM_ALL or role.canCreateUsers = true
 */
export async function requireCanCreateUsers(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    if (!request.user) {
        return reply.code(401).send(errorResponse('Authentication required'));
    }

    const { permissions } = request.user;

    // SYSTEM_ALL grants access
    if (permissions.includes(Permission.SYSTEM_ALL)) {
        return;
    }

    // Check USER_CREATE permission
    if (!permissions.includes(Permission.USER_CREATE)) {
        return reply.code(403).send(errorResponse('Permission denied. Cannot create users.'));
    }
}

/**
 * Check if user can create roles
 * Requires either SYSTEM_ALL or role.canCreateRoles = true
 */
export async function requireCanCreateRoles(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    if (!request.user) {
        return reply.code(401).send(errorResponse('Authentication required'));
    }

    const { permissions } = request.user;

    // SYSTEM_ALL grants access
    if (permissions.includes(Permission.SYSTEM_ALL)) {
        return;
    }

    // Check ROLE_CREATE permission
    if (!permissions.includes(Permission.ROLE_CREATE)) {
        return reply.code(403).send(errorResponse('Permission denied. Cannot create roles.'));
    }
}
