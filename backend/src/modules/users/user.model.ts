import mongoose, { Schema, Document, Types } from 'mongoose';

export type UserLanguage = 'uz' | 'ru' | 'en';

export interface IUser extends Document {
    fullName: string;
    username: string;
    passwordHash: string;
    role: Types.ObjectId;
    language: UserLanguage;
    isActive: boolean;
    createdAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100,
        },
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            minlength: 3,
            maxlength: 50,
        },
        passwordHash: {
            type: String,
            required: true,
            select: false, // Don't return password hash by default
        },
        role: {
            type: Schema.Types.ObjectId,
            ref: 'Role',
            required: true,
        },
        language: {
            type: String,
            enum: ['uz', 'ru', 'en'],
            default: 'uz',
        },
        isActive: {
            type: Boolean,
            required: true,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for performance
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Ensure password hash is never returned in JSON
userSchema.set('toJSON', {
    transform: (_doc, ret: any) => {
        const { passwordHash, ...rest } = ret;
        return rest;
    },
});

export const User = mongoose.model<IUser>('User', userSchema);
