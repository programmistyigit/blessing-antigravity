import mongoose, { Schema, Document, Types } from 'mongoose';

export enum MedicationEffectiveness {
    UNKNOWN = 'UNKNOWN',
    GOOD = 'GOOD',
    MODERATE = 'MODERATE',
    POOR = 'POOR',
}

export interface IDisease extends Document {
    sectionId: Types.ObjectId;
    dateDetected: Date;
    diseaseName: string;
    affectedChicks: number;
    mortality: number;
    notes: string;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMedication extends Document {
    sectionId: Types.ObjectId;
    dateGiven: Date;
    medicationName: string;
    dose: string;
    givenToChicks: number;
    effectiveness: MedicationEffectiveness;
    notes: string;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const diseaseSchema = new Schema<IDisease>(
    {
        sectionId: {
            type: Schema.Types.ObjectId,
            ref: 'Section',
            required: true,
        },
        dateDetected: {
            type: Date,
            required: true,
        },
        diseaseName: {
            type: String,
            required: true,
            trim: true,
        },
        affectedChicks: {
            type: Number,
            required: true,
            min: 0,
        },
        mortality: {
            type: Number,
            required: true,
            min: 0,
        },
        notes: {
            type: String,
            default: '',
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

diseaseSchema.index({ sectionId: 1, dateDetected: -1 });

const medicationSchema = new Schema<IMedication>(
    {
        sectionId: {
            type: Schema.Types.ObjectId,
            ref: 'Section',
            required: true,
        },
        dateGiven: {
            type: Date,
            required: true,
        },
        medicationName: {
            type: String,
            required: true,
            trim: true,
        },
        dose: {
            type: String,
            required: true,
        },
        givenToChicks: {
            type: Number,
            required: true,
            min: 0,
        },
        effectiveness: {
            type: String,
            enum: Object.values(MedicationEffectiveness),
            default: MedicationEffectiveness.UNKNOWN,
        },
        notes: {
            type: String,
            default: '',
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

medicationSchema.index({ sectionId: 1, dateGiven: -1 });

export const Disease = mongoose.model<IDisease>('Disease', diseaseSchema);
export const Medication = mongoose.model<IMedication>('Medication', medicationSchema);
