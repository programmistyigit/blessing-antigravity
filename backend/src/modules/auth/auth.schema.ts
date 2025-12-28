import { z } from 'zod';
import { Permission } from '../permissions/permission.enum';

/**
 * Login request schema
 */
export const loginSchema = z.object({
    username: z.string().min(3).max(50),
    password: z.string().min(6),
});

export type LoginRequest = z.infer<typeof loginSchema>;

/**
 * Login response schema
 */
export const loginResponseSchema = z.object({
    token: z.string(),
    user: z.object({
        id: z.string(),
        username: z.string(),
        fullName: z.string(),
        role: z.object({
            id: z.string(),
            name: z.string(),
            permissions: z.array(z.nativeEnum(Permission)),
        }),
    }),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
