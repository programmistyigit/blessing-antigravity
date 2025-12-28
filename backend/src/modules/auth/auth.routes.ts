import { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller';

export async function authRoutes(fastify: FastifyInstance) {
    // POST /auth/login
    fastify.post('/login', AuthController.login);
}
