import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService, TokenPayload } from '../modules/auth/auth.service';
import { errorResponse } from '../utils/response.util';

// Extend Fastify request type to include user data
declare module 'fastify' {
    interface FastifyRequest {
        user?: TokenPayload;
    }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user data to request
 */
export async function authMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    try {
        // Extract token from Authorization header
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.code(401).send(errorResponse('No token provided'));
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const payload = AuthService.verifyToken(token);

        // Attach user data to request
        request.user = payload;

    } catch (error) {
        return reply.code(401).send(errorResponse('Invalid or expired token'));
    }
}
