import { z } from 'zod';
import { MedicationEffectiveness } from './health.model';

export const createDiseaseSchema = z.object({
    dateDetected: z.string().datetime(),
    diseaseName: z.string().min(1),
    affectedChicks: z.number().min(0),
    mortality: z.number().min(0),
    notes: z.string().optional().default(''),
});

export const updateDiseaseSchema = z.object({
    dateDetected: z.string().datetime().optional(),
    diseaseName: z.string().optional(),
    affectedChicks: z.number().min(0).optional(),
    mortality: z.number().min(0).optional(),
    notes: z.string().optional(),
});

export const createMedicationSchema = z.object({
    dateGiven: z.string().datetime(),
    medicationName: z.string().min(1),
    dose: z.string().min(1),
    givenToChicks: z.number().min(0),
    effectiveness: z.nativeEnum(MedicationEffectiveness).optional().default(MedicationEffectiveness.UNKNOWN),
    notes: z.string().optional().default(''),
});

export const updateMedicationSchema = z.object({
    dateGiven: z.string().datetime().optional(),
    medicationName: z.string().optional(),
    dose: z.string().optional(),
    givenToChicks: z.number().min(0).optional(),
    effectiveness: z.nativeEnum(MedicationEffectiveness).optional(),
    notes: z.string().optional(),
});
