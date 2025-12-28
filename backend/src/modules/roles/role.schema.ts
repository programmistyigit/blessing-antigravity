import { z } from 'zod';
import { Permission } from '../permissions/permission.enum';

/**
 * Create role schema
 */
export const createRoleSchema = z.object({
    name: z.string().min(2).max(50),
    permissions: z.array(z.nativeEnum(Permission)),
    canCreateUsers: z.boolean().default(false),
    canCreateRoles: z.boolean().default(false),
});

export type CreateRoleRequest = z.infer<typeof createRoleSchema>;

/**
 * Update role schema
 */
export const updateRoleSchema = z.object({
    name: z.string().min(2).max(50).optional(),
    permissions: z.array(z.nativeEnum(Permission)).optional(),
    canCreateUsers: z.boolean().optional(),
    canCreateRoles: z.boolean().optional(),
});

export type UpdateRoleRequest = z.infer<typeof updateRoleSchema>;

/**
 * Role ID param schema
 */
export const roleIdParamSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid role ID format'),
});

export type RoleIdParam = z.infer<typeof roleIdParamSchema>;
