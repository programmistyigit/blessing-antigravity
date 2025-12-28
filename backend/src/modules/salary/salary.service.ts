import mongoose from 'mongoose';
import { EmployeeSalary, IEmployeeSalary, SalaryAdvance, ISalaryAdvance, SalaryBonus, ISalaryBonus } from './salary.model';
import { PeriodExpense, ExpenseCategory } from '../periods/period-expense.model';
import { User } from '../users/user.model';
import { emitSalaryAdvanceGiven, emitSalaryBonusGiven, emitSalaryExpenseFinalized } from '../../realtime/events';

interface CreateSalaryData {
    employeeId: string;
    baseSalary: number;
    periodId: string;
    sectionId?: string;
}

interface GiveAdvanceData {
    employeeId: string;
    amount: number;
    periodId: string;
    sectionId?: string;
    description?: string;
    givenBy: string;
}

interface GiveBonusData {
    employeeId: string;
    amount: number;
    reason: string;
    periodId: string;
    sectionId?: string;
    givenBy: string;
}

export interface EmployeeSalarySummary {
    employeeId: string;
    baseSalary: number;
    totalAdvances: number;
    totalBonuses: number;
    remainingSalary: number;
}

export interface PeriodSalarySummary {
    periodId: string;
    totalSalaries: number;
    totalAdvances: number;
    totalBonuses: number;
    totalLiability: number;
}

export class SalaryService {
    /**
     * Create base salary for employee in a period
     * One salary per employee per period (unique constraint)
     */
    static async createSalary(data: CreateSalaryData): Promise<IEmployeeSalary> {
        // Validate employee exists
        const employee = await User.findById(data.employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }

        // Check if salary already exists for this employee-period
        const existing = await EmployeeSalary.findOne({
            employeeId: data.employeeId,
            periodId: data.periodId,
        });
        if (existing) {
            throw new Error('Salary already exists for this employee in this period');
        }

        const salary = new EmployeeSalary({
            employeeId: data.employeeId,
            baseSalary: data.baseSalary,
            periodId: data.periodId,
            sectionId: data.sectionId || null,
        });

        await salary.save();
        return salary;
    }

    /**
     * Give advance to employee
     * Creates SalaryAdvance + PeriodExpense (LABOR_FIXED)
     */
    static async giveAdvance(data: GiveAdvanceData): Promise<ISalaryAdvance> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Validate employee exists
            const employee = await User.findById(data.employeeId);
            if (!employee) {
                throw new Error('Employee not found');
            }

            // Create advance record
            const advance = new SalaryAdvance({
                employeeId: data.employeeId,
                periodId: data.periodId,
                sectionId: data.sectionId || null,
                amount: data.amount,
                description: data.description || '',
                givenBy: data.givenBy,
            });
            await advance.save({ session });

            // Create PeriodExpense
            await PeriodExpense.create([{
                periodId: data.periodId,
                category: ExpenseCategory.LABOR_FIXED,
                amount: data.amount,
                description: `Avans: ${employee.fullName}${data.description ? ' - ' + data.description : ''}`,
                expenseDate: new Date(),
                sectionId: data.sectionId || null,
                source: 'MANUAL',
                createdBy: data.givenBy,
            }], { session });

            await session.commitTransaction();

            // Emit WebSocket event
            emitSalaryAdvanceGiven({
                employeeId: data.employeeId,
                type: 'ADVANCE',
                amount: data.amount,
                periodId: data.periodId,
                sectionId: data.sectionId || null,
                timestamp: new Date().toISOString(),
            });

            return advance;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Give bonus to employee
     * Creates SalaryBonus + PeriodExpense (LABOR_FIXED)
     */
    static async giveBonus(data: GiveBonusData): Promise<ISalaryBonus> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Validate employee exists
            const employee = await User.findById(data.employeeId);
            if (!employee) {
                throw new Error('Employee not found');
            }

            // Create bonus record
            const bonus = new SalaryBonus({
                employeeId: data.employeeId,
                periodId: data.periodId,
                sectionId: data.sectionId || null,
                amount: data.amount,
                reason: data.reason,
                givenBy: data.givenBy,
            });
            await bonus.save({ session });

            // Create PeriodExpense
            await PeriodExpense.create([{
                periodId: data.periodId,
                category: ExpenseCategory.LABOR_FIXED,
                amount: data.amount,
                description: `Bonus: ${employee.fullName} - ${data.reason}`,
                expenseDate: new Date(),
                sectionId: data.sectionId || null,
                source: 'MANUAL',
                createdBy: data.givenBy,
            }], { session });

            await session.commitTransaction();

            // Emit WebSocket event
            emitSalaryBonusGiven({
                employeeId: data.employeeId,
                type: 'BONUS',
                amount: data.amount,
                periodId: data.periodId,
                sectionId: data.sectionId || null,
                timestamp: new Date().toISOString(),
            });

            return bonus;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Get employee salary summary
     * Formula: remainingSalary = baseSalary - totalAdvances
     * Note: Bonus is separate reward, does NOT affect remaining
     */
    static async getEmployeeSummary(employeeId: string, periodId?: string): Promise<EmployeeSalarySummary> {
        const filter: any = { employeeId };
        if (periodId) {
            filter.periodId = periodId;
        }

        // Get base salary
        const salaryDocs = await EmployeeSalary.find(filter);
        const baseSalary = salaryDocs.reduce((sum, s) => sum + s.baseSalary, 0);

        // Get total advances
        const advances = await SalaryAdvance.find(filter);
        const totalAdvances = advances.reduce((sum, a) => sum + a.amount, 0);

        // Get total bonuses (for info only, NOT affecting remaining)
        const bonuses = await SalaryBonus.find(filter);
        const totalBonuses = bonuses.reduce((sum, b) => sum + b.amount, 0);

        // remainingSalary = baseSalary - totalAdvances
        // Bonus is a SEPARATE reward, not part of remaining calculation
        const remainingSalary = baseSalary - totalAdvances;

        return {
            employeeId,
            baseSalary,
            totalAdvances,
            totalBonuses,
            remainingSalary,
        };
    }

    /**
     * Get period salary summary
     * totalLiability = remaining salaries to pay
     */
    static async getPeriodSummary(periodId: string): Promise<PeriodSalarySummary> {
        // Total salaries in period
        const salaries = await EmployeeSalary.find({ periodId });
        const totalSalaries = salaries.reduce((sum, s) => sum + s.baseSalary, 0);

        // Total advances in period
        const advances = await SalaryAdvance.find({ periodId });
        const totalAdvances = advances.reduce((sum, a) => sum + a.amount, 0);

        // Total bonuses in period (for info, NOT affecting liability)
        const bonuses = await SalaryBonus.find({ periodId });
        const totalBonuses = bonuses.reduce((sum, b) => sum + b.amount, 0);

        // Total liability = totalSalaries - totalAdvances
        // (remaining to be paid, bonus is separate)
        const totalLiability = totalSalaries - totalAdvances;

        return {
            periodId,
            totalSalaries,
            totalAdvances,
            totalBonuses,
            totalLiability,
        };
    }

    /**
     * Get all salaries for a period
     */
    static async getSalariesByPeriod(periodId: string): Promise<IEmployeeSalary[]> {
        return EmployeeSalary.find({ periodId })
            .populate('employeeId', 'fullName username')
            .populate('sectionId', 'name');
    }

    /**
     * Get advances for a period
     */
    static async getAdvancesByPeriod(periodId: string): Promise<ISalaryAdvance[]> {
        return SalaryAdvance.find({ periodId })
            .populate('employeeId', 'fullName username')
            .populate('givenBy', 'fullName username')
            .sort({ createdAt: -1 });
    }

    /**
     * Get bonuses for a period
     */
    static async getBonusesByPeriod(periodId: string): Promise<ISalaryBonus[]> {
        return SalaryBonus.find({ periodId })
            .populate('employeeId', 'fullName username')
            .populate('givenBy', 'fullName username')
            .sort({ createdAt: -1 });
    }

    /**
     * Finalize salary expenses for period close
     * Creates PeriodExpense(LABOR_FIXED) for remaining salaries
     * 
     * Logic:
     * - For each employee with baseSalary in this period
     * - Calculate: remainingToExpense = baseSalary - alreadyExpensedAsAdvances
     * - Create PeriodExpense for the remaining amount
     * 
     * This ensures total LABOR_FIXED expense = sum of all baseSalaries + bonuses
     * (advances are already expensed, so we only add the remaining)
     */
    static async finalizeSalaryExpenses(periodId: string, userId: string): Promise<{ count: number; totalAmount: number }> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const salaries = await EmployeeSalary.find({ periodId }).populate('employeeId', 'fullName');

            let count = 0;
            let totalAmount = 0;

            for (const salary of salaries) {
                // Get advances already paid (already in PeriodExpense)
                const advances = await SalaryAdvance.find({
                    employeeId: salary.employeeId,
                    periodId,
                });
                const totalAdvances = advances.reduce((sum, a) => sum + a.amount, 0);

                // Remaining to expense = baseSalary - advances
                const remainingToExpense = salary.baseSalary - totalAdvances;

                if (remainingToExpense > 0) {
                    const employeeName = (salary.employeeId as any)?.fullName || 'Unknown';

                    await PeriodExpense.create([{
                        periodId,
                        category: ExpenseCategory.LABOR_FIXED,
                        amount: remainingToExpense,
                        description: `Oylik to'lov (yakuniy): ${employeeName}`,
                        expenseDate: new Date(),
                        sectionId: salary.sectionId || null,
                        source: 'MANUAL',
                        createdBy: userId,
                    }], { session });

                    count++;
                    totalAmount += remainingToExpense;
                }
            }

            await session.commitTransaction();

            // Emit WebSocket event
            emitSalaryExpenseFinalized({
                periodId,
                count,
                totalAmount,
                timestamp: new Date().toISOString(),
            });

            return { count, totalAmount };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}

