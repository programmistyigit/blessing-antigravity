import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Asset Category Enum
 * Uskuna turlari
 */
export enum AssetCategory {
    MOTOR = 'MOTOR',           // Motorlar
    COUNTER = 'COUNTER',       // Elektr hisoblagichlar
    ENGINE = 'ENGINE',         // Dvijoklar
    OTHER = 'OTHER'            // Boshqa
}

/**
 * Asset Status Enum
 * Uskuna holatlari
 */
export enum AssetStatus {
    ACTIVE = 'ACTIVE',                 // Ishlayapti
    BROKEN = 'BROKEN',                 // Buzilgan
    REPAIRED = 'REPAIRED',             // Ta'mirlangan
    DECOMMISSIONED = 'DECOMMISSIONED'  // Hisobdan chiqarilgan
}

/**
 * Asset Location Interface
 * Uskunaning fizik joylashuvi (GPS koordinatalari)
 */
export interface IAssetLocation {
    lat: number;  // Kenglik: -90 dan 90 gacha
    lng: number;  // Uzunlik: -180 dan 180 gacha
}

/**
 * Asset Interface
 * Fabrikadagi texnik uskuna
 */
export interface IAsset extends Document {
    name: string;
    category: AssetCategory;
    sectionId?: Types.ObjectId;  // Ixtiyoriy - sexga bog'lanish
    status: AssetStatus;
    location?: IAssetLocation;   // Ixtiyoriy - aniq joylashuv
    isNewPurchase: boolean;      // Yangi sotib olinganmi? Default: false
    purchaseCost?: number;       // Faqat isNewPurchase = true bo'lganda
    purchasePeriodId?: Types.ObjectId;  // Xarajat yozilgan period
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const assetSchema = new Schema<IAsset>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            enum: Object.values(AssetCategory),
            required: true,
        },
        sectionId: {
            type: Schema.Types.ObjectId,
            ref: 'Section',
            default: null,  // Ixtiyoriy - umumiy uskunalar uchun null
        },
        status: {
            type: String,
            enum: Object.values(AssetStatus),
            default: AssetStatus.ACTIVE,
            required: true,
        },
        location: {
            type: {
                lat: {
                    type: Number,
                    required: true,
                    min: [-90, 'Latitude must be >= -90'],
                    max: [90, 'Latitude must be <= 90'],
                },
                lng: {
                    type: Number,
                    required: true,
                    min: [-180, 'Longitude must be >= -180'],
                    max: [180, 'Longitude must be <= 180'],
                },
            },
            default: null,  // Ixtiyoriy
            _id: false,
        },
        isNewPurchase: {
            type: Boolean,
            default: false,  // Eski uskunalar uchun default false
        },
        purchaseCost: {
            type: Number,
            default: null,
            min: [0, 'Purchase cost cannot be negative'],
        },
        purchasePeriodId: {
            type: Schema.Types.ObjectId,
            ref: 'Period',
            default: null,
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

// Indexes
assetSchema.index({ sectionId: 1 });
assetSchema.index({ status: 1 });
assetSchema.index({ category: 1 });

export const Asset = mongoose.model<IAsset>('Asset', assetSchema);
