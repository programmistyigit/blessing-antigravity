import { FastifyInstance } from 'fastify';
import { AssetController } from './asset.controller';
import { Permission } from '../permissions/permission.enum';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';

export async function assetRoutes(fastify: FastifyInstance) {
    // Create asset
    fastify.post('/assets', {
        preHandler: [authMiddleware, requirePermission(Permission.ASSET_MANAGE)],
    }, AssetController.createAsset as any);

    // Update asset status
    fastify.patch('/assets/:id/status', {
        preHandler: [authMiddleware, requirePermission(Permission.ASSET_MANAGE)],
    }, AssetController.updateStatus as any);

    // Get all assets
    fastify.get('/assets', {
        preHandler: [authMiddleware, requirePermission(Permission.SECTION_VIEW)],
    }, AssetController.getAllAssets as any);

    // Get asset by ID
    fastify.get('/assets/:id', {
        preHandler: [authMiddleware, requirePermission(Permission.SECTION_VIEW)],
    }, AssetController.getAsset as any);

    // Get assets by section
    fastify.get('/assets/section/:sectionId', {
        preHandler: [authMiddleware, requirePermission(Permission.SECTION_VIEW)],
    }, AssetController.getAssetsBySection as any);

    // Get asset history
    fastify.get('/assets/:id/history', {
        preHandler: [authMiddleware, requirePermission(Permission.SECTION_VIEW)],
    }, AssetController.getAssetHistory as any);
}
