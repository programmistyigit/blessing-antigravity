import { z } from 'zod';

const medicineSchema = z.object({
    name: z.string().min(1),
    dose: z.string().min(1),
});

/**
 * Create Report Schema
 * Faqat jo'ja holati uchun - o'lim, vazn, dori
 */
export const createReportSchema = z.object({
    date: z.string().datetime(),
    deaths: z.number().min(0),
    avgWeight: z.number().min(0),
    medicines: z.array(medicineSchema).optional().default([]),
    note: z.string().optional().default(''),
});

/**
 * Update Report Schema
 */
export const updateReportSchema = z.object({
    deaths: z.number().min(0).optional(),
    avgWeight: z.number().min(0).optional(),
    medicines: z.array(medicineSchema).optional(),
    note: z.string().optional(),
});
