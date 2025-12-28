import { TechnicalIncident, ITechnicalIncident } from './incident.model';
import { Asset } from './asset.model';

interface CreateIncidentData {
    assetId: string;
    description: string;
    requiresExpense: boolean;
    reportedBy: string;
    linkedPeriodId?: string;
}

interface IncidentFilter {
    resolved?: boolean;
}

/**
 * Technical Incident Service
 * Texnik nosozliklarni boshqarish
 */
export class IncidentService {
    /**
     * Create new incident
     * Asset mavjud bo'lishi shart
     * SectionId asset'dan avtomatik olinadi
     */
    static async createIncident(data: CreateIncidentData): Promise<ITechnicalIncident> {
        // Validate asset exists
        const asset = await Asset.findById(data.assetId);
        if (!asset) {
            throw new Error('Asset not found');
        }

        // Validate description
        if (!data.description || data.description.trim().length < 5) {
            throw new Error('Description must be at least 5 characters');
        }

        // Create incident
        const incident = new TechnicalIncident({
            assetId: data.assetId,
            sectionId: asset.sectionId || null,  // Asset'dan olinadi
            reportedBy: data.reportedBy,
            description: data.description.trim(),
            requiresExpense: data.requiresExpense ?? false,
            resolved: false,  // Default false
            linkedPeriodId: data.linkedPeriodId || null,
        });

        await incident.save();
        return incident;
    }

    /**
     * Get incident by ID
     */
    static async getIncidentById(incidentId: string): Promise<ITechnicalIncident | null> {
        return TechnicalIncident.findById(incidentId)
            .populate('assetId', 'name category status')
            .populate('sectionId', 'name status')
            .populate('reportedBy', 'fullName username');
    }

    /**
     * Get all incidents with optional filter
     */
    static async getAllIncidents(filter?: IncidentFilter): Promise<ITechnicalIncident[]> {
        const query: any = {};

        if (filter?.resolved !== undefined) {
            query.resolved = filter.resolved;
        }

        return TechnicalIncident.find(query)
            .populate('assetId', 'name category status')
            .populate('sectionId', 'name status')
            .populate('reportedBy', 'fullName username')
            .sort({ createdAt: -1 });
    }

    /**
     * Get incidents by asset
     */
    static async getIncidentsByAsset(assetId: string, filter?: IncidentFilter): Promise<ITechnicalIncident[]> {
        const query: any = { assetId };

        if (filter?.resolved !== undefined) {
            query.resolved = filter.resolved;
        }

        return TechnicalIncident.find(query)
            .populate('assetId', 'name category status')
            .populate('sectionId', 'name status')
            .populate('reportedBy', 'fullName username')
            .sort({ createdAt: -1 });
    }

    /**
     * Get incidents by section
     */
    static async getIncidentsBySection(sectionId: string, filter?: IncidentFilter): Promise<ITechnicalIncident[]> {
        const query: any = { sectionId };

        if (filter?.resolved !== undefined) {
            query.resolved = filter.resolved;
        }

        return TechnicalIncident.find(query)
            .populate('assetId', 'name category status')
            .populate('sectionId', 'name status')
            .populate('reportedBy', 'fullName username')
            .sort({ createdAt: -1 });
    }

    /**
     * Update incident resolved status
     */
    static async resolveIncident(incidentId: string, resolved: boolean): Promise<ITechnicalIncident> {
        const incident = await TechnicalIncident.findById(incidentId);
        if (!incident) {
            throw new Error('Incident not found');
        }

        incident.resolved = resolved;
        await incident.save();

        return incident;
    }

    /**
     * Get unresolved incidents count
     */
    static async getUnresolvedCount(): Promise<number> {
        return TechnicalIncident.countDocuments({ resolved: false });
    }

    /**
     * Get unresolved incidents count by section
     */
    static async getUnresolvedCountBySection(sectionId: string): Promise<number> {
        return TechnicalIncident.countDocuments({ sectionId, resolved: false });
    }
}
