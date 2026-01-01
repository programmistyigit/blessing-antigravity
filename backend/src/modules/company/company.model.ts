import mongoose, { Document, Schema } from 'mongoose';

export interface ICompanySettings extends Document {
    location: {
        lat: number;
        lng: number;
        radius: number;
    } | null;
    updatedAt: Date;
}

const companySettingsSchema = new Schema(
    {
        location: {
            type: {
                lat: { type: Number, required: true },
                lng: { type: Number, required: true },
                radius: { type: Number, default: 100, min: 10, max: 500 },
            },
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

export const CompanySettings = mongoose.model<ICompanySettings>('CompanySettings', companySettingsSchema);
