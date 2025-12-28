import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Period Status Enum
 * ACTIVE - Davr hozir ishlayapti
 * CLOSED - Davr yopilgan
 */
export enum PeriodStatus {
    ACTIVE = 'ACTIVE',
    CLOSED = 'CLOSED',
}

/**
 * Period (Davr) Interface
 * Xo'jalik davri - hozircha skeleton sifatida
 */
export interface IPeriod extends Document {
    name: string;
    status: PeriodStatus;
    startDate: Date;
    endDate?: Date;
    createdBy: Types.ObjectId;
    sections: Types.ObjectId[];    // Hozircha faqat saqlanadi, ishlatilmaydi
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const periodSchema = new Schema<IPeriod>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: Object.values(PeriodStatus),
            default: PeriodStatus.ACTIVE,
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            default: null,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        sections: [{
            type: Schema.Types.ObjectId,
            ref: 'Section',
        }],
        notes: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
periodSchema.index({ status: 1 });
periodSchema.index({ startDate: 1 });
periodSchema.index({ createdBy: 1 });

export const Period = mongoose.model<IPeriod>('Period', periodSchema);
