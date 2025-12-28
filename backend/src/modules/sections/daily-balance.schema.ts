import { z } from 'zod';

/**
 * DailyBalance Zod Schemas
 * Validation for daily balance operations
 */

export const getDailyBalanceSchema = z.object({
    batchId: z.string().min(1, 'Batch ID is required'),
    date: z.string().optional(), // ISO date string, defaults to today
});

export const updateDailyBalanceSchema = z.object({
    deaths: z.number().min(0).optional(),
    chickOut: z.number().min(0).optional(),
});

export type GetDailyBalanceInput = z.infer<typeof getDailyBalanceSchema>;
export type UpdateDailyBalanceInput = z.infer<typeof updateDailyBalanceSchema>;
