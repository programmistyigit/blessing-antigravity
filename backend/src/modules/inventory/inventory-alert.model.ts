import mongoose, { Schema, Document, Types } from 'mongoose';
import { InventoryType } from './inventory.model';

export enum InventoryAlertSeverity {
    INFO = 'INFO',
    WARNING = 'WARNING',
    CRITICAL = 'CRITICAL',
}

export interface IInventoryAlert extends Document {
    inventoryItemId: Types.ObjectId;
    inventoryType: InventoryType;
    sectionId?: Types.ObjectId;
    severity: InventoryAlertSeverity;
    quantity: number;
    threshold: number;
    isResolved: boolean;
    createdAt: Date;
    resolvedAt?: Date;
}

const inventoryAlertSchema = new Schema<IInventoryAlert>(
    {
        inventoryItemId: {
            type: Schema.Types.ObjectId,
            ref: 'InventoryItem',
            required: true,
        },
        inventoryType: {
            type: String,
            enum: Object.values(InventoryType),
            required: true,
        },
        sectionId: {
            type: Schema.Types.ObjectId,
            ref: 'Section',
        },
        severity: {
            type: String,
            enum: Object.values(InventoryAlertSeverity),
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        threshold: {
            type: Number,
            required: true,
        },
        isResolved: {
            type: Boolean,
            default: false,
        },
        resolvedAt: {
            type: Date,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false }, // only createdAt needed
    }
);

// Indexes for fast lookup
inventoryAlertSchema.index({ inventoryItemId: 1, isResolved: 1 });
inventoryAlertSchema.index({ inventoryType: 1, severity: 1, isResolved: 1 });

export const InventoryAlert = mongoose.model<IInventoryAlert>('InventoryAlert', inventoryAlertSchema);
