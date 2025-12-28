import { z } from 'zod';

/**
 * Period Zod Schemas
 */

export const createPeriodSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    startDate: z.string().or(z.date()),
    sections: z.array(z.string()).optional().default([]),
    notes: z.string().optional(),
});

export const updatePeriodSchema = z.object({
    name: z.string().min(1).optional(),
    sections: z.array(z.string()).optional(),
    notes: z.string().optional(),
});

export type CreatePeriodInput = z.infer<typeof createPeriodSchema>;
export type UpdatePeriodInput = z.infer<typeof updatePeriodSchema>;
