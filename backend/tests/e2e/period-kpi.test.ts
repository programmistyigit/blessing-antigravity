import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../src/core/database';
import { initializeDatabase } from '../../src/utils/init.util';

// Models
import { Section } from '../../src/modules/sections/section.model';
import { Batch } from '../../src/modules/sections/batch.model';
import { ChickOut } from '../../src/modules/sections/chick-out.model';
import { Period } from '../../src/modules/periods/period.model';
import { PeriodExpense, ExpenseCategory } from '../../src/modules/periods/period-expense.model';
import { User } from '../../src/modules/users/user.model';

// Services
import { BatchService } from '../../src/modules/sections/batch.service';
import { SectionService } from '../../src/modules/sections/section.service';
import { PeriodService } from '../../src/modules/periods/period.service';
import { ChickOutService } from '../../src/modules/sections/chick-out.service';
import { PeriodKPIService } from '../../src/modules/periods/period-kpi.service';

/**
 * Period KPI E2E Tests
 * A3 — Faqat shu bosqichga oid testlar
 * 
 * ❗ FULL TEST QILINMASIN
 * ❗ npm test tests/e2e/period-kpi.test.ts
 */
describe('Period KPI E2E Tests', () => {
    let directorUserId: string;
    let cleanupIds: {
        sections: string[],
        periods: string[],
        batches: string[],
        chickOuts: string[],
        expenses: string[]
    } = {
        sections: [],
        periods: [],
        batches: [],
        chickOuts: [],
        expenses: []
    };

    beforeAll(async () => {
        await connectDatabase();
        await initializeDatabase();

        let director = await User.findOne({ username: 'director' });
        if (!director) {
            director = await User.create({
                username: 'director',
                password: 'director123',
                fullName: 'Director User',
                role: new mongoose.Types.ObjectId(),
                status: 'ACTIVE'
            });
        }
        directorUserId = director._id.toString();
    });

    afterAll(async () => {
        // Cleanup in reverse order
        for (const id of cleanupIds.expenses) {
            await PeriodExpense.findByIdAndDelete(id);
        }
        for (const id of cleanupIds.chickOuts) {
            await ChickOut.findByIdAndDelete(id);
        }
        for (const id of cleanupIds.batches) {
            await Batch.findByIdAndDelete(id);
        }
        for (const id of cleanupIds.sections) {
            await Section.findByIdAndDelete(id);
        }
        for (const id of cleanupIds.periods) {
            await Period.findByIdAndDelete(id);
        }
        await disconnectDatabase();
    });

    // =========================================
    // HELPER: Create full period with chicks and finances
    // =========================================
    async function createFullPeriod(
        name: string,
        chicksIn: number,
        chickOutCount: number,
        revenueParams: { totalWeightKg: number; wastePercent: number; pricePerKg: number },
        expenseAmount: number
    ) {
        // Create period
        const period = await PeriodService.createPeriod({
            name,
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // Create section and assign
        const section = await SectionService.createSection({
            name: `${name} Section`,
            createdBy: directorUserId
        });
        cleanupIds.sections.push(section._id.toString());
        await SectionService.assignPeriod(section._id.toString(), period._id.toString());

        // Create batch with specific chicks count
        const batch = await BatchService.createBatch({
            sectionId: section._id.toString(),
            expectedEndAt: new Date(Date.now() + 86400000),
            totalChicksIn: chicksIn,
            createdBy: directorUserId
        });
        cleanupIds.batches.push(batch._id.toString());

        // Create and complete chick out
        const chickOut = await ChickOutService.createChickOut({
            sectionId: section._id.toString(),
            count: chickOutCount,
            vehicleNumber: 'KPI-001',
            machineNumber: 'M001',
            isFinal: false,
            createdBy: directorUserId
        });
        cleanupIds.chickOuts.push(chickOut._id.toString());

        await ChickOutService.complete(
            chickOut._id.toString(),
            revenueParams,
            directorUserId
        );

        // Add expense if > 0
        if (expenseAmount > 0) {
            const expense = await PeriodExpense.create({
                periodId: period._id,
                category: ExpenseCategory.ELECTRICITY,
                amount: expenseAmount,
                description: 'Test expense',
                expenseDate: new Date(),
                createdBy: directorUserId
            });
            cleanupIds.expenses.push(expense._id.toString());
        }

        return { period, batch, chickOut };
    }

    // =========================================
    // TEST 1: Normal holat → barcha KPI'lar to'g'ri
    // =========================================
    it('Test 1: Normal holat → barcha KPI\'lar to\'g\'ri', async () => {
        // chicksIn: 1000, chickOut: 800
        // Revenue: 2000 kg * (1 - 0.1) * 50000 = 90,000,000
        // Expense: 30,000,000
        // Profit: 60,000,000
        const { period } = await createFullPeriod(
            'KPI Test 1',
            1000,   // totalChicksIn
            800,    // chickOutCount
            { totalWeightKg: 2000, wastePercent: 10, pricePerKg: 50000 },
            30000000  // expense: 30M
        );

        const kpi = await PeriodKPIService.getPeriodKPI(period._id.toString());

        // Check totals
        expect(kpi.totals.totalChicksIn).toBe(1000);
        expect(kpi.totals.finalChicksOut).toBe(800);
        expect(kpi.totals.totalRevenue).toBe(90000000);
        expect(kpi.totals.totalExpenses).toBe(30000000);
        expect(kpi.totals.profit).toBe(60000000);

        // Check KPIs
        // profitMargin = (60M / 90M) * 100 = 66.67%
        expect(kpi.kpis.profitMarginPercent).toBeCloseTo(66.67, 1);

        // costPerChick = 30M / 1000 = 30,000
        expect(kpi.kpis.costPerChick).toBe(30000);

        // revenuePerChick = 90M / 800 = 112,500
        expect(kpi.kpis.revenuePerChick).toBe(112500);

        // profitPerChick = 60M / 800 = 75,000
        expect(kpi.kpis.profitPerChick).toBe(75000);
    });

    // =========================================
    // TEST 2: totalRevenue = 0 → profitMargin = 0
    // =========================================
    it('Test 2: totalRevenue = 0 → profitMargin = 0', async () => {
        // Create period with no completed chick outs (no revenue)
        const period = await PeriodService.createPeriod({
            name: 'KPI Test 2 - No Revenue',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // No revenue means profitMargin should be 0, not NaN or error
        const kpi = await PeriodKPIService.getPeriodKPI(period._id.toString());

        expect(kpi.totals.totalRevenue).toBe(0);
        expect(kpi.kpis.profitMarginPercent).toBe(0);
    });

    // =========================================
    // TEST 3: totalChicksIn = 0 → costPerChick = 0
    // =========================================
    it('Test 3: totalChicksIn = 0 → costPerChick = 0', async () => {
        // Create period with no batches (no chicks)
        const period = await PeriodService.createPeriod({
            name: 'KPI Test 3 - No Chicks',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // Add expense but no chicks
        const expense = await PeriodExpense.create({
            periodId: period._id,
            category: ExpenseCategory.MAINTENANCE,
            amount: 5000000,
            expenseDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.expenses.push(expense._id.toString());

        const kpi = await PeriodKPIService.getPeriodKPI(period._id.toString());

        expect(kpi.totals.totalChicksIn).toBe(0);
        expect(kpi.totals.totalExpenses).toBe(5000000);
        expect(kpi.kpis.costPerChick).toBe(0);  // Safe division
    });

    // =========================================
    // TEST 4: finalChicksOut = 0 → revenue/profit per chick = 0
    // =========================================
    it('Test 4: finalChicksOut = 0 → revenue/profit per chick = 0', async () => {
        // Create period with no completed chick outs
        const period = await PeriodService.createPeriod({
            name: 'KPI Test 4 - No ChickOut',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        const kpi = await PeriodKPIService.getPeriodKPI(period._id.toString());

        expect(kpi.totals.finalChicksOut).toBe(0);
        expect(kpi.kpis.revenuePerChick).toBe(0);
        expect(kpi.kpis.profitPerChick).toBe(0);
    });

    // =========================================
    // TEST 5: Noma'lum period → ERROR
    // =========================================
    it('Test 5: Noma\'lum period → ERROR', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();

        await expect(
            PeriodKPIService.getPeriodKPI(fakeId)
        ).rejects.toThrow('Period not found');
    });
});
