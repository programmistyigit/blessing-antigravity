import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISectionReportAudit extends Document {
    reportId: Types.ObjectId;
    sectionId: Types.ObjectId;
    changedBy: Types.ObjectId;
    previousValues: Record<string, any>;
    newValues: Record<string, any>;
    reason: string;
    createdAt: Date;
}

const auditSchema = new Schema<ISectionReportAudit>(
    {
        reportId: {
            type: Schema.Types.ObjectId,
            ref: 'SectionDailyReport',
            required: true,
        },
        sectionId: {
            type: Schema.Types.ObjectId,
            ref: 'Section',
            required: true,
        },
        changedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        previousValues: {
            type: Schema.Types.Mixed,
            required: true,
        },
        newValues: {
            type: Schema.Types.Mixed,
            required: true,
        },
        reason: {
            type: String,
            default: 'Update',
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

export const SectionReportAudit = mongoose.model<ISectionReportAudit>('SectionReportAudit', auditSchema);
