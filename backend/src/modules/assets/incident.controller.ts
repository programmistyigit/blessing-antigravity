import { FastifyRequest, FastifyReply } from 'fastify';
import { IncidentService } from './incident.service';

interface RequestUser {
    userId: string;
    roleId: string;
    permissions: string[];
}

/**
 * Technical Incident Controller
 * API endpointlari
 */
export class IncidentController {
    /**
     * POST /api/incidents
     * Create new incident
     */
    static async createIncident(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = (request as any).user as RequestUser;
            const body = request.body as any;

            // Validate required fields
            if (!body.assetId || typeof body.assetId !== 'string') {
                return reply.code(400).send({ success: false, error: 'assetId is required' });
            }
            if (!body.description || typeof body.description !== 'string') {
                return reply.code(400).send({ success: false, error: 'description is required' });
            }
            if (body.description.trim().length < 5) {
                return reply.code(400).send({ success: false, error: 'description must be at least 5 characters' });
            }
            if (body.requiresExpense !== undefined && typeof body.requiresExpense !== 'boolean') {
                return reply.code(400).send({ success: false, error: 'requiresExpense must be a boolean' });
            }

            const incident = await IncidentService.createIncident({
                assetId: body.assetId,
                description: body.description,
                requiresExpense: body.requiresExpense ?? false,
                reportedBy: user.userId,
                linkedPeriodId: body.linkedPeriodId,
            });

            return reply.code(201).send({ success: true, data: incident });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    }

    /**
     * GET /api/incidents
     * Get all incidents with optional filter
     */
    static async getAllIncidents(request: FastifyRequest, reply: FastifyReply) {
        try {
            const query = request.query as any;

            // Parse resolved filter
            let resolved: boolean | undefined;
            if (query.resolved === 'true') resolved = true;
            if (query.resolved === 'false') resolved = false;

            const incidents = await IncidentService.getAllIncidents({ resolved });
            return reply.send({ success: true, data: incidents });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    }

    /**
     * GET /api/incidents/:id
     * Get incident by ID
     */
    static async getIncident(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const incident = await IncidentService.getIncidentById(id);

            if (!incident) {
                return reply.code(404).send({ success: false, error: 'Incident not found' });
            }

            return reply.send({ success: true, data: incident });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    }

    /**
     * GET /api/assets/:id/incidents
     * Get incidents by asset
     */
    static async getIncidentsByAsset(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const query = request.query as any;

            // Parse resolved filter
            let resolved: boolean | undefined;
            if (query.resolved === 'true') resolved = true;
            if (query.resolved === 'false') resolved = false;

            const incidents = await IncidentService.getIncidentsByAsset(id, { resolved });
            return reply.send({ success: true, data: incidents });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    }

    /**
     * GET /api/sections/:id/incidents
     * Get incidents by section
     */
    static async getIncidentsBySection(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const query = request.query as any;

            // Parse resolved filter
            let resolved: boolean | undefined;
            if (query.resolved === 'true') resolved = true;
            if (query.resolved === 'false') resolved = false;

            const incidents = await IncidentService.getIncidentsBySection(id, { resolved });
            return reply.send({ success: true, data: incidents });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    }

    /**
     * PATCH /api/incidents/:id/resolve
     * Update incident resolved status
     */
    static async resolveIncident(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const body = request.body as any;

            // Validate resolved field
            if (body.resolved === undefined || typeof body.resolved !== 'boolean') {
                return reply.code(400).send({ success: false, error: 'resolved must be a boolean' });
            }

            const incident = await IncidentService.resolveIncident(id, body.resolved);
            return reply.send({ success: true, data: incident });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    }
}
