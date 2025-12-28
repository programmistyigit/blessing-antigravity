import { z } from 'zod';
import { getAllPermissions } from '../permissions/permission.enum';

const permissionValues = getAllPermissions();

/**
 * Create Delegation Schema
 */
export const createDelegationSchema = z.object({
    toUserId: z.string().min(1, 'Target user ID is required'),
    permissions: z.array(z.enum(permissionValues as [string, ...string[]])).min(1, 'At least one permission is required'),
    sections: z.array(z.string()).optional(),
});

export type CreateDelegationInput = z.infer<typeof createDelegationSchema>;
