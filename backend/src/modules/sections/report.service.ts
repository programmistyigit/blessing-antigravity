import { SectionDailyReport, ISectionDailyReport } from './report.model';
import { Section, SectionStatus } from './section.model';
import { Batch } from './batch.model';
import { SectionReportAudit } from './report-audit.model';
import { DailyBalanceService } from './daily-balance.service';
import { emitDailyReportCreated, emitDailyReportUpdated } from '../../realtime/events';
import { IUser, User } from '../users/user.model';
import { Permission } from '../permissions/permission.enum';

/**
 * Create Report Data - faqat jo'ja holati
 */
interface CreateReportData {
    sectionId: string;
    date: string;
    deaths: number;
    avgWeight: number;
    medicines?: { name: string; dose: string }[];
    note?: string;
    createdBy: string;
}

/**
 * Update Report Data
 */
interface UpdateReportData {
    deaths?: number;
    avgWeight?: number;
    medicines?: { name: string; dose: string }[];
    note?: string;
}

export class ReportService {
    static async createReport(data: CreateReportData, user: IUser): Promise<ISectionDailyReport> {
        const section = await Section.findById(data.sectionId);
        if (!section) {
            throw new Error('Section not found');
        }

        // Business Logic: Report only allowed in ACTIVE status
        if (section.status !== SectionStatus.ACTIVE && section.status !== SectionStatus.PARTIAL_OUT) {
            throw new Error('Reports can only be created for ACTIVE or PARTIAL_OUT sections');
        }

        // Check assignment - only assigned workers or SYSTEM_ALL can create
        const isAssigned = section.assignedWorkers.some(workerId => workerId.toString() === user._id.toString());

        if (!isAssigned) {
            const userWithRole = await User.findById(user._id).populate('role');
            const permissions: string[] = (userWithRole?.role as any)?.permissions || [];

            if (!permissions.includes(Permission.SYSTEM_ALL)) {
                throw new Error('You are not assigned to this section');
            }
        }

        // Normalize date to start of day
        const dateValues = new Date(data.date);
        const startOfDay = new Date(dateValues);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(dateValues);
        endOfDay.setUTCHours(23, 59, 59, 999);

        // Require active batch
        if (!section.activeBatchId) {
            throw new Error('Section does not have an active batch');
        }

        // Check for duplicate date
        const existingReport = await SectionDailyReport.findOne({
            batchId: section.activeBatchId,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        if (existingReport) {
            throw new Error('Report for this date already exists');
        }

        const report = new SectionDailyReport({
            batchId: section.activeBatchId,
            date: startOfDay,
            deaths: data.deaths,
            avgWeight: data.avgWeight,
            medicines: data.medicines || [],
            notes: data.note || '',
            createdBy: data.createdBy,
        });

        await report.save();

        // Update daily balance with deaths
        if (data.deaths > 0 && section.activeBatchId) {
            await DailyBalanceService.updateDeaths(
                section.activeBatchId.toString(),
                report.date,
                data.deaths
            );
        }

        emitDailyReportCreated(report);

        return report;
    }

    static async updateReport(id: string, data: UpdateReportData, userId: string): Promise<ISectionDailyReport> {
        const report = await SectionDailyReport.findById(id);
        if (!report) {
            throw new Error('Report not found');
        }

        // Get section via batch
        const batch = await Batch.findById(report.batchId);
        if (!batch) {
            throw new Error('Batch not found for this report');
        }
        const section = await Section.findById(batch.sectionId);
        if (section && section.status === SectionStatus.CLEANING) {
            throw new Error('Cannot update report for a CLEANING section');
        }

        // Create Audit Log
        const previousValues: Record<string, any> = {};
        const newValues: Record<string, any> = {};
        let hasChanges = false;

        if (data.deaths !== undefined && data.deaths !== report.deaths) {
            previousValues.deaths = report.deaths;
            newValues.deaths = data.deaths;
            report.deaths = data.deaths;
            hasChanges = true;
        }
        if (data.avgWeight !== undefined && data.avgWeight !== report.avgWeight) {
            previousValues.avgWeight = report.avgWeight;
            newValues.avgWeight = data.avgWeight;
            report.avgWeight = data.avgWeight;
            hasChanges = true;
        }
        if (data.note !== undefined && data.note !== report.notes) {
            previousValues.notes = report.notes;
            newValues.notes = data.note;
            report.notes = data.note;
            hasChanges = true;
        }
        if (data.medicines !== undefined) {
            previousValues.medicines = report.medicines;
            newValues.medicines = data.medicines;
            report.medicines = data.medicines as any;
            hasChanges = true;
        }

        if (hasChanges) {
            await report.save();

            await SectionReportAudit.create({
                reportId: report._id,
                sectionId: report.batchId,
                changedBy: userId,
                previousValues,
                newValues,
            });

            emitDailyReportUpdated(report);
        }

        return report;
    }

    static async getReportsBySectionId(sectionId: string): Promise<ISectionDailyReport[]> {
        // Reports are stored by batchId - find all batches for this section
        const batches = await Batch.find({ sectionId });
        const batchIds = batches.map(b => b._id);

        if (batchIds.length === 0) {
            return [];
        }

        return SectionDailyReport.find({ batchId: { $in: batchIds } }).sort({ date: -1 });
    }

    static async getReportsByBatchId(batchId: string): Promise<ISectionDailyReport[]> {
        return SectionDailyReport.find({ batchId }).sort({ date: -1 });
    }
}
