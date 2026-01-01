import { z } from 'zod';

const medicineSchema = z.object({
    name: z.string().min(1),
    dose: z.string().min(1),
});

export const createReportSchema = z.object({
    date: z.string().datetime(),
    avgWeight: z.number().min(0),
    totalWeight: z.number().min(0),
    deaths: z.number().min(0),
    feedUsedKg: z.number().min(0),
    waterUsedLiters: z.number().min(0),
    electricityUsedKwh: z.number().min(0),
    gasM3: z.number().min(0).optional().nullable(),
    medicines: z.array(medicineSchema).optional().default([]),
    note: z.string().optional().default(''),
});

export const updateReportSchema = z.object({
    avgWeight: z.number().min(0).optional(),
    totalWeight: z.number().min(0).optional(),
    deaths: z.number().min(0).optional(),
    feedUsedKg: z.number().min(0).optional(),
    waterUsedLiters: z.number().min(0).optional(),
    electricityUsedKwh: z.number().min(0).optional(),
    gasM3: z.number().min(0).optional().nullable(),
    medicines: z.array(medicineSchema).optional(),
    note: z.string().optional(),
});
