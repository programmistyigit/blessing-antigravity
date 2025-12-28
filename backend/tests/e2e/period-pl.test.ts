import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../src/core/database';
import { initializeDatabase } from '../../src/utils/init.util';

// Models
import { Section } from '../../src/modules/sections/section.model';
import { Batch } from '../../src/modules/sections/batch.model';
import { ChickOut, ChickOutStatus } from '../../src/modules/sections/chick-out.model';
import { Period } from '../../src/modules/periods/period.model';
import { PeriodExpense, ExpenseCategory } from '../../src/modules/periods/period-expense.model';
import { User } from '../../src/modules/users/user.model';
import { Asset, AssetCategory, AssetStatus } from '../../src/modules/assets/asset.model';
import { TechnicalIncident } from '../../src/modules/assets/incident.model';

// Services
import { BatchService } from '../../src/modules/sections/batch.service';
import { SectionService } from '../../src/modules/sections/section.service';
import { PeriodService } from '../../src/modules/periods/period.service';
import { ChickOutService } from '../../src/modules/sections/chick-out.service';
import { PeriodPLService } from '../../src/modules/periods/period-pl.service';

/**
 * Period Profit & Loss (P&L) E2E Tests
 * STEP 4 — Faqat shu bosqichga oid testlar
 * 
 * ❗ FULL TEST QILINMASIN
 * ❗ npm test tests/e2e/period-pl.test.ts
 */
describe('Period Profit & Loss (P&L) E2E Tests', () => {
    let directorUserId: string;
    let cleanupIds: {
        sections: string[],
        periods: string[],
        batches: string[],
        chickOuts: string[],
        expenses: string[],
        assets: string[],
        incidents: string[]
    } = {
        sections: [],
        periods: [],
        batches: [],
        chickOuts: [],
        expenses: [],
        assets: [],
        incidents: []
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
        for (const id of cleanupIds.incidents) {
            await TechnicalIncident.findByIdAndDelete(id);
        }
        for (const id of cleanupIds.expenses) {
            await PeriodExpense.findByIdAndDelete(id);
        }
        for (const id of cleanupIds.chickOuts) {
            await ChickOut.findByIdAndDelete(id);
        }
        for (const id of cleanupIds.batches) {
            await Batch.findByIdAndDelete(id);
        }
        for (const id of cleanupIds.assets) {
            await Asset.findByIdAndDelete(id);
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
    // HELPER: Create period with section, batch, completed chickout
    // =========================================
    async function createPeriodWithCompletedChickOut(
        name: string,
        revenueParams: { totalWeightKg: number; wastePercent: number; pricePerKg: number }
    ) {
        const period = await PeriodService.createPeriod({
            name,
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        const section = await SectionService.createSection({
            name: `${name} Section`,
            createdBy: directorUserId
        });
        cleanupIds.sections.push(section._id.toString());
        await SectionService.assignPeriod(section._id.toString(), period._id.toString());

        const batch = await BatchService.createBatch({
            sectionId: section._id.toString(),
            expectedEndAt: new Date(Date.now() + 86400000),
            totalChicksIn: 1000,
            createdBy: directorUserId
        });
        cleanupIds.batches.push(batch._id.toString());

        const chickOut = await ChickOutService.createChickOut({
            sectionId: section._id.toString(),
            count: 500,
            vehicleNumber: 'PL-001',
            machineNumber: 'M001',
            isFinal: false,
            createdBy: directorUserId
        });
        cleanupIds.chickOuts.push(chickOut._id.toString());

        // Complete with financial data
        await ChickOutService.complete(
            chickOut._id.toString(),
            revenueParams,
            directorUserId
        );

        return { period, section, batch, chickOut };
    }

    // =========================================
    // TEST 1: Revenue > Expense → profit musbat
    // =========================================
    it('Test 1: Revenue > Expense → profit musbat', async () => {
        // Revenue: 1000 kg * (1 - 0.05) * 50000 = 47,500,000
        const { period } = await createPeriodWithCompletedChickOut('PL Test 1', {
            totalWeightKg: 1000,
            wastePercent: 5,
            pricePerKg: 50000
        });

        // Add expense: 10,000,000
        const expense = await PeriodExpense.create({
            periodId: period._id,
            category: ExpenseCategory.ELECTRICITY,
            amount: 10000000,
            description: 'Elektr xarajati',
            expenseDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.expenses.push(expense._id.toString());

        // Get P&L
        const pl = await PeriodPLService.getPeriodPL(period._id.toString());

        expect(pl.periodId).toBe(period._id.toString());
        expect(pl.totalRevenue).toBe(47500000);
        expect(pl.totalExpenses).toBe(10000000);
        expect(pl.profit).toBe(37500000);  // 47,500,000 - 10,000,000
        expect(pl.isProfitable).toBe(true);
    });

    // =========================================
    // TEST 2: Revenue < Expense → profit manfiy
    // =========================================
    it('Test 2: Revenue < Expense → profit manfiy', async () => {
        // Revenue: 500 kg * (1 - 0.1) * 30000 = 13,500,000
        const { period } = await createPeriodWithCompletedChickOut('PL Test 2', {
            totalWeightKg: 500,
            wastePercent: 10,
            pricePerKg: 30000
        });

        // Add expenses: 20,000,000 (larger than revenue)
        const expense = await PeriodExpense.create({
            periodId: period._id,
            category: ExpenseCategory.LABOR_FIXED,
            amount: 20000000,
            description: 'Ish haqi',
            expenseDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.expenses.push(expense._id.toString());

        // Get P&L
        const pl = await PeriodPLService.getPeriodPL(period._id.toString());

        expect(pl.totalRevenue).toBe(13500000);
        expect(pl.totalExpenses).toBe(20000000);
        expect(pl.profit).toBe(-6500000);  // 13,500,000 - 20,000,000
        expect(pl.isProfitable).toBe(false);
    });

    // =========================================
    // TEST 3: Revenue = 0 → profit manfiy yoki 0
    // =========================================
    it('Test 3: Revenue = 0, Expense > 0 → profit manfiy', async () => {
        // Create period with NO chick outs (revenue = 0)
        const period = await PeriodService.createPeriod({
            name: 'PL Test 3 - No Revenue',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // Add expense
        const expense = await PeriodExpense.create({
            periodId: period._id,
            category: ExpenseCategory.MAINTENANCE,
            amount: 5000000,
            description: 'Ta\'mirlash',
            expenseDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.expenses.push(expense._id.toString());

        // Get P&L
        const pl = await PeriodPLService.getPeriodPL(period._id.toString());

        expect(pl.totalRevenue).toBe(0);
        expect(pl.totalExpenses).toBe(5000000);
        expect(pl.profit).toBe(-5000000);
        expect(pl.isProfitable).toBe(false);
    });

    // =========================================
    // TEST 4: Expense = 0 → profit = revenue
    // =========================================
    it('Test 4: Expense = 0 → profit = revenue', async () => {
        // Revenue: 800 kg * (1 - 0.08) * 45000 = 33,120,000
        const { period } = await createPeriodWithCompletedChickOut('PL Test 4', {
            totalWeightKg: 800,
            wastePercent: 8,
            pricePerKg: 45000
        });

        // NO expenses added

        // Get P&L
        const pl = await PeriodPLService.getPeriodPL(period._id.toString());

        expect(pl.totalRevenue).toBe(33120000);
        expect(pl.totalExpenses).toBe(0);
        expect(pl.profit).toBe(33120000);  // profit = revenue
        expect(pl.isProfitable).toBe(true);
    });

    // =========================================
    // TEST 5: INCOMPLETE ChickOut → ERROR
    // =========================================
    it('Test 5: INCOMPLETE ChickOut mavjud → P&L BLOKLANGAN', async () => {
        // Create period
        const period = await PeriodService.createPeriod({
            name: 'PL Test 5 - Incomplete',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // Create section and assign to period
        const section = await SectionService.createSection({
            name: 'PL Test 5 Section',
            createdBy: directorUserId
        });
        cleanupIds.sections.push(section._id.toString());
        await SectionService.assignPeriod(section._id.toString(), period._id.toString());

        // Create batch
        const batch = await BatchService.createBatch({
            sectionId: section._id.toString(),
            expectedEndAt: new Date(Date.now() + 86400000),
            totalChicksIn: 1000,
            createdBy: directorUserId
        });
        cleanupIds.batches.push(batch._id.toString());

        // Create INCOMPLETE chick out (NOT completed)
        const chickOut = await ChickOutService.createChickOut({
            sectionId: section._id.toString(),
            count: 500,
            vehicleNumber: 'PL-INC',
            machineNumber: 'M-INC',
            isFinal: false,
            createdBy: directorUserId
        });
        cleanupIds.chickOuts.push(chickOut._id.toString());

        // Verify status is INCOMPLETE
        expect(chickOut.status).toBe(ChickOutStatus.INCOMPLETE);

        // Try to get P&L → should throw error
        await expect(
            PeriodPLService.getPeriodPL(period._id.toString())
        ).rejects.toThrow('Davrda yakunlanmagan moliyaviy operatsiyalar mavjud.');
    });

    // =========================================
    // TEST 6: Unresolved expense incident → ERROR
    // =========================================
    it('Test 6: requiresExpense=true Incident + expenseId=null → P&L BLOKLANGAN', async () => {
        // Create period with section
        const period = await PeriodService.createPeriod({
            name: 'PL Test 6 - Unresolved Incident',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        const section = await SectionService.createSection({
            name: 'PL Test 6 Section',
            createdBy: directorUserId
        });
        cleanupIds.sections.push(section._id.toString());

        // Assign section to period (this populates period.sections array)
        await SectionService.assignPeriod(section._id.toString(), period._id.toString());

        // Reload period to get updated sections array
        const updatedPeriod = await Period.findById(period._id);

        // Create asset assigned to section
        const asset = await Asset.create({
            name: 'Test Asset PL6',
            category: AssetCategory.MOTOR,
            status: AssetStatus.ACTIVE,
            sectionId: section._id,
            createdBy: directorUserId
        });
        cleanupIds.assets.push(asset._id.toString());

        // Create incident with requiresExpense = true, NO expense attached
        const incident = await TechnicalIncident.create({
            assetId: asset._id,
            sectionId: section._id,
            reportedBy: directorUserId,
            description: 'Buzilgan uskuna',
            requiresExpense: true,
            resolved: false,
            // expenseId is null by default
        });
        cleanupIds.incidents.push(incident._id.toString());

        // Verify incident has no expense
        expect(incident.expenseId).toBeNull();
        expect(incident.requiresExpense).toBe(true);

        // Try to get P&L → should throw error
        await expect(
            PeriodPLService.getPeriodPL(period._id.toString())
        ).rejects.toThrow('Davrda yakunlanmagan moliyaviy operatsiyalar mavjud.');
    });
});
