import { SectionDailyReport, ISectionDailyReport } from './report.model';
import { Section, SectionStatus } from './section.model';
import { Batch } from './batch.model';
import { SectionReportAudit } from './report-audit.model';
import { DailyBalanceService } from './daily-balance.service';
import { emitDailyReportCreated, emitDailyReportUpdated } from '../../realtime/events';
import { IUser, User } from '../users/user.model';
import { Permission } from '../permissions/permission.enum';
import { UtilityExpenseService } from '../periods/utility-expense.service';


interface CreateReportData {
    sectionId: string;
    date: string;
    avgWeight: number;
    totalWeight: number;
    deaths: number;
    feedUsedKg: number;
    waterUsedLiters: number;
    electricityUsedKwh: number;
    medicines?: { name: string; dose: string }[];
    note?: string;
    createdBy: string;
}

interface UpdateReportData {
    avgWeight?: number;
    totalWeight?: number;
    deaths?: number;
    feedUsedKg?: number;
    waterUsedLiters?: number;
    electricityUsedKwh?: number;
    medicines?: { name: string; dose: string }[];
    note?: string;
}

export class ReportService {
    static async createReport(data: CreateReportData, user: IUser): Promise<ISectionDailyReport> {
        const section = await Section.findById(data.sectionId);
        if (!section) {
            throw new Error('Section not found');
        }

        // Business Logic: Report only allowed in ACTIVE status (unless maybe director overrides? Rule says "Section ACTIVE bo‘lmasdan report kiritilmaydi")
        // "Section ACTIVE bo‘lmasdan report kiritilmaydi" -> No report if not ACTIVE.
        if (section.status !== SectionStatus.ACTIVE && section.status !== SectionStatus.PARTIAL_OUT) {
            throw new Error('Reports can only be created for ACTIVE or PARTIAL_OUT sections');
        }

        // Business Logic: Check assignment
        // "Faqat sectionga biriktirilgan hodim report kirita oladi"
        // "Director SYSTEM_ALL bilan hammasini qila oladi"
        // We need to check if user has SYSTEM_ALL permission OR is in assignedWorkers
        const isAssigned = section.assignedWorkers.some(workerId => workerId.toString() === user._id.toString());
        // For permission check, we assume user object has populated role... wait, user object from request usually has role ID not populated permissions.
        // We can rely on a helper or check if user.role is just ID.
        // Usually, the `user` object passed here comes from `req.user` which might be just payload. 
        // Let's assume the controller passes the full user or checks permissions.
        // BUT the requirement is specific: "Director SYSTEM_ALL bilan hammasini qila oladi"

        // I'll assume the controller handles the `System All` bypass OR passes an extracted permission set.
        // However, to be safe and robust, let's implement the check here if we can.
        // Simple check: if NOT assigned AND NOT generic admin, fail.
        // But `user` here might be just deserialized JWT payload (depends on auth).
        // Let's look at `User` interface in `user.model.ts` again. It has `role` as ObjectId.
        // I will assume the controller guarantees the user is authorized to ATTEMPT this, but the specific "Assigned" check is business logic.

        // If I can't check permissions easily here without fetching Role, I will fetch it if I have to.
        // But better: Use a helper `PermissionService` or similar?
        // Let's assume `user` passed to this function is the Mongoose document? 
        // `user.model.ts` says `role` is `Types.ObjectId`.

        // Let's re-read the request: "Director SYSTEM_ALL bilan hammasini qila oladi".
        // If I skip this check here, any SECTION_DAILY_REPORT_CREATE user could create report for ANY section. That's bad.
        // So I MUST check assignment.

        // Strategy:
        // 1. Check if user is assigned. If yes, proceed.
        // 2. If not assigned, checking if they are Director/Admin is harder without role populated.
        // 3. I will fetch the user with role populated validation if not assigned.

        if (!isAssigned) {
            // We need to check if they have SYSTEM_ALL.
            // Fetch user with role to check permissions? 
            // Or maybe `user` argument is already populated? 
            // Let's assume we need to fetch to be sure if we want to enforce this rule strictly here.
            // OR, we can rely on the fact that if they are NOT assigned, they MUST have SYSTEM_ALL to proceed.
            const userWithRole = await User.findById(user._id).populate('role');
            const permissions: string[] = (userWithRole?.role as any)?.permissions || [];

            if (!permissions.includes(Permission.SYSTEM_ALL)) {
                throw new Error('You are not assigned to this section');
            }
        }

        // Check for duplicate date
        const dateValues = new Date(data.date);
        // Normalize date to start of day for comparison?
        // Requirement: "Har bir section uchun 1 kunda faqat 1 report"
        // "date: Date (unique per section)"
        // If I store exact ISO string, uniqueness depends on exact time.
        // Usually daily reports are for a "Day".
        // I should probably normalize to YYYY-MM-DD or 00:00:00.
        // Let's normalize data.date to start of day to ensure uniqueness works for "Day"
        const startOfDay = new Date(dateValues);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(dateValues);
        endOfDay.setUTCHours(23, 59, 59, 999);

        // Require active batch for duplicate check
        if (!section.activeBatchId) {
            throw new Error('Section does not have an active batch');
        }

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
            batchId: section.activeBatchId,  // Use batchId, not sectionId
            date: dateValues,
            avgWeight: data.avgWeight,
            totalWeight: data.totalWeight,
            deaths: data.deaths,
            feedUsedKg: data.feedUsedKg,
            waterUsedLiters: data.waterUsedLiters,
            electricityUsedKwh: data.electricityUsedKwh,
            medicines: data.medicines || [],
            notes: data.note || '',
            createdBy: data.createdBy,
        });
        // Normalize date for storage to guarantee database uniqueness constraint works
        report.date = startOfDay;

        await report.save();

        // Update daily balance with deaths
        if (data.deaths > 0 && section.activeBatchId) {
            await DailyBalanceService.updateDeaths(
                section.activeBatchId.toString(),
                report.date,
                data.deaths
            );
        }

        // === UTILITY EXPENSES (WATER, ELECTRICITY → PeriodExpense) ===
        // Bu resurslar Inventory'ga TEGMAYDI, to'g'ridan-to'g'ri xarajat sifatida yoziladi
        const periodId = section.activePeriodId?.toString();
        if (periodId) {
            // WATER expense
            if (data.waterUsedLiters > 0) {
                try {
                    await UtilityExpenseService.createWaterExpense({
                        periodId,
                        sectionId: data.sectionId,
                        quantity: data.waterUsedLiters,
                        expenseDate: report.date,
                        dailyReportId: report._id.toString(),
                        createdBy: data.createdBy
                    });
                } catch (err) {
                    // Log but don't fail report creation
                    console.warn('Failed to create WATER expense:', err);
                }
            }

            // ELECTRICITY expense
            if (data.electricityUsedKwh > 0) {
                try {
                    await UtilityExpenseService.createElectricityExpense({
                        periodId,
                        sectionId: data.sectionId,
                        quantity: data.electricityUsedKwh,
                        expenseDate: report.date,
                        dailyReportId: report._id.toString(),
                        createdBy: data.createdBy
                    });
                } catch (err) {
                    // Log but don't fail report creation
                    console.warn('Failed to create ELECTRICITY expense:', err);
                }
            }
        }

        emitDailyReportCreated(report);

        return report;
    }

    static async updateReport(id: string, data: UpdateReportData, userId: string): Promise<ISectionDailyReport> {
        const report = await SectionDailyReport.findById(id);
        if (!report) {
            throw new Error('Report not found');
        }

        // Get section via batch (report has batchId, not sectionId)
        const batch = await Batch.findById(report.batchId);
        if (!batch) {
            throw new Error('Batch not found for this report');
        }
        const section = await Section.findById(batch.sectionId);
        if (section && section.status === SectionStatus.CLEANING) {
            throw new Error('Cannot update report for a CLEANING section');
        }

        // Create Audit Log
        // "Update bo‘lsa oldingi qiymatlar audit logga yoziladi"
        // Collect old values for changed fields
        const previousValues: Record<string, any> = {};
        const newValues: Record<string, any> = {};
        let hasChanges = false;

        if (data.avgWeight !== undefined && data.avgWeight !== report.avgWeight) {
            previousValues.avgWeight = report.avgWeight;
            newValues.avgWeight = data.avgWeight;
            report.avgWeight = data.avgWeight;
            hasChanges = true;
        }
        if (data.totalWeight !== undefined && data.totalWeight !== report.totalWeight) {
            previousValues.totalWeight = report.totalWeight;
            newValues.totalWeight = data.totalWeight;
            report.totalWeight = data.totalWeight;
            hasChanges = true;
        }
        // ... (Repeat for others)
        if (data.deaths !== undefined && data.deaths !== report.deaths) {
            previousValues.deaths = report.deaths;
            newValues.deaths = data.deaths;
            report.deaths = data.deaths;
            hasChanges = true;
        }
        if (data.feedUsedKg !== undefined && data.feedUsedKg !== report.feedUsedKg) {
            previousValues.feedUsedKg = report.feedUsedKg;
            newValues.feedUsedKg = data.feedUsedKg;
            report.feedUsedKg = data.feedUsedKg;
            hasChanges = true;
        }
        if (data.waterUsedLiters !== undefined && data.waterUsedLiters !== report.waterUsedLiters) {
            previousValues.waterUsedLiters = report.waterUsedLiters;
            newValues.waterUsedLiters = data.waterUsedLiters;
            report.waterUsedLiters = data.waterUsedLiters;
            hasChanges = true;
        }
        if (data.electricityUsedKwh !== undefined && data.electricityUsedKwh !== report.electricityUsedKwh) {
            previousValues.electricityUsedKwh = report.electricityUsedKwh;
            newValues.electricityUsedKwh = data.electricityUsedKwh;
            report.electricityUsedKwh = data.electricityUsedKwh;
            hasChanges = true;
        }
        if (data.note !== undefined && data.note !== report.notes) {
            previousValues.notes = report.notes;
            newValues.notes = data.note;
            report.notes = data.note;
            hasChanges = true;
        }
        if (data.medicines !== undefined) {
            // Deep compare? Simplified: Just overwrite if provided and log old
            previousValues.medicines = report.medicines;
            newValues.medicines = data.medicines;
            report.medicines = data.medicines as any;
            hasChanges = true;
        }

        if (hasChanges) {
            await report.save();

            // Save Audit (use batchId for sectionId field - legacy naming)
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
        // Reports are stored by batchId, not sectionId
        // Find all batches for this section and get their reports
        const batches = await Batch.find({ sectionId });
        const batchIds = batches.map(b => b._id);

        if (batchIds.length === 0) {
            return [];
        }

        return SectionDailyReport.find({ batchId: { $in: batchIds } }).sort({ date: -1 });
    }
}
