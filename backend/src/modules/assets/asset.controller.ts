import { FastifyRequest, FastifyReply } from 'fastify';
import { AssetService } from './asset.service';
import { AssetCategory, AssetStatus } from './asset.model';

interface RequestUser {
    userId: string;
    roleId: string;
    permissions: string[];
}

/**
 * Asset Controller
 */
export class AssetController {
    /**
     * POST /api/assets
     * Create new asset
     */
    static async createAsset(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = (request as any).user as RequestUser;
            const body = request.body as any;

            // Validate required fields
            if (!body.name || typeof body.name !== 'string') {
                return reply.code(400).send({ success: false, error: 'name is required' });
            }
            if (!body.category || !Object.values(AssetCategory).includes(body.category)) {
                return reply.code(400).send({ success: false, error: 'Invalid category' });
            }

            // Validate location if provided
            if (body.location) {
                if (typeof body.location !== 'object') {
                    return reply.code(400).send({ success: false, error: 'location must be an object with lat and lng' });
                }
                if (typeof body.location.lat !== 'number' || body.location.lat < -90 || body.location.lat > 90) {
                    return reply.code(400).send({ success: false, error: 'location.lat must be a number between -90 and 90' });
                }
                if (typeof body.location.lng !== 'number' || body.location.lng < -180 || body.location.lng > 180) {
                    return reply.code(400).send({ success: false, error: 'location.lng must be a number between -180 and 180' });
                }
            }

            // Validate isNewPurchase
            if (body.isNewPurchase !== undefined && typeof body.isNewPurchase !== 'boolean') {
                return reply.code(400).send({ success: false, error: 'isNewPurchase must be a boolean' });
            }

            // Validate purchaseCost
            if (body.purchaseCost !== undefined) {
                if (typeof body.purchaseCost !== 'number' || body.purchaseCost <= 0) {
                    return reply.code(400).send({ success: false, error: 'purchaseCost must be a positive number' });
                }
            }

            const asset = await AssetService.createAsset({
                name: body.name,
                category: body.category,
                sectionId: body.sectionId || undefined,
                location: body.location || undefined,
                isNewPurchase: body.isNewPurchase,
                purchaseCost: body.purchaseCost,
                periodId: body.periodId,
                createdBy: user.userId,
            });

            return reply.code(201).send({ success: true, data: asset });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    }

    /**
     * PATCH /api/assets/:id/status
     * Update asset status
     */
    static async updateStatus(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = (request as any).user as RequestUser;
            const { id } = request.params as { id: string };
            const body = request.body as any;

            // Validate status
            if (!body.status || !Object.values(AssetStatus).includes(body.status)) {
                return reply.code(400).send({ success: false, error: 'Invalid status' });
            }

            const asset = await AssetService.updateStatus(id, body.status, user.userId);

            return reply.send({ success: true, data: asset });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    }

    /**
     * GET /api/assets
     * Get all assets
     */
    static async getAllAssets(_request: FastifyRequest, reply: FastifyReply) {
        try {
            const assets = await AssetService.getAllAssets();
            return reply.send({ success: true, data: assets });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    }

    /**
     * GET /api/assets/:id
     * Get asset by ID
     */
    static async getAsset(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const asset = await AssetService.getAssetById(id);

            if (!asset) {
                return reply.code(404).send({ success: false, error: 'Asset not found' });
            }

            return reply.send({ success: true, data: asset });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    }

    /**
     * GET /api/assets/section/:sectionId
     * Get assets by section
     */
    static async getAssetsBySection(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { sectionId } = request.params as { sectionId: string };
            const assets = await AssetService.getAssetsBySection(sectionId);
            return reply.send({ success: true, data: assets });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    }

    /**
     * GET /api/assets/:id/history
     * Get asset status history
     */
    static async getAssetHistory(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const history = await AssetService.getAssetHistory(id);
            return reply.send({ success: true, data: history });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    }
}
