import { z } from 'zod';

/**
 * Create Batch Schema
 */
export const createBatchSchema = z.object({
    sectionId: z.string().min(1, 'Section ID is required'),
    startedAt: z.string().datetime().optional(),
    expectedEndAt: z.string().datetime(),
    totalChicksIn: z.number().int().min(1, 'At least 1 chick required'),
});

export type CreateBatchInput = z.infer<typeof createBatchSchema>;

/**
 * Close Batch Schema
 */
export const closeBatchSchema = z.object({
    endedAt: z.string().datetime().optional(),
});

export type CloseBatchInput = z.infer<typeof closeBatchSchema>;
