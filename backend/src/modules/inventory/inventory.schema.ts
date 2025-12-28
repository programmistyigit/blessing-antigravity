import { z } from 'zod';
import { InventoryCategory, InventoryChangeType } from './inventory.model';

export const createInventoryItemSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    category: z.nativeEnum(InventoryCategory),
    quantity: z.number().min(0).default(0),
    unit: z.string().min(1),
    minThreshold: z.number().min(0).default(0),
    maxThreshold: z.number().min(0).optional(),
});

export const updateInventoryItemSchema = z.object({
    quantityChange: z.number(), // Can be negative for remove/consume
    changeType: z.nativeEnum(InventoryChangeType),
    reason: z.string().optional(),

    // Optional updates to item properties
    name: z.string().optional(),
    category: z.nativeEnum(InventoryCategory).optional(),
    unit: z.string().optional(),
    minThreshold: z.number().min(0).optional(),
    maxThreshold: z.number().min(0).optional(),
});
