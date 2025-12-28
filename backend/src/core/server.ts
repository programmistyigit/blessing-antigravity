import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import config from './config';

/**
 * Create and configure Fastify server
 */
export async function createServer(): Promise<FastifyInstance> {
    const fastify = Fastify({
        logger: {
            level: config.env === 'production' ? 'info' : 'debug',
            transport: config.env === 'development'
                ? {
                    target: 'pino-pretty',
                    options: {
                        translateTime: 'HH:MM:ss Z',
                        ignore: 'pid,hostname',
                    },
                }
                : undefined,
        },
    });

    // Register CORS
    await fastify.register(cors, {
        origin: true, // Allow all origins in development
        credentials: true,
    });

    // Register WebSocket support
    await fastify.register(websocket);

    // Global error handler
    fastify.setErrorHandler((error, _request, reply) => {
        fastify.log.error(error);

        // Don't expose internal error details in production
        const errorMessage = config.env === 'production'
            ? 'Internal server error'
            : error.message;

        reply.status(error.statusCode || 500).send({
            success: false,
            error: errorMessage,
        });
    });

    return fastify;
}
