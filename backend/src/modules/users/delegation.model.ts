import mongoose, { Schema, Document, Types } from 'mongoose';
import { Permission } from '../permissions/permission.enum';

/**
 * Delegation (Vaqtincha ruxsat topshirish) Interface
 * Ishchi ruxsatlarini vaqtincha boshqa ishchiga berish
 */
export interface IDelegation extends Document {
    fromUserId: Types.ObjectId;
    toUserId: Types.ObjectId;
    permissions: Permission[];
    sections?: Types.ObjectId[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const delegationSchema = new Schema<IDelegation>(
    {
        fromUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        toUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        permissions: {
            type: [String],
            required: true,
            validate: {
                validator: (v: string[]) => v.length > 0,
                message: 'At least one permission is required',
            },
        },
        sections: [{
            type: Schema.Types.ObjectId,
            ref: 'Section',
        }],
        isActive: {
            type: Boolean,
            default: true,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
delegationSchema.index({ fromUserId: 1 });
delegationSchema.index({ toUserId: 1 });
delegationSchema.index({ isActive: 1 });
delegationSchema.index({ toUserId: 1, isActive: 1 });

export const Delegation = mongoose.model<IDelegation>('Delegation', delegationSchema);
