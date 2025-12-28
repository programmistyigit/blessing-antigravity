import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../src/core/database';
import { initializeDatabase } from '../../src/utils/init.util';
import { EmployeeSalary, SalaryAdvance, SalaryBonus } from '../../src/modules/salary/salary.model';
import { SalaryService } from '../../src/modules/salary/salary.service';
import { PeriodExpense, ExpenseCategory } from '../../src/modules/periods/period-expense.model';
import { User } from '../../src/modules/users/user.model';
import { Role } from '../../src/modules/roles/role.model';
import { Period } from '../../src/modules/periods/period.model';
import { RealtimeEvent } from '../../src/realtime/events';
import { socketManager } from '../../src/realtime/socket';

// Mock socket manager
vi.mock('../../src/realtime/socket', () => ({
    socketManager: {
        broadcastToChannel: vi.fn(),
        sendToUser: vi.fn(),
    }
}));

describe('Salary Management E2E Tests', () => {
    let testUser: any;
    let financeUser: any;
    let testPeriod: any;

    beforeAll(async () => {
        // Mock session for standalone mongo
        const originalStartSession = mongoose.startSession.bind(mongoose);
        vi.spyOn(mongoose, 'startSession').mockImplementation(async (options) => {
            const session = await originalStartSession(options);
            session.startTransaction = vi.fn();
            session.commitTransaction = vi.fn();
            session.abortTransaction = vi.fn();
            return session;
        });

        await connectDatabase();
        await initializeDatabase();

        // Get or create test users
        const directorRole = await Role.findOne({ name: 'Director' });
        financeUser = await User.findOne({ role: directorRole?._id });
        if (!financeUser) {
            financeUser = await User.create({
                username: 'finance_test',
                passwordHash: 'hash',
                fullName: 'Finance Test',
                role: directorRole?._id,
                isActive: true
            });
        }

        // Create a test employee
        const workerRole = await Role.findOne({ name: 'Worker' });
        testUser = await User.create({
            username: `employee_${Date.now()}`,
            passwordHash: 'hash',
            fullName: 'Test Employee',
            role: workerRole?._id || directorRole?._id,
            isActive: true
        });

        // Get or create test period
        testPeriod = await Period.findOne({ status: 'ACTIVE' });
        if (!testPeriod) {
            testPeriod = await Period.create({
                name: 'Test Period',
                startDate: new Date(),
                status: 'ACTIVE',
                createdBy: financeUser._id,
            });
        }
    });

    afterAll(async () => {
        // Cleanup
        if (testUser) {
            await User.deleteOne({ _id: testUser._id });
        }
        await disconnectDatabase();
    });

    it('Test 1: Creates base salary for employee', async () => {
        const salary = await SalaryService.createSalary({
            employeeId: testUser._id.toString(),
            baseSalary: 3000000,
            periodId: testPeriod._id.toString(),
        });

        expect(salary).toBeDefined();
        expect(salary.baseSalary).toBe(3000000);
        expect(salary.employeeId.toString()).toBe(testUser._id.toString());
        expect(salary.periodId.toString()).toBe(testPeriod._id.toString());
    });

    it('Test 2: Prevents duplicate salary for same employee-period', async () => {
        await expect(SalaryService.createSalary({
            employeeId: testUser._id.toString(),
            baseSalary: 5000000,
            periodId: testPeriod._id.toString(),
        })).rejects.toThrow('already exists');
    });

    it('Test 3: Advance creates SalaryAdvance + PeriodExpense', async () => {
        const advance = await SalaryService.giveAdvance({
            employeeId: testUser._id.toString(),
            amount: 500000,
            periodId: testPeriod._id.toString(),
            description: 'Test advance',
            givenBy: financeUser._id.toString(),
        });

        expect(advance).toBeDefined();
        expect(advance.amount).toBe(500000);

        // Check PeriodExpense was created
        const expense = await PeriodExpense.findOne({
            periodId: testPeriod._id,
            category: ExpenseCategory.LABOR_FIXED,
            amount: 500000,
        });
        expect(expense).toBeDefined();
        expect(expense?.description).toContain('Avans');

        // Check WebSocket event
        expect(socketManager.broadcastToChannel).toHaveBeenCalledWith(
            'system:*',
            RealtimeEvent.SALARY_ADVANCE_GIVEN,
            expect.objectContaining({
                employeeId: testUser._id.toString(),
                type: 'ADVANCE',
                amount: 500000,
            })
        );
    });

    it('Test 4: Bonus creates SalaryBonus + PeriodExpense', async () => {
        const bonus = await SalaryService.giveBonus({
            employeeId: testUser._id.toString(),
            amount: 200000,
            reason: 'Performance bonus',
            periodId: testPeriod._id.toString(),
            givenBy: financeUser._id.toString(),
        });

        expect(bonus).toBeDefined();
        expect(bonus.amount).toBe(200000);
        expect(bonus.reason).toBe('Performance bonus');

        // Check PeriodExpense was created
        const expense = await PeriodExpense.findOne({
            periodId: testPeriod._id,
            category: ExpenseCategory.LABOR_FIXED,
            amount: 200000,
        });
        expect(expense).toBeDefined();
        expect(expense?.description).toContain('Bonus');

        // Check WebSocket event
        expect(socketManager.broadcastToChannel).toHaveBeenCalledWith(
            'system:*',
            RealtimeEvent.SALARY_BONUS_GIVEN,
            expect.objectContaining({
                employeeId: testUser._id.toString(),
                type: 'BONUS',
                amount: 200000,
            })
        );
    });

    it('Test 5: Remaining salary formula is correct', async () => {
        // baseSalary = 3000000, advances = 500000, bonuses = 200000
        // remainingSalary = 3000000 - 500000 + 200000 = 2700000
        const summary = await SalaryService.getEmployeeSummary(
            testUser._id.toString(),
            testPeriod._id.toString()
        );

        expect(summary.baseSalary).toBe(3000000);
        expect(summary.totalAdvances).toBe(500000);
        expect(summary.totalBonuses).toBe(200000);
        expect(summary.remainingSalary).toBe(2700000);
    });

    it('Test 6: Period summary aggregates correctly', async () => {
        const summary = await SalaryService.getPeriodSummary(testPeriod._id.toString());

        expect(summary.totalSalaries).toBeGreaterThanOrEqual(3000000);
        expect(summary.totalAdvances).toBeGreaterThanOrEqual(500000);
        expect(summary.totalBonuses).toBeGreaterThanOrEqual(200000);
        expect(summary.totalLiability).toBeDefined();
    });
});
