import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Utility Type Enum
 */
export enum UtilityType {
    WATER = 'WATER',
    ELECTRICITY = 'ELECTRICITY',
    GAS = 'GAS',
}

/**
 * Utility Cost Interface
 * Kommunal xarajatlar (suv, elektr)
 */
export interface IUtilityCost extends Document {
    type: UtilityType;
    sectionId?: Types.ObjectId;  // null = office/general
    periodId: Types.ObjectId;
    amount: number;
    quantity?: number;           // litr yoki kWh
    unitCost?: number;           // so'm/litr yoki so'm/kWh
    date: Date;
    createdBy: Types.ObjectId;
    expenseId?: Types.ObjectId;
    notes?: string;
    createdAt: Date;
}

const utilityCostSchema = new Schema<IUtilityCost>(
    {
        type: {
            type: String,
            enum: Object.values(UtilityType),
            required: true,
        },
        sectionId: {
            type: Schema.Types.ObjectId,
            ref: 'Section',
            default: null,
        },
        periodId: {
            type: Schema.Types.ObjectId,
            ref: 'Period',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: [0, 'Amount cannot be negative'],
        },
        quantity: {
            type: Number,
            default: null,
        },
        unitCost: {
            type: Number,
            default: null,
        },
        date: {
            type: Date,
            required: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        expenseId: {
            type: Schema.Types.ObjectId,
            ref: 'PeriodExpense',
            default: null,
        },
        notes: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Indexes
utilityCostSchema.index({ periodId: 1, type: 1 });
utilityCostSchema.index({ sectionId: 1, date: -1 });
utilityCostSchema.index({ date: -1 });

export const UtilityCost = mongoose.model<IUtilityCost>('UtilityCost', utilityCostSchema);
