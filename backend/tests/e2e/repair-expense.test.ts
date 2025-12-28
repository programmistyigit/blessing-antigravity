import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../src/core/database';
import { initializeDatabase } from '../../src/utils/init.util';

// Models
import { Asset, AssetCategory } from '../../src/modules/assets/asset.model';
import { TechnicalIncident } from '../../src/modules/assets/incident.model';
import { Section } from '../../src/modules/sections/section.model';
import { User } from '../../src/modules/users/user.model';
import { Period, PeriodStatus } from '../../src/modules/periods/period.model';
import { PeriodExpense, ExpenseCategory } from '../../src/modules/periods/period-expense.model';

// Services
import { AssetService } from '../../src/modules/assets/asset.service';
import { IncidentService } from '../../src/modules/assets/incident.service';
import { RepairExpenseService } from '../../src/modules/assets/repair-expense.service';
import { SectionService } from '../../src/modules/sections/section.service';
import { PeriodService } from '../../src/modules/periods/period.service';

describe('Repair Expense E2E Tests', () => {
    let directorUserId: string;
    let cleanupIds: {
        assets: string[],
        sections: string[],
        incidents: string[],
        periods: string[],
        expenses: string[]
    } = {
        assets: [],
        sections: [],
        incidents: [],
        periods: [],
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
        for (const id of cleanupIds.incidents) {
            await TechnicalIncident.findByIdAndDelete(id);
        }
        for (const id of cleanupIds.assets) {
            await Asset.findByIdAndDelete(id);
        }
        for (const id of cleanupIds.periods) {
            await Period.findByIdAndDelete(id);
        }
        for (const id of cleanupIds.sections) {
            await Section.findByIdAndDelete(id);
        }
        await disconnectDatabase();
    });

    // =========================================
    // VALIDATION TESTS
    // =========================================

    it('Test 1: requiresExpense = false → cannot create expense', async () => {
        // Create asset
        const asset = await AssetService.createAsset({
            name: 'Motor No Expense',
            category: AssetCategory.MOTOR,
            createdBy: directorUserId
        });
        cleanupIds.assets.push(asset._id.toString());

        // Create incident with requiresExpense = false
        const incident = await IncidentService.createIncident({
            assetId: asset._id.toString(),
            description: 'Minor issue, no expense needed',
            requiresExpense: false,
            reportedBy: directorUserId
        });
        cleanupIds.incidents.push(incident._id.toString());

        // Try to create expense → should fail
        await expect(
            RepairExpenseService.createRepairExpense({
                incidentId: incident._id.toString(),
                amount: 100000,
                description: 'Should not be allowed',
                createdBy: directorUserId
            })
        ).rejects.toThrow('This incident does not require expense (requiresExpense = false)');
    });

    it('Test 2: Expense is created successfully', async () => {
        // Create section
        const section = await SectionService.createSection({
            name: 'Repair Expense Section',
            createdBy: directorUserId
        });
        cleanupIds.sections.push(section._id.toString());

        // Create period and assign section
        const period = await PeriodService.createPeriod({
            name: 'Repair Expense Period',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());
        await SectionService.assignPeriod(section._id.toString(), period._id.toString());

        // Create asset in section
        const asset = await AssetService.createAsset({
            name: 'Motor with Expense',
            category: AssetCategory.MOTOR,
            sectionId: section._id.toString(),
            createdBy: directorUserId
        });
        cleanupIds.assets.push(asset._id.toString());

        // Create incident with requiresExpense = true
        const incident = await IncidentService.createIncident({
            assetId: asset._id.toString(),
            description: 'Motor broken, needs repair',
            requiresExpense: true,
            reportedBy: directorUserId
        });
        cleanupIds.incidents.push(incident._id.toString());

        // Create expense
        const result = await RepairExpenseService.createRepairExpense({
            incidentId: incident._id.toString(),
            amount: 500000,
            description: 'Motor repair cost',
            createdBy: directorUserId
        });
        cleanupIds.expenses.push(result.expense._id.toString());

        expect(result.expense.category).toBe(ExpenseCategory.ASSET_REPAIR);
        expect(result.expense.amount).toBe(500000);
        expect(result.expense.incidentId.toString()).toBe(incident._id.toString());
        expect(result.expense.periodId.toString()).toBe(period._id.toString());
        expect(result.incident.resolved).toBe(true);
        expect(result.incident.expenseId.toString()).toBe(result.expense._id.toString());
    });

    it('Test 3: Cannot create expense twice for same incident', async () => {
        // Create asset
        const asset = await AssetService.createAsset({
            name: 'Double Expense Test',
            category: AssetCategory.COUNTER,
            createdBy: directorUserId
        });
        cleanupIds.assets.push(asset._id.toString());

        // Create period for sectionless asset
        const period = await PeriodService.createPeriod({
            name: 'Double Expense Period',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // Create incident
        const incident = await IncidentService.createIncident({
            assetId: asset._id.toString(),
            description: 'Issue needing expense',
            requiresExpense: true,
            reportedBy: directorUserId
        });
        cleanupIds.incidents.push(incident._id.toString());

        // First expense → should succeed
        const result = await RepairExpenseService.createRepairExpense({
            incidentId: incident._id.toString(),
            amount: 200000,
            description: 'First expense',
            periodId: period._id.toString(),
            createdBy: directorUserId
        });
        cleanupIds.expenses.push(result.expense._id.toString());

        // Second expense → should fail
        await expect(
            RepairExpenseService.createRepairExpense({
                incidentId: incident._id.toString(),
                amount: 100000,
                description: 'Second expense attempt',
                periodId: period._id.toString(),
                createdBy: directorUserId
            })
        ).rejects.toThrow('This incident already has an expense attached');
    });

    it('Test 4: Section asset → ACTIVE period is auto-detected', async () => {
        // Create section
        const section = await SectionService.createSection({
            name: 'Auto Period Section',
            createdBy: directorUserId
        });
        cleanupIds.sections.push(section._id.toString());

        // Create period and assign section
        const period = await PeriodService.createPeriod({
            name: 'Auto Period',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());
        await SectionService.assignPeriod(section._id.toString(), period._id.toString());

        // Create asset in section
        const asset = await AssetService.createAsset({
            name: 'Section Asset',
            category: AssetCategory.ENGINE,
            sectionId: section._id.toString(),
            createdBy: directorUserId
        });
        cleanupIds.assets.push(asset._id.toString());

        // Create incident
        const incident = await IncidentService.createIncident({
            assetId: asset._id.toString(),
            description: 'Engine needs repair',
            requiresExpense: true,
            reportedBy: directorUserId
        });
        cleanupIds.incidents.push(incident._id.toString());

        // Create expense WITHOUT periodId → should auto-detect
        const result = await RepairExpenseService.createRepairExpense({
            incidentId: incident._id.toString(),
            amount: 1000000,
            description: 'Engine repair',
            createdBy: directorUserId  // No periodId!
        });
        cleanupIds.expenses.push(result.expense._id.toString());

        expect(result.expense.periodId.toString()).toBe(period._id.toString());
    });

    it('Test 5: Sectionless asset without periodId → error', async () => {
        // Create asset without section
        const asset = await AssetService.createAsset({
            name: 'No Section Asset',
            category: AssetCategory.OTHER,
            createdBy: directorUserId
        });
        cleanupIds.assets.push(asset._id.toString());

        // Create incident
        const incident = await IncidentService.createIncident({
            assetId: asset._id.toString(),
            description: 'Issue needing expense',
            requiresExpense: true,
            reportedBy: directorUserId
        });
        cleanupIds.incidents.push(incident._id.toString());

        // Try to create expense without periodId → should fail
        await expect(
            RepairExpenseService.createRepairExpense({
                incidentId: incident._id.toString(),
                amount: 300000,
                description: 'Repair cost',
                createdBy: directorUserId  // No periodId!
            })
        ).rejects.toThrow('periodId is required for assets without section');
    });

    it('Test 6: Expense creation marks incident as resolved', async () => {
        // Create period
        const period = await PeriodService.createPeriod({
            name: 'Resolved Test Period',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // Create asset
        const asset = await AssetService.createAsset({
            name: 'Resolved Test Asset',
            category: AssetCategory.MOTOR,
            createdBy: directorUserId
        });
        cleanupIds.assets.push(asset._id.toString());

        // Create incident
        const incident = await IncidentService.createIncident({
            assetId: asset._id.toString(),
            description: 'Issue to be resolved',
            requiresExpense: true,
            reportedBy: directorUserId
        });
        cleanupIds.incidents.push(incident._id.toString());

        // Check incident is not resolved
        const beforeExpense = await TechnicalIncident.findById(incident._id);
        expect(beforeExpense?.resolved).toBe(false);
        expect(beforeExpense?.expenseId).toBeNull();

        // Create expense
        const result = await RepairExpenseService.createRepairExpense({
            incidentId: incident._id.toString(),
            amount: 150000,
            description: 'Repair done',
            periodId: period._id.toString(),
            createdBy: directorUserId
        });
        cleanupIds.expenses.push(result.expense._id.toString());

        // Check incident is now resolved
        const afterExpense = await TechnicalIncident.findById(incident._id);
        expect(afterExpense?.resolved).toBe(true);
        expect(afterExpense?.expenseId?.toString()).toBe(result.expense._id.toString());
    });
});
