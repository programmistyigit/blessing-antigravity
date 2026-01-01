import { FastifyInstance } from 'fastify';
import { CompanyController } from './company.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { Permission } from '../permissions/permission.enum';

export async function companyRoutes(fastify: FastifyInstance) {
    // GET /company/location - Get attendance location
    fastify.get('/company/location', {
        preHandler: [authMiddleware],
    }, CompanyController.getLocation);

    // PATCH /company/location - Update attendance location (Director only)
    fastify.patch('/company/location', {
        preHandler: [authMiddleware, requirePermission(Permission.SECTION_UPDATE)],
    }, CompanyController.updateLocation);
}
