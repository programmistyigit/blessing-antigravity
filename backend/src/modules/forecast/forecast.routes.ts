import { FastifyInstance } from 'fastify';
import { ForecastController } from './forecast.controller';
import { Permission } from '../permissions/permission.enum';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';

export async function forecastRoutes(fastify: FastifyInstance) {
    // Set forecast price (Director only - SYSTEM_ALL)
    fastify.post('/forecast/price', {
        preHandler: [authMiddleware, requirePermission(Permission.SYSTEM_ALL)],
    }, ForecastController.setPrice as any);

    // Get section forecast
    fastify.get('/forecast/sections/:id', {
        preHandler: [authMiddleware, requirePermission(Permission.SECTION_VIEW)],
    }, ForecastController.getSectionForecast as any);

    // Get period forecast
    fastify.get('/forecast/periods/:id', {
        preHandler: [authMiddleware, requirePermission(Permission.PERIOD_VIEW)],
    }, ForecastController.getPeriodForecast as any);

    // Simulate partial sale
    fastify.post('/forecast/simulate', {
        preHandler: [authMiddleware, requirePermission(Permission.SECTION_VIEW)],
    }, ForecastController.simulate as any);
}
