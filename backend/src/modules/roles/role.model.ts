import mongoose, { Schema, Document } from 'mongoose';
import { Permission } from '../permissions/permission.enum';

export interface IRole extends Document {
    name: string;
    permissions: Permission[];
    canCreateUsers: boolean;
    canCreateRoles: boolean;
    baseSalary: number;
    createdAt: Date;
}

const roleSchema = new Schema<IRole>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 2,
            maxlength: 50,
        },
        permissions: {
            type: [String],
            required: true,
            enum: Object.values(Permission),
            default: [],
        },
        canCreateUsers: {
            type: Boolean,
            required: true,
            default: false,
        },
        canCreateRoles: {
            type: Boolean,
            required: true,
            default: false,
        },
        baseSalary: {
            type: Number,
            default: 0,
            min: [0, 'Base salary cannot be negative'],
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for performance
roleSchema.index({ name: 1 });

// Virtual for checking if role has SYSTEM_ALL permission
roleSchema.virtual('isSystemAdmin').get(function () {
    return this.permissions.includes(Permission.SYSTEM_ALL);
});

// Ensure virtuals are included in JSON
roleSchema.set('toJSON', { virtuals: true });
roleSchema.set('toObject', { virtuals: true });

export const Role = mongoose.model<IRole>('Role', roleSchema);
