import { PeriodExpense, IPeriodExpense, ExpenseCategory } from './period-expense.model';
import { Period, PeriodStatus } from './period.model';

/**
 * Utility Expense Service
 * DailyReport asosida WATER va ELECTRICITY xarajatlarini yaratish
 * 
 * Bu resurslar Inventory'da saqlanmaydi (kumul/utility resurslar):
 * - Omborda qoldiq hisoblanmaydi
 * - Faqat iste'mol → xarajat sifatida yoziladi
 */
export class UtilityExpenseService {
    // Vaqtincha hardcode tariflar (keyinchalik config/env orqali o'zgartiriladi)
    static readonly WATER_TARIFF = 1000;       // so'm/litr
    static readonly ELECTRICITY_TARIFF = 800;  // so'm/kWh

    /**
     * Create WATER expense from DailyReport
     */
    static async createWaterExpense(data: {
        periodId: string;
        sectionId: string;
        quantity: number;      // waterUsedLiters
        expenseDate: Date;
        dailyReportId: string;
        createdBy: string;
    }): Promise<IPeriodExpense> {
        // Validate period
        const period = await Period.findById(data.periodId);
        if (!period) {
            throw new Error('Period not found');
        }
        if (period.status !== PeriodStatus.ACTIVE) {
            throw new Error('Cannot add utility expense to closed period');
        }

        // Validate quantity
        if (data.quantity <= 0) {
            throw new Error('Water quantity must be positive');
        }

        // Calculate amount
        const amount = data.quantity * this.WATER_TARIFF;

        // Create expense
        const expense = new PeriodExpense({
            periodId: data.periodId,
            category: ExpenseCategory.WATER,
            amount,
            quantity: data.quantity,
            unitCost: this.WATER_TARIFF,
            description: `Suv iste'moli: ${data.quantity} litr`,
            expenseDate: data.expenseDate,
            sectionId: data.sectionId,
            source: 'DAILY_REPORT',
            dailyReportId: data.dailyReportId,
            createdBy: data.createdBy,
        });

        await expense.save();
        return expense;
    }

    /**
     * Create ELECTRICITY expense from DailyReport
     */
    static async createElectricityExpense(data: {
        periodId: string;
        sectionId: string;
        quantity: number;      // electricityUsedKwh
        expenseDate: Date;
        dailyReportId: string;
        createdBy: string;
    }): Promise<IPeriodExpense> {
        // Validate period
        const period = await Period.findById(data.periodId);
        if (!period) {
            throw new Error('Period not found');
        }
        if (period.status !== PeriodStatus.ACTIVE) {
            throw new Error('Cannot add utility expense to closed period');
        }

        // Validate quantity
        if (data.quantity <= 0) {
            throw new Error('Electricity quantity must be positive');
        }

        // Calculate amount
        const amount = data.quantity * this.ELECTRICITY_TARIFF;

        // Create expense
        const expense = new PeriodExpense({
            periodId: data.periodId,
            category: ExpenseCategory.ELECTRICITY,
            amount,
            quantity: data.quantity,
            unitCost: this.ELECTRICITY_TARIFF,
            description: `Elektr energiya iste'moli: ${data.quantity} kWh`,
            expenseDate: data.expenseDate,
            sectionId: data.sectionId,
            source: 'DAILY_REPORT',
            dailyReportId: data.dailyReportId,
            createdBy: data.createdBy,
        });

        await expense.save();
        return expense;
    }

    /**
     * Get utility expenses by daily report ID
     * (For checking if expenses already created)
     */
    static async getByDailyReportId(dailyReportId: string): Promise<IPeriodExpense[]> {
        return PeriodExpense.find({ dailyReportId });
    }
}
