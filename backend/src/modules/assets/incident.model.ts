import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Technical Incident Interface
 * Uskunadagi texnik nosozlik haqida rasmiy xabar
 */
export interface ITechnicalIncident extends Document {
    assetId: Types.ObjectId;           // Qaysi uskuna bilan bog'liq
    sectionId?: Types.ObjectId;        // Agar uskuna sexga tegishli bo'lsa
    reportedBy: Types.ObjectId;        // Kim xabar berdi
    description: string;               // Nosozlik tavsifi
    requiresExpense: boolean;          // Xarajat talab qiladimi
    resolved: boolean;                 // Muammo hal qilindimi
    linkedPeriodId?: Types.ObjectId;   // Keyingi bosqich uchun (ixtiyoriy)
    expenseId?: Types.ObjectId;        // Yozilgan xarajat (1:1 bog'lanish)
    createdAt: Date;
    updatedAt: Date;
}

const technicalIncidentSchema = new Schema<ITechnicalIncident>(
    {
        assetId: {
            type: Schema.Types.ObjectId,
            ref: 'Asset',
            required: true,
            index: true,
        },
        sectionId: {
            type: Schema.Types.ObjectId,
            ref: 'Section',
            default: null,
            index: true,
        },
        reportedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            minlength: [5, 'Description must be at least 5 characters'],
        },
        requiresExpense: {
            type: Boolean,
            required: true,
            default: false,
        },
        resolved: {
            type: Boolean,
            default: false,
        },
        linkedPeriodId: {
            type: Schema.Types.ObjectId,
            ref: 'Period',
            default: null,
        },
        expenseId: {
            type: Schema.Types.ObjectId,
            ref: 'PeriodExpense',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
technicalIncidentSchema.index({ resolved: 1 });
technicalIncidentSchema.index({ createdAt: -1 });
technicalIncidentSchema.index({ assetId: 1, resolved: 1 });
technicalIncidentSchema.index({ sectionId: 1, resolved: 1 });

export const TechnicalIncident = mongoose.model<ITechnicalIncident>('TechnicalIncident', technicalIncidentSchema);
