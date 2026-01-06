import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * Expense Categories
 * Xarajat turlari
 */
export enum ExpenseCategory {
    ELECTRICITY = 'ELECTRICITY',           // Elektr energiya
    WATER = 'WATER',                       // Suv
    FEED = 'FEED',                         // Yem xarajati
    MEDICINE = 'MEDICINE',                 // Dori-darmon
    LABOR_FIXED = 'LABOR_FIXED',           // Oylik ishchilar
    LABOR_DAILY = 'LABOR_DAILY',           // Kunlik ishchilar
    MAINTENANCE = 'MAINTENANCE',           // Ta'mirlash
    TRANSPORT = 'TRANSPORT',               // Transport
    ASSET_PURCHASE = 'ASSET_PURCHASE',     // Uskuna xaridi
    ASSET_REPAIR = 'ASSET_REPAIR',         // Uskuna ta'miri
    OTHER = 'OTHER'                        // Boshqa
}

/**
 * Period Expense Interface
 * Period darajasidagi xarajatlar (batch'dan mustaqil)
 */
export interface IPeriodExpense extends Document {
    periodId: Types.ObjectId;
    category: ExpenseCategory;
    amount: number;
    description?: string;
    expenseDate: Date;
    incidentId?: Types.ObjectId;   // Incident asosida yozilgan xarajat
    assetId?: Types.ObjectId;      // Qaysi uskuna uchun
    sectionId?: Types.ObjectId;    // Qaysi sex uchun
    batchId?: Types.ObjectId;      // Qaysi partiya uchun
    quantity?: number;             // Utility uchun: litr yoki kWh miqdori
    unitCost?: number;             // Utility uchun: tarif (so'm/litr yoki so'm/kWh)
    source?: string;               // Manba: 'DAILY_REPORT' | 'MANUAL'
    dailyReportId?: Types.ObjectId; // Bog'langan DailyReport (agar source=DAILY_REPORT)
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Period Expense Schema
 */
const periodExpenseSchema = new Schema<IPeriodExpense>(
    {
        periodId: {
            type: Schema.Types.ObjectId,
            ref: 'Period',
            required: true,
            index: true,
        },
        category: {
            type: String,
            enum: Object.values(ExpenseCategory),
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: [0, 'Amount cannot be negative'],
        },
        description: {
            type: String,
            default: '',
        },
        expenseDate: {
            type: Date,
            required: true,
        },
        incidentId: {
            type: Schema.Types.ObjectId,
            ref: 'TechnicalIncident',
            default: null,
            index: true,
        },
        assetId: {
            type: Schema.Types.ObjectId,
            ref: 'Asset',
            default: null,
        },
        sectionId: {
            type: Schema.Types.ObjectId,
            ref: 'Section',
            default: null,
        },
        batchId: {
            type: Schema.Types.ObjectId,
            ref: 'Batch',
            default: null,
        },
        quantity: {
            type: Number,
            default: null,
        },
        unitCost: {
            type: Number,
            default: null,
        },
        source: {
            type: String,
            enum: ['DAILY_REPORT', 'MANUAL', null],
            default: null,
        },
        dailyReportId: {
            type: Schema.Types.ObjectId,
            ref: 'SectionDailyReport',
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
periodExpenseSchema.index({ periodId: 1, expenseDate: -1 });
periodExpenseSchema.index({ periodId: 1, category: 1 });

export const PeriodExpense = mongoose.model<IPeriodExpense>('PeriodExpense', periodExpenseSchema);
