import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../src/core/database';
import { initializeDatabase } from '../../src/utils/init.util';

// Models
import { Asset, AssetStatus, AssetCategory } from '../../src/modules/assets/asset.model';
import { AssetHistory } from '../../src/modules/assets/asset-history.model';
import { Section } from '../../src/modules/sections/section.model';
import { User } from '../../src/modules/users/user.model';
import { Period, PeriodStatus } from '../../src/modules/periods/period.model';
import { PeriodExpense, ExpenseCategory } from '../../src/modules/periods/period-expense.model';

// Services
import { AssetService } from '../../src/modules/assets/asset.service';
import { SectionService } from '../../src/modules/sections/section.service';
import { PeriodService } from '../../src/modules/periods/period.service';

describe('Asset E2E Tests', () => {
    let directorUserId: string;
    let cleanupIds: { assets: string[], sections: string[], periods: string[], expenses: string[] } = {
        assets: [],
        sections: [],
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
        // Cleanup
        for (const id of cleanupIds.expenses) {
            await PeriodExpense.findByIdAndDelete(id);
        }
        for (const id of cleanupIds.assets) {
            await Asset.findByIdAndDelete(id);
            await AssetHistory.deleteMany({ assetId: id });
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
    // ASSET CREATION TESTS
    // =========================================

    it('Test 1: Asset creation with default status = ACTIVE', async () => {
        const asset = await AssetService.createAsset({
            name: 'Motor #1',
            category: AssetCategory.MOTOR,
            createdBy: directorUserId
        });
        cleanupIds.assets.push(asset._id.toString());

        expect(asset.name).toBe('Motor #1');
        expect(asset.category).toBe(AssetCategory.MOTOR);
        expect(asset.status).toBe(AssetStatus.ACTIVE);
        expect(asset.sectionId).toBeNull();
    });

    it('Test 2: Asset with section link', async () => {
        // Create section
        const section = await SectionService.createSection({
            name: 'Test Asset Section',
            createdBy: directorUserId
        });
        cleanupIds.sections.push(section._id.toString());

        // Create asset with section
        const asset = await AssetService.createAsset({
            name: 'Elektr schyotchik A',
            category: AssetCategory.COUNTER,
            sectionId: section._id.toString(),
            createdBy: directorUserId
        });
        cleanupIds.assets.push(asset._id.toString());

        expect(asset.sectionId!.toString()).toBe(section._id.toString());
    });

    // =========================================
    // STATUS CHANGE & HISTORY TESTS
    // =========================================

    it('Test 3: Status change creates history', async () => {
        // Create asset
        const asset = await AssetService.createAsset({
            name: 'Dvizhok #5',
            category: AssetCategory.ENGINE,
            createdBy: directorUserId
        });
        cleanupIds.assets.push(asset._id.toString());

        // Change status to BROKEN
        const updated = await AssetService.updateStatus(
            asset._id.toString(),
            AssetStatus.BROKEN,
            directorUserId
        );

        expect(updated.status).toBe(AssetStatus.BROKEN);

        // Check history
        const history = await AssetService.getAssetHistory(asset._id.toString());
        expect(history.length).toBe(1);
        expect(history[0].oldStatus).toBe(AssetStatus.ACTIVE);
        expect(history[0].newStatus).toBe(AssetStatus.BROKEN);
    });

    it('Test 4: Multiple status changes create multiple history entries', async () => {
        // Create asset
        const asset = await AssetService.createAsset({
            name: 'Motor #10',
            category: AssetCategory.MOTOR,
            createdBy: directorUserId
        });
        cleanupIds.assets.push(asset._id.toString());

        // ACTIVE -> BROKEN
        await AssetService.updateStatus(asset._id.toString(), AssetStatus.BROKEN, directorUserId);

        // BROKEN -> REPAIRED
        await AssetService.updateStatus(asset._id.toString(), AssetStatus.REPAIRED, directorUserId);

        // REPAIRED -> ACTIVE
        await AssetService.updateStatus(asset._id.toString(), AssetStatus.ACTIVE, directorUserId);

        // Check history - should have 3 entries
        const history = await AssetService.getAssetHistory(asset._id.toString());
        expect(history.length).toBe(3);
    });

    // =========================================
    // QUERY TESTS
    // =========================================

    it('Test 5: Get assets by section', async () => {
        // Create section
        const section = await SectionService.createSection({
            name: 'Query Test Section',
            createdBy: directorUserId
        });
        cleanupIds.sections.push(section._id.toString());

        // Create 2 assets for this section
        const asset1 = await AssetService.createAsset({
            name: 'Section Motor 1',
            category: AssetCategory.MOTOR,
            sectionId: section._id.toString(),
            createdBy: directorUserId
        });
        cleanupIds.assets.push(asset1._id.toString());

        const asset2 = await AssetService.createAsset({
            name: 'Section Counter 1',
            category: AssetCategory.COUNTER,
            sectionId: section._id.toString(),
            createdBy: directorUserId
        });
        cleanupIds.assets.push(asset2._id.toString());

        // Query by section
        const assets = await AssetService.getAssetsBySection(section._id.toString());
        expect(assets.length).toBe(2);
    });

    // =========================================
    // LOCATION TESTS
    // =========================================

    it('Test 6: Asset location is saved and retrieved', async () => {
        const asset = await AssetService.createAsset({
            name: 'GPS Tracked Motor',
            category: AssetCategory.MOTOR,
            location: { lat: 41.3111, lng: 69.2797 },  // Tashkent coordinates
            createdBy: directorUserId
        });
        cleanupIds.assets.push(asset._id.toString());

        expect(asset.location).toBeDefined();
        expect(asset.location!.lat).toBe(41.3111);
        expect(asset.location!.lng).toBe(69.2797);

        // Fetch and verify
        const fetched = await AssetService.getAssetById(asset._id.toString());
        expect(fetched!.location!.lat).toBe(41.3111);
        expect(fetched!.location!.lng).toBe(69.2797);
    });

    it('Test 7: Asset without location defaults to null', async () => {
        const asset = await AssetService.createAsset({
            name: 'No Location Motor',
            category: AssetCategory.MOTOR,
            createdBy: directorUserId
        });
        cleanupIds.assets.push(asset._id.toString());

        expect(asset.location).toBeNull();
        expect(asset.isNewPurchase).toBe(false);
    });

    // =========================================
    // NEW PURCHASE TESTS
    // =========================================

    it('Test 8: isNewPurchase = false → no expense created', async () => {
        const asset = await AssetService.createAsset({
            name: 'Legacy Engine',
            category: AssetCategory.ENGINE,
            isNewPurchase: false,
            createdBy: directorUserId
        });
        cleanupIds.assets.push(asset._id.toString());

        expect(asset.isNewPurchase).toBe(false);
        expect(asset.purchaseCost).toBeNull();
        expect(asset.purchasePeriodId).toBeNull();

        // Verify no expense was created
        const expenses = await PeriodExpense.find({
            description: { $regex: asset.name }
        });
        expect(expenses.length).toBe(0);
    });

    it('Test 9: isNewPurchase = true without purchaseCost → ERROR', async () => {
        await expect(
            AssetService.createAsset({
                name: 'Invalid Purchase',
                category: AssetCategory.MOTOR,
                isNewPurchase: true,
                // purchaseCost missing!
                createdBy: directorUserId
            })
        ).rejects.toThrow('purchaseCost is required for new purchases');
    });

    it('Test 10: isNewPurchase = false with purchaseCost → ERROR', async () => {
        await expect(
            AssetService.createAsset({
                name: 'Legacy with Cost',
                category: AssetCategory.MOTOR,
                isNewPurchase: false,
                purchaseCost: 5000000,
                createdBy: directorUserId
            })
        ).rejects.toThrow('purchaseCost is not allowed for legacy assets');
    });

    // =========================================
    // PERIOD EXPENSE INTEGRATION TESTS
    // =========================================

    it('Test 11: Section-linked asset with ACTIVE period → expense created', async () => {
        // Create section
        const section = await SectionService.createSection({
            name: 'Period Test Section',
            createdBy: directorUserId
        });
        cleanupIds.sections.push(section._id.toString());

        // Create ACTIVE period with this section
        const period = await PeriodService.createPeriod({
            name: 'Test Period Q4',
            startDate: new Date(),
            sections: [section._id.toString()],
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // Create new purchase asset
        const asset = await AssetService.createAsset({
            name: 'New Section Motor',
            category: AssetCategory.MOTOR,
            sectionId: section._id.toString(),
            isNewPurchase: true,
            purchaseCost: 2500000,
            createdBy: directorUserId
        });
        cleanupIds.assets.push(asset._id.toString());

        expect(asset.isNewPurchase).toBe(true);
        expect(asset.purchaseCost).toBe(2500000);
        expect(asset.purchasePeriodId!.toString()).toBe(period._id.toString());

        // Verify expense was created
        const expense = await PeriodExpense.findOne({
            periodId: period._id,
            category: ExpenseCategory.ASSET_PURCHASE,
            description: { $regex: 'New Section Motor' }
        });
        expect(expense).not.toBeNull();
        expect(expense!.amount).toBe(2500000);
        cleanupIds.expenses.push(expense!._id.toString());
    });

    it('Test 12: Unassigned asset without periodId → ERROR', async () => {
        await expect(
            AssetService.createAsset({
                name: 'Orphan Asset',
                category: AssetCategory.MOTOR,
                // No sectionId
                isNewPurchase: true,
                purchaseCost: 1000000,
                // No periodId!
                createdBy: directorUserId
            })
        ).rejects.toThrow('periodId is required for assets without section');
    });

    it('Test 13: Unassigned asset with periodId → expense created', async () => {
        // Create ACTIVE period
        const period = await PeriodService.createPeriod({
            name: 'General Expense Period',
            startDate: new Date(),
            createdBy: directorUserId
        });
        cleanupIds.periods.push(period._id.toString());

        // Create unassigned new purchase asset
        const asset = await AssetService.createAsset({
            name: 'General Factory Camera',
            category: AssetCategory.OTHER,
            isNewPurchase: true,
            purchaseCost: 800000,
            periodId: period._id.toString(),
            createdBy: directorUserId
        });
        cleanupIds.assets.push(asset._id.toString());

        expect(asset.isNewPurchase).toBe(true);
        expect(asset.purchaseCost).toBe(800000);
        expect(asset.purchasePeriodId!.toString()).toBe(period._id.toString());

        // Verify expense was created
        const expense = await PeriodExpense.findOne({
            periodId: period._id,
            category: ExpenseCategory.ASSET_PURCHASE
        });
        expect(expense).not.toBeNull();
        expect(expense!.amount).toBe(800000);
        cleanupIds.expenses.push(expense!._id.toString());
    });

    it('Test 14: Section-linked asset without ACTIVE period → no expense (no error)', async () => {
        // Create section without any period
        const section = await SectionService.createSection({
            name: 'Orphan Section',
            createdBy: directorUserId
        });
        cleanupIds.sections.push(section._id.toString());

        // Create new purchase asset - should not throw error
        const asset = await AssetService.createAsset({
            name: 'Motor Without Period',
            category: AssetCategory.MOTOR,
            sectionId: section._id.toString(),
            isNewPurchase: true,
            purchaseCost: 1500000,
            createdBy: directorUserId
        });
        cleanupIds.assets.push(asset._id.toString());

        expect(asset.isNewPurchase).toBe(true);
        expect(asset.purchaseCost).toBe(1500000);
        expect(asset.purchasePeriodId).toBeNull();  // No period found

        // Verify NO expense was created
        const expenses = await PeriodExpense.find({
            description: { $regex: 'Motor Without Period' }
        });
        expect(expenses.length).toBe(0);
    });
});

