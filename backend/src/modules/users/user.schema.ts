import { z } from 'zod';

/**
 * Create user schema
 */
export const createUserSchema = z.object({
    fullName: z.string().min(2).max(100),
    username: z.string().min(3).max(50),
    password: z.string().min(6),
    roleId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid role ID format'),
    isActive: z.boolean().default(true),
});

export type CreateUserRequest = z.infer<typeof createUserSchema>;

/**
 * Update user schema
 */
export const updateUserSchema = z.object({
    fullName: z.string().min(2).max(100).optional(),
    username: z.string().min(3).max(50).optional(),
    password: z.string().min(6).optional(),
    roleId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid role ID format').optional(),
    isActive: z.boolean().optional(),
});

export type UpdateUserRequest = z.infer<typeof updateUserSchema>;

/**
 * User ID param schema
 */
export const userIdParamSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
});

export type UserIdParam = z.infer<typeof userIdParamSchema>;
