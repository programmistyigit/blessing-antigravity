import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { loginSchema } from './auth.schema';
import { successResponse, errorResponse } from '../../utils/response.util';

export class AuthController {
    /**
     * POST /auth/login
     * Authenticate user and return JWT token
     */
    static async login(request: FastifyRequest, reply: FastifyReply) {
        try {
            // Validate request body
            const validatedData = loginSchema.parse(request.body);

            // Authenticate user
            const authResponse = await AuthService.login(validatedData);

            return reply.code(200).send(successResponse(authResponse, 'Login successful'));

        } catch (error) {
            if (error instanceof Error) {
                // Handle validation errors
                if (error.name === 'ZodError') {
                    return reply.code(400).send(errorResponse('Validation failed', error));
                }

                // Handle authentication errors
                if (error.message.includes('Invalid credentials') ||
                    error.message.includes('deactivated') ||
                    error.message.includes('not found')) {
                    return reply.code(401).send(errorResponse(error.message));
                }
            }

            // Generic server error
            console.error('Login error:', error);
            return reply.code(500).send(errorResponse('Internal server error'));
        }
    }
}
