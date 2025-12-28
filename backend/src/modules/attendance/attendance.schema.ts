import { z } from 'zod';
import { AttendanceStatus } from './attendance.model';

export const createAttendanceSchema = z.object({
    checkInTime: z.string().datetime(),
    location: z.object({
        lat: z.number(),
        lng: z.number(),
    }),
    plannedStartTime: z.string().datetime().optional(), // Optional, otherwise defaults to 8:00 AM logic
    isFake: z.boolean().optional().default(false),
});

export const updateAttendanceSchema = z.object({
    checkOutTime: z.string().datetime().optional(),
    status: z.nativeEnum(AttendanceStatus).optional(),
    notes: z.string().optional(),
});

export const gpsUpdateSchema = z.object({
    location: z.object({
        lat: z.number(),
        lng: z.number(),
    }),
    isOutsideAllowedArea: z.boolean(),
    timestamp: z.string().datetime().optional(),
});
