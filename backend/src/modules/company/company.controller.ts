import { FastifyRequest, FastifyReply } from 'fastify';
import { CompanyService } from './company.service';
import { successResponse, errorResponse } from '../../utils/response.util';
import { z } from 'zod';

const updateLocationSchema = z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    radius: z.number().min(10).max(500).optional(),
});

export class CompanyController {

    /**
     * GET /company/location
     * Get company attendance location
     */
    static async getLocation(_request: FastifyRequest, reply: FastifyReply) {
        try {
            const location = await CompanyService.getLocation();
            return reply.code(200).send(
                successResponse(location, 'Company location retrieved')
            );
        } catch (error) {
            console.error('Get company location error:', error);
            return reply.code(500).send(errorResponse('Internal server error'));
        }
    }

    /**
     * PATCH /company/location
     * Update company attendance location
     */
    static async updateLocation(request: FastifyRequest, reply: FastifyReply) {
        try {
            const validated = updateLocationSchema.parse(request.body);
            const settings = await CompanyService.updateLocation(validated);

            return reply.code(200).send(
                successResponse(settings.location, 'Company location updated')
            );
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send(errorResponse('Validation failed', error));
            }
            console.error('Update company location error:', error);
            return reply.code(500).send(errorResponse('Internal server error'));
        }
    }
}
