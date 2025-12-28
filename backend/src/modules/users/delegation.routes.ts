import { FastifyInstance } from 'fastify';
import { DelegationController } from './delegation.controller';
import { Permission } from '../permissions/permission.enum';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';

export async function delegationRoutes(fastify: FastifyInstance) {
    // Create new delegation
    fastify.post('/delegations', {
        preHandler: [authMiddleware, requirePermission(Permission.DELEGATE_PERMISSIONS)],
    }, DelegationController.createDelegation as any);

    // Activate delegation
    fastify.patch('/delegations/:id/activate', {
        preHandler: [authMiddleware, requirePermission(Permission.DELEGATE_PERMISSIONS)],
    }, DelegationController.activateDelegation as any);

    // Deactivate delegation
    fastify.patch('/delegations/:id/deactivate', {
        preHandler: [authMiddleware, requirePermission(Permission.DELEGATE_PERMISSIONS)],
    }, DelegationController.deactivateDelegation as any);

    // Get my delegations (created by me)
    fastify.get('/delegations', {
        preHandler: [authMiddleware],
    }, DelegationController.getMyDelegations as any);

    // Get delegations received by me
    fastify.get('/delegations/received', {
        preHandler: [authMiddleware],
    }, DelegationController.getReceivedDelegations as any);
}
