import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Section Status Enum
 * EMPTY - Sex bo'sh, hech qanday partiya yo'q
 * PREPARING - Sex tayyorlanmoqda (tozalanib bo'lgan, joja kutilmoqda)
 * ACTIVE - Aktiv partiya bor, jojalar ichida
 * PARTIAL_OUT - Jojalar qisman chiqarilgan
 * CLEANING - Partiya yopilgan, sex tozalanmoqda
 */
export enum SectionStatus {
    EMPTY = 'EMPTY',
    PREPARING = 'PREPARING',
    ACTIVE = 'ACTIVE',
    PARTIAL_OUT = 'PARTIAL_OUT',
    CLEANING = 'CLEANING',
}

export interface ISection extends Document {
    name: string;
    status: SectionStatus;
    activeBatchId?: Types.ObjectId;
    activePeriodId?: Types.ObjectId; // Optional link to Period
    chickArrivalDate: Date | null;
    expectedEndDate: Date | null;
    assignedWorkers: Types.ObjectId[];
    createdBy: Types.ObjectId;
    createdAt: Date;
    closedAt: Date | null;
    isArchived: boolean;
    location?: {
        lat: number;
        lng: number;
        radius: number;
    };
}

const sectionSchema = new Schema<ISection>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: Object.values(SectionStatus),
            default: SectionStatus.EMPTY,
            required: true,
        },
        activeBatchId: {
            type: Schema.Types.ObjectId,
            ref: 'Batch',
            default: null,
        },
        activePeriodId: {
            type: Schema.Types.ObjectId,
            ref: 'Period',
            default: null,
        },
        chickArrivalDate: {
            type: Date,
            default: null,
        },
        expectedEndDate: {
            type: Date,
            default: null,
        },
        assignedWorkers: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        closedAt: {
            type: Date,
            default: null,
        },
        isArchived: {
            type: Boolean,
            default: false,
        },
        location: {
            lat: Number,
            lng: Number,
            radius: {
                type: Number,
                default: 100,
            },
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
sectionSchema.index({ status: 1 });
sectionSchema.index({ assignedWorkers: 1 });
sectionSchema.index({ activeBatchId: 1 });
sectionSchema.index({ activePeriodId: 1 }); // New index

export const Section = mongoose.model<ISection>('Section', sectionSchema);

