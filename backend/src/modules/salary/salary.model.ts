import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Employee Salary - Base salary per period
 * Hodimning oylik maoshi (har bir period uchun alohida)
 */
export interface IEmployeeSalary extends Document {
    employeeId: Types.ObjectId;
    baseSalary: number;
    periodId: Types.ObjectId;
    sectionId?: Types.ObjectId;
    createdAt: Date;
}

const employeeSalarySchema = new Schema<IEmployeeSalary>(
    {
        employeeId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        baseSalary: {
            type: Number,
            required: true,
            min: [0, 'Base salary cannot be negative'],
        },
        periodId: {
            type: Schema.Types.ObjectId,
            ref: 'Period',
            required: true,
        },
        sectionId: {
            type: Schema.Types.ObjectId,
            ref: 'Section',
            default: null,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Unique: one salary per employee per period
employeeSalarySchema.index({ employeeId: 1, periodId: 1 }, { unique: true });
employeeSalarySchema.index({ periodId: 1 });
employeeSalarySchema.index({ sectionId: 1 });

export const EmployeeSalary = mongoose.model<IEmployeeSalary>('EmployeeSalary', employeeSalarySchema);

/**
 * Salary Advance - Avans (oldindan berilgan pul)
 */
export interface ISalaryAdvance extends Document {
    employeeId: Types.ObjectId;
    periodId: Types.ObjectId;
    sectionId?: Types.ObjectId;
    amount: number;
    description?: string;
    givenBy: Types.ObjectId;
    createdAt: Date;
}

const salaryAdvanceSchema = new Schema<ISalaryAdvance>(
    {
        employeeId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        periodId: {
            type: Schema.Types.ObjectId,
            ref: 'Period',
            required: true,
        },
        sectionId: {
            type: Schema.Types.ObjectId,
            ref: 'Section',
            default: null,
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
        givenBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

salaryAdvanceSchema.index({ employeeId: 1, periodId: 1 });
salaryAdvanceSchema.index({ periodId: 1 });

export const SalaryAdvance = mongoose.model<ISalaryAdvance>('SalaryAdvance', salaryAdvanceSchema);

/**
 * Salary Bonus - Rag'bat / qo'shimcha to'lov
 */
export interface ISalaryBonus extends Document {
    employeeId: Types.ObjectId;
    periodId: Types.ObjectId;
    sectionId?: Types.ObjectId;
    amount: number;
    reason: string;
    givenBy: Types.ObjectId;
    createdAt: Date;
}

const salaryBonusSchema = new Schema<ISalaryBonus>(
    {
        employeeId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        periodId: {
            type: Schema.Types.ObjectId,
            ref: 'Period',
            required: true,
        },
        sectionId: {
            type: Schema.Types.ObjectId,
            ref: 'Section',
            default: null,
        },
        amount: {
            type: Number,
            required: true,
            min: [0, 'Amount cannot be negative'],
        },
        reason: {
            type: String,
            required: true,
        },
        givenBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

salaryBonusSchema.index({ employeeId: 1, periodId: 1 });
salaryBonusSchema.index({ periodId: 1 });

export const SalaryBonus = mongoose.model<ISalaryBonus>('SalaryBonus', salaryBonusSchema);

/**
 * Employee Debt - Over-advance qarz hisobi
 * Agar totalAdvances > baseSalary bo'lsa, qarz yoziladi
 * Bu qarz davrlar orasida saqlanadi va kelajakdagi davrda hisobga olinadi
 */
export interface IEmployeeDebt extends Document {
    employeeId: Types.ObjectId;
    fromPeriodId: Types.ObjectId;     // Qaysi davrda paydo bo'ldi
    amount: number;                    // Qarz miqdori (har doim musbat)
    remainingAmount: number;           // Qolgan qarz (to'langan summa ayirilgan)
    isSettled: boolean;               // To'liq to'landimi
    settledInPeriodId?: Types.ObjectId; // Qaysi davrda to'landi
    createdAt: Date;
    updatedAt: Date;
}

const employeeDebtSchema = new Schema<IEmployeeDebt>(
    {
        employeeId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        fromPeriodId: {
            type: Schema.Types.ObjectId,
            ref: 'Period',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: [0, 'Debt amount cannot be negative'],
        },
        remainingAmount: {
            type: Number,
            required: true,
            min: [0, 'Remaining amount cannot be negative'],
        },
        isSettled: {
            type: Boolean,
            default: false,
        },
        settledInPeriodId: {
            type: Schema.Types.ObjectId,
            ref: 'Period',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

employeeDebtSchema.index({ employeeId: 1, isSettled: 1 });
employeeDebtSchema.index({ fromPeriodId: 1 });

export const EmployeeDebt = mongoose.model<IEmployeeDebt>('EmployeeDebt', employeeDebtSchema);
