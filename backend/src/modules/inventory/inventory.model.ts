import mongoose, { Schema, Document, Types } from 'mongoose';

export enum InventoryCategory {
    FEED = 'FEED',
    WATER = 'WATER',
    ELECTRICITY = 'ELECTRICITY',
    MEDICINE = 'MEDICINE',
    OTHER = 'OTHER',
}

export interface IInventoryItem extends Document {
    name: string;
    category: InventoryCategory;
    quantity: number;
    unit: string;
    minThreshold: number;
    maxThreshold?: number;
    lastUpdatedBy: Types.ObjectId;
    lastUpdatedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}

const inventoryItemSchema = new Schema<IInventoryItem>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            enum: Object.values(InventoryCategory),
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        unit: {
            type: String,
            required: true,
        },
        minThreshold: {
            type: Number,
            default: 0,
            min: 0,
        },
        maxThreshold: {
            type: Number,
        },
        lastUpdatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        lastUpdatedAt: {
            type: Date,
            default: Date.now,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

inventoryItemSchema.index({ category: 1 });
inventoryItemSchema.index({ isActive: 1 });

export const InventoryItem = mongoose.model<IInventoryItem>('InventoryItem', inventoryItemSchema);

// --- HISTORY MODEL ---

export enum InventoryChangeType {
    ADD = 'ADD',
    REMOVE = 'REMOVE',
    CONSUME = 'CONSUME',
    ADJUST = 'ADJUST',
}

export interface IInventoryHistory extends Document {
    itemId: Types.ObjectId;
    changeType: InventoryChangeType;
    quantityChanged: number;
    previousQuantity: number;
    newQuantity: number;
    reason?: string;
    createdBy: Types.ObjectId;
    createdAt: Date;
}

const inventoryHistorySchema = new Schema<IInventoryHistory>(
    {
        itemId: {
            type: Schema.Types.ObjectId,
            ref: 'InventoryItem',
            required: true,
        },
        changeType: {
            type: String,
            enum: Object.values(InventoryChangeType),
            required: true,
        },
        quantityChanged: {
            type: Number,
            required: true,
        },
        previousQuantity: {
            type: Number,
            required: true,
        },
        newQuantity: {
            type: Number,
            required: true,
        },
        reason: {
            type: String,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

inventoryHistorySchema.index({ itemId: 1 });
inventoryHistorySchema.index({ createdAt: -1 });

export const InventoryHistory = mongoose.model<IInventoryHistory>('InventoryHistory', inventoryHistorySchema);
