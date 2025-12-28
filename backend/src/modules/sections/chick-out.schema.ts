import { z } from 'zod';

/**
 * Create ChickOut Schema
 */
export const createChickOutSchema = z.object({
    date: z.string().datetime().optional(),
    count: z.number().int().min(1, 'At least 1 chick required'),
    vehicleNumber: z.string().min(1, 'Vehicle number is required'),
    machineNumber: z.string().min(1, 'Machine number is required'),
    isFinal: z.boolean().default(false),
});

export type CreateChickOutInput = z.infer<typeof createChickOutSchema>;
