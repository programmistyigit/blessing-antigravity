import { z } from 'zod';
import { SectionStatus } from './section.model';

export const createSectionSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    expectedEndDate: z.string().datetime().nullable().optional(),
    assignedWorkers: z.array(z.string()).optional(),
});

export const updateSectionSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    status: z.nativeEnum(SectionStatus).optional(),
    chickArrivalDate: z.string().datetime().nullable().optional(),
    expectedEndDate: z.string().datetime().nullable().optional(),
    assignedWorkers: z.array(z.string()).optional(),
    isArchived: z.boolean().optional(),
    location: z.object({
        lat: z.number(),
        lng: z.number(),
        radius: z.number().min(0).default(100),
    }).optional(),
});

export const assignWorkersSchema = z.object({
    workerIds: z.array(z.string()),
});

export const assignPeriodSchema = z.object({
    periodId: z.string(),
});

export const closeSectionSchema = z.object({}); // No body needed, just the action
