import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../src/core/database';
import { initializeDatabase } from '../../src/utils/init.util';

// Models
import { Asset, AssetCategory } from '../../src/modules/assets/asset.model';
import { TechnicalIncident } from '../../src/modules/assets/incident.model';
import { Section } from '../../src/modules/sections/section.model';
import { User } from '../../src/modules/users/user.model';

// Services
import { AssetService } from '../../src/modules/assets/asset.service';
import { IncidentService } from '../../src/modules/assets/incident.service';
import { SectionService } from '../../src/modules/sections/section.service';

describe('Technical Incident E2E Tests', () => {
    let directorUserId: string;
    let cleanupIds: { assets: string[], sections: string[], incidents: string[] } = {
        assets: [],
        sections: [],
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
        // Cleanup
        for (const id of cleanupIds.incidents) {
            await TechnicalIncident.findByIdAndDelete(id);
        }
        for (const id of cleanupIds.assets) {
            await Asset.findByIdAndDelete(id);
        }
        for (const id of cleanupIds.sections) {
            await Section.findByIdAndDelete(id);
        }
        await disconnectDatabase();
    });

    // =========================================
    // INCIDENT CREATION TESTS
    // =========================================

    it('Test 1: Incident creation works correctly', async () => {
        // Create asset first
        const asset = await AssetService.createAsset({
            name: 'Test Motor for Incident',
            category: AssetCategory.MOTOR,
            createdBy: directorUserId
        });
        cleanupIds.assets.push(asset._id.toString());

        // Create incident
        const incident = await IncidentService.createIncident({
            assetId: asset._id.toString(),
            description: 'Motor qizib ketdi va ishlamay qoldi',
            requiresExpense: true,
            reportedBy: directorUserId
        });
        cleanupIds.incidents.push(incident._id.toString());

        expect(incident.assetId.toString()).toBe(asset._id.toString());
        expect(incident.description).toBe('Motor qizib ketdi va ishlamay qoldi');
        expect(incident.requiresExpense).toBe(true);
        expect(incident.resolved).toBe(false);  // Default
        expect(incident.sectionId).toBeNull();  // Asset has no section
    });

    it('Test 2: requiresExpense true/false is saved correctly', async () => {
        // Create asset
        const asset = await AssetService.createAsset({
            name: 'Counter for Expense Test',
            category: AssetCategory.COUNTER,
            createdBy: directorUserId
        });
        cleanupIds.assets.push(asset._id.toString());

        // Create incident with requiresExpense = false
        const incident1 = await IncidentService.createIncident({
            assetId: asset._id.toString(),
            description: 'Minor issue, no expense needed',
            requiresExpense: false,
            reportedBy: directorUserId
        });
        cleanupIds.incidents.push(incident1._id.toString());

        // Create incident with requiresExpense = true
        const incident2 = await IncidentService.createIncident({
            assetId: asset._id.toString(),
            description: 'Major issue, expense required',
            requiresExpense: true,
            reportedBy: directorUserId
        });
        cleanupIds.incidents.push(incident2._id.toString());

        expect(incident1.requiresExpense).toBe(false);
        expect(incident2.requiresExpense).toBe(true);
    });

    it('Test 3: resolved defaults to false', async () => {
        // Create asset
        const asset = await AssetService.createAsset({
            name: 'Engine for Resolved Test',
            category: AssetCategory.ENGINE,
            createdBy: directorUserId
        });
        cleanupIds.assets.push(asset._id.toString());

        // Create incident without specifying resolved
        const incident = await IncidentService.createIncident({
            assetId: asset._id.toString(),
            description: 'Engine stopped working',
            requiresExpense: false,
            reportedBy: directorUserId
        });
        cleanupIds.incidents.push(incident._id.toString());

        expect(incident.resolved).toBe(false);
    });

    // =========================================
    // FILTER TESTS
    // =========================================

    it('Test 4: Filter by asset works correctly', async () => {
        // Create 2 assets
        const asset1 = await AssetService.createAsset({
            name: 'Asset Filter Test 1',
            category: AssetCategory.MOTOR,
            createdBy: directorUserId
        });
        cleanupIds.assets.push(asset1._id.toString());

        const asset2 = await AssetService.createAsset({
            name: 'Asset Filter Test 2',
            category: AssetCategory.COUNTER,
            createdBy: directorUserId
        });
        cleanupIds.assets.push(asset2._id.toString());

        // Create incidents for asset1
        const inc1 = await IncidentService.createIncident({
            assetId: asset1._id.toString(),
            description: 'Incident for asset 1 - first',
            requiresExpense: false,
            reportedBy: directorUserId
        });
        cleanupIds.incidents.push(inc1._id.toString());

        const inc2 = await IncidentService.createIncident({
            assetId: asset1._id.toString(),
            description: 'Incident for asset 1 - second',
            requiresExpense: true,
            reportedBy: directorUserId
        });
        cleanupIds.incidents.push(inc2._id.toString());

        // Create incident for asset2
        const inc3 = await IncidentService.createIncident({
            assetId: asset2._id.toString(),
            description: 'Incident for asset 2',
            requiresExpense: false,
            reportedBy: directorUserId
        });
        cleanupIds.incidents.push(inc3._id.toString());

        // Filter by asset1
        const asset1Incidents = await IncidentService.getIncidentsByAsset(asset1._id.toString());
        expect(asset1Incidents.length).toBe(2);

        // Filter by asset2
        const asset2Incidents = await IncidentService.getIncidentsByAsset(asset2._id.toString());
        expect(asset2Incidents.length).toBe(1);
    });

    it('Test 5: Filter by section works correctly', async () => {
        // Create section
        const section = await SectionService.createSection({
            name: 'Incident Section Test',
            createdBy: directorUserId
        });
        cleanupIds.sections.push(section._id.toString());

        // Create asset with section
        const asset = await AssetService.createAsset({
            name: 'Section Asset',
            category: AssetCategory.MOTOR,
            sectionId: section._id.toString(),
            createdBy: directorUserId
        });
        cleanupIds.assets.push(asset._id.toString());

        // Create incident - sectionId should be automatically set
        const incident = await IncidentService.createIncident({
            assetId: asset._id.toString(),
            description: 'Incident in section',
            requiresExpense: false,
            reportedBy: directorUserId
        });
        cleanupIds.incidents.push(incident._id.toString());

        // Verify sectionId was set
        expect(incident.sectionId!.toString()).toBe(section._id.toString());

        // Filter by section
        const sectionIncidents = await IncidentService.getIncidentsBySection(section._id.toString());
        expect(sectionIncidents.length).toBe(1);
    });

    // =========================================
    // RESOLVE TESTS
    // =========================================

    it('Test 6: Incident resolve works correctly', async () => {
        // Create asset
        const asset = await AssetService.createAsset({
            name: 'Resolve Test Asset',
            category: AssetCategory.MOTOR,
            createdBy: directorUserId
        });
        cleanupIds.assets.push(asset._id.toString());

        // Create incident
        const incident = await IncidentService.createIncident({
            assetId: asset._id.toString(),
            description: 'Issue to be resolved',
            requiresExpense: false,
            reportedBy: directorUserId
        });
        cleanupIds.incidents.push(incident._id.toString());

        expect(incident.resolved).toBe(false);

        // Resolve incident
        const resolved = await IncidentService.resolveIncident(incident._id.toString(), true);
        expect(resolved.resolved).toBe(true);

        // Unresolve incident
        const unresolved = await IncidentService.resolveIncident(incident._id.toString(), false);
        expect(unresolved.resolved).toBe(false);
    });

    // =========================================
    // VALIDATION TESTS
    // =========================================

    it('Test 7: Incident requires valid asset', async () => {
        const fakeAssetId = new mongoose.Types.ObjectId().toString();

        await expect(
            IncidentService.createIncident({
                assetId: fakeAssetId,
                description: 'This should fail',
                requiresExpense: false,
                reportedBy: directorUserId
            })
        ).rejects.toThrow('Asset not found');
    });

    it('Test 8: Incident requires description of at least 5 characters', async () => {
        // Create asset
        const asset = await AssetService.createAsset({
            name: 'Short Desc Test',
            category: AssetCategory.MOTOR,
            createdBy: directorUserId
        });
        cleanupIds.assets.push(asset._id.toString());

        await expect(
            IncidentService.createIncident({
                assetId: asset._id.toString(),
                description: 'abc',  // Too short
                requiresExpense: false,
                reportedBy: directorUserId
            })
        ).rejects.toThrow('Description must be at least 5 characters');
    });
});
