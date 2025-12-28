import { Section, SectionStatus, ISection } from './section.model';
import { User } from '../users/user.model';
import { emitSectionCreated, emitSectionUpdated, emitSectionAssigned, emitSectionClosed } from '../../realtime/events';
import { Types } from 'mongoose';

interface CreateSectionData {
    name: string;
    expectedEndDate?: string | null;
    assignedWorkers?: string[];
    createdBy: string;
}

interface UpdateSectionData {
    name?: string;
    status?: SectionStatus;
    chickArrivalDate?: string | null;
    expectedEndDate?: string | null;
    assignedWorkers?: string[];
    isArchived?: boolean;
}

export class SectionService {
    static async createSection(data: CreateSectionData): Promise<ISection> {
        const section = new Section({
            name: data.name,
            expectedEndDate: data.expectedEndDate ? new Date(data.expectedEndDate) : null,
            assignedWorkers: data.assignedWorkers || [],
            createdBy: data.createdBy,
            status: SectionStatus.EMPTY,
        });

        await section.save();
        await section.populate('assignedWorkers', 'fullName username');

        emitSectionCreated(section);

        return section;
    }

    static async updateSection(id: string, data: UpdateSectionData): Promise<ISection> {
        const section = await Section.findById(id);
        if (!section) {
            throw new Error('Section not found');
        }

        if (data.name) section.name = data.name;

        // STRICT RULE: Section cannot be ACTIVE without an ACTIVE period
        if (data.status === SectionStatus.ACTIVE) {
            if (!section.activePeriodId) {
                throw new Error('Section cannot be activated without an active period');
            }
            const { Period, PeriodStatus } = await import('../periods/period.model');
            const period = await Period.findById(section.activePeriodId);
            if (!period || period.status !== PeriodStatus.ACTIVE) {
                throw new Error('Section cannot be activated with closed period');
            }
        }

        if (data.status) section.status = data.status;
        if (data.chickArrivalDate !== undefined) section.chickArrivalDate = data.chickArrivalDate ? new Date(data.chickArrivalDate) : null;
        if (data.expectedEndDate !== undefined) section.expectedEndDate = data.expectedEndDate ? new Date(data.expectedEndDate) : null;
        if (data.assignedWorkers) section.assignedWorkers = data.assignedWorkers.map(id => new Types.ObjectId(id));
        if (data.isArchived !== undefined) section.isArchived = data.isArchived;

        await section.save();
        await section.populate('assignedWorkers', 'fullName username');

        emitSectionUpdated(section);

        return section;
    }

    static async assignWorkers(id: string, workerIds: string[]): Promise<ISection> {
        const section = await Section.findById(id);
        if (!section) {
            throw new Error('Section not found');
        }

        // Verify users exist
        const count = await User.countDocuments({ _id: { $in: workerIds } });
        if (count !== workerIds.length) {
            throw new Error('One or more invalid worker IDs');
        }

        section.assignedWorkers = workerIds.map(id => new Types.ObjectId(id));
        await section.save();
        await section.populate('assignedWorkers', 'fullName username');

        emitSectionAssigned(section);
        // Also emit update as assignment is an update
        emitSectionUpdated(section);

        return section;
    }

    static async closeSection(id: string): Promise<ISection> {
        const section = await Section.findById(id);
        if (!section) {
            throw new Error('Section not found');
        }

        section.status = SectionStatus.CLEANING;
        section.closedAt = new Date();

        await section.save();
        await section.populate('assignedWorkers', 'fullName username');

        emitSectionClosed(section);
        emitSectionUpdated(section);

        return section;
    }

    static async getSectionById(id: string): Promise<ISection | null> {
        return Section.findById(id).populate('assignedWorkers', 'fullName username role');
    }

    static async getAllSections(filter: any = {}): Promise<ISection[]> {
        return Section.find(filter)
            .sort({ createdAt: -1 })
            .populate('assignedWorkers', 'fullName username')
            .populate('activePeriodId', 'name status');
    }

    /**
     * Assign a section to a period
     * Requires Period Status: ACTIVE
     */
    static async assignPeriod(sectionId: string, periodId: string): Promise<ISection> {
        const section = await Section.findById(sectionId);
        if (!section) {
            throw new Error('Section not found');
        }

        // Import dynamically to avoid circular dependency if any (though currently Period doesn't import SectionService)
        const { Period, PeriodStatus } = await import('../periods/period.model');

        const period = await Period.findById(periodId);
        if (!period) {
            throw new Error('Period not found');
        }

        if (period.status !== PeriodStatus.ACTIVE) {
            throw new Error('Cannot assign section to a CLOSED period');
        }

        section.activePeriodId = new Types.ObjectId(periodId);
        await section.save();

        emitSectionUpdated(section); // Notify frontend about change

        return section;
    }

    /**
     * Unassign section from any period
     */
    static async unassignPeriod(sectionId: string): Promise<ISection> {
        const section = await Section.findById(sectionId);
        if (!section) {
            throw new Error('Section not found');
        }

        section.activePeriodId = undefined; // Remove field or set to null
        await section.save();

        emitSectionUpdated(section);

        return section;
    }
}
