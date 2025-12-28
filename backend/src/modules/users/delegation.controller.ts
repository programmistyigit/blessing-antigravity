import { FastifyRequest, FastifyReply } from 'fastify';
import { DelegationService } from './delegation.service';
import { createDelegationSchema } from './delegation.schema';
import { successResponse, errorResponse } from '../../utils/response.util';
import { Permission } from '../permissions/permission.enum';

// Define minimal user type expected on request
interface RequestUser {
    userId: string;
    roleId: string;
    permissions: string[];
}

export class DelegationController {
    /**
     * POST /api/delegations
     * Create a new delegation
     */
    static async createDelegation(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = (request as any).user as RequestUser;
            const result = createDelegationSchema.safeParse(request.body);
            if (!result.success) {
                return reply.code(400).send(errorResponse(result.error.errors[0].message));
            }

            const delegation = await DelegationService.createDelegation({
                fromUserId: user.userId,
                toUserId: result.data.toUserId,
                permissions: result.data.permissions as Permission[],
                sections: result.data.sections,
            });

            return reply.code(201).send(successResponse(delegation, 'Delegation created successfully'));
        } catch (error: any) {
            return reply.code(400).send(errorResponse(error.message));
        }
    }

    /**
     * PATCH /api/delegations/:id/activate
     * Activate a delegation
     */
    static async activateDelegation(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = (request as any).user as RequestUser;
            const { id } = request.params as { id: string };

            const delegation = await DelegationService.activateDelegation(id, user.userId);
            return reply.send(successResponse(delegation, 'Delegation activated'));
        } catch (error: any) {
            return reply.code(400).send(errorResponse(error.message));
        }
    }

    /**
     * PATCH /api/delegations/:id/deactivate
     * Deactivate a delegation
     */
    static async deactivateDelegation(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = (request as any).user as RequestUser;
            const { id } = request.params as { id: string };

            const delegation = await DelegationService.deactivateDelegation(id, user.userId);
            return reply.send(successResponse(delegation, 'Delegation deactivated'));
        } catch (error: any) {
            return reply.code(400).send(errorResponse(error.message));
        }
    }

    /**
     * GET /api/delegations
     * Get all delegations created by current user
     */
    static async getMyDelegations(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = (request as any).user as RequestUser;
            const delegations = await DelegationService.getDelegationsFromUser(user.userId);
            return reply.send(successResponse(delegations));
        } catch (error: any) {
            return reply.code(400).send(errorResponse(error.message));
        }
    }

    /**
     * GET /api/delegations/received
     * Get all active delegations TO current user
     */
    static async getReceivedDelegations(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = (request as any).user as RequestUser;
            const delegations = await DelegationService.getActiveDelegationsToUser(user.userId);
            return reply.send(successResponse(delegations));
        } catch (error: any) {
            return reply.code(400).send(errorResponse(error.message));
        }
    }
}
