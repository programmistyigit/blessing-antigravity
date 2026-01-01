import { connectDatabase, disconnectDatabase } from './core/database';
import { createServer } from './core/server';
import { initializeDatabase } from './utils/init.util';
import { authRoutes } from './modules/auth/auth.routes';
import { roleRoutes } from './modules/roles/role.routes';
import { userRoutes } from './modules/users/user.routes';
import { delegationRoutes } from './modules/users/delegation.routes';
import { sectionRoutes } from './modules/sections/section.routes';
import { batchRoutes } from './modules/sections/batch.routes';
import { inventoryRoutes } from './modules/inventory/inventory.routes';
import { healthRoutes } from './modules/health/health.routes';
import { attendanceRoutes } from './modules/attendance/attendance.routes';
import { reportRoutes } from './modules/reports/report.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { periodRoutes } from './modules/periods/period.routes';
import { assetRoutes } from './modules/assets/asset.routes';
import { incidentRoutes } from './modules/assets/incident.routes';
import { forecastRoutes } from './modules/forecast/forecast.routes';
import { salaryRoutes } from './modules/salary/salary.routes';
import { feedRoutes } from './modules/feed/feed.routes';
import { utilityRoutes } from './modules/utility/utility.routes';
import { priceRoutes } from './modules/prices/price-history.routes';
import { companyRoutes } from './modules/company/company.routes';
import { setupWebSocket } from './realtime/websocket.routes';
import { languageHook } from './middlewares/language.middleware';
import config from './core/config';

/**
 * Main application entry point
 */
async function startApplication() {
    try {
        console.log('');
        console.log('═══════════════════════════════════════════════');
        console.log('  POULTRY FACTORY AUTOMATION SYSTEM');
        console.log('  Backend Server');
        console.log('═══════════════════════════════════════════════');
        console.log('');

        // Connect to MongoDB
        await connectDatabase();

        // Initialize database with default data
        await initializeDatabase();

        // Create Fastify server
        const fastify = await createServer();

        // Register language hook for i18n
        fastify.addHook('onRequest', languageHook);

        // Register HTTP routes
        await fastify.register(authRoutes, { prefix: '/api/auth' });
        await fastify.register(roleRoutes, { prefix: '/api/roles' });
        await fastify.register(userRoutes, { prefix: '/api/users' });
        await fastify.register(delegationRoutes, { prefix: '/api' });
        await fastify.register(sectionRoutes, { prefix: '/api' });
        await fastify.register(batchRoutes, { prefix: '/api' });
        await fastify.register(inventoryRoutes, { prefix: '/api' });
        await fastify.register(healthRoutes, { prefix: '/api' });
        await fastify.register(attendanceRoutes, { prefix: '/api' });
        await fastify.register(reportRoutes, { prefix: '/api' });
        await fastify.register(dashboardRoutes, { prefix: '/api' });
        await fastify.register(periodRoutes, { prefix: '/api' });
        await fastify.register(assetRoutes, { prefix: '/api' });
        await fastify.register(incidentRoutes, { prefix: '/api' });
        await fastify.register(forecastRoutes, { prefix: '/api' });
        await fastify.register(salaryRoutes, { prefix: '/api' });
        await fastify.register(feedRoutes, { prefix: '/api' });
        await fastify.register(utilityRoutes, { prefix: '/api' });
        await fastify.register(priceRoutes, { prefix: '/api' });
        await fastify.register(companyRoutes, { prefix: '/api' });

        // Setup WebSocket
        await setupWebSocket(fastify);

        // Health check endpoint
        fastify.get('/health', async (_request, _reply) => {
            return {
                status: 'ok',
                timestamp: new Date().toISOString(),
                environment: config.env,
            };
        });

        // Start server
        await fastify.listen({
            port: config.port,
            host: '0.0.0.0'
        });

        console.log('');
        console.log('═══════════════════════════════════════════════');
        console.log(`  ✅ Server running on port ${config.port}`);
        console.log(`  📡 WebSocket endpoint: ws://localhost:${config.port}/ws`);
        console.log(`  🏥 Health check: http://localhost:${config.port}/health`);
        console.log('═══════════════════════════════════════════════');
        console.log('');

        // Graceful shutdown
        const signals = ['SIGINT', 'SIGTERM'];

        signals.forEach((signal) => {
            process.on(signal, async () => {
                console.log('');
                console.log(`📴 ${signal} received. Shutting down gracefully...`);

                try {
                    await fastify.close();
                    await disconnectDatabase();
                    console.log('👋 Server closed successfully');
                    process.exit(0);
                } catch (error) {
                    console.error('❌ Error during shutdown:', error);
                    process.exit(1);
                }
            });
        });

    } catch (error) {
        console.error('❌ Failed to start application:', error);
        process.exit(1);
    }
}

// Start the application
startApplication();
