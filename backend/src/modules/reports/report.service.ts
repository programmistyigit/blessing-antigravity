import { Types } from 'mongoose';
import { SectionDailyReport } from '../sections/report.model';
import { Disease, Medication } from '../health/health.model';
import { Attendance, AttendanceStatus, AttendanceArrivalSymbol } from '../attendance/attendance.model';
import { Section } from '../sections/section.model';
import { startOfDay, endOfDay } from 'date-fns';

export interface AggregatedReport {
    sectionId: string;
    sectionName: string;
    startDate: Date;
    endDate: Date;
    metrics: {
        totalWeightGain: number; // Sum of daily weight gains if needed, or difference? Actually daily report has totalWeight. We might want averages.
        avgWeight: number; // Average of daily avgWeights
        totalDeaths: number;
        totalFeed: number;
        totalWater: number;
        totalElectricity: number;
    };
    health: {
        diseases: { name: string; count: number; mortality: number }[];
        medications: { name: string; count: number; totalDose: string }[];
    };
    attendance: {
        totalRecords: number;
        present: number;
        late: number;
        early: number;
        absent: number;
    };
}

export class ReportService {

    static async generateSectionReport(sectionId: string, startDateStr: string, endDateStr: string): Promise<AggregatedReport> {
        const start = startOfDay(new Date(startDateStr));
        const end = endOfDay(new Date(endDateStr));
        const sId = new Types.ObjectId(sectionId);

        const section = await Section.findById(sectionId);
        if (!section) throw new Error('Section not found');

        // 1. Production Metrics (SectionDailyReport)
        const productionStats = await SectionDailyReport.aggregate([
            { $match: { sectionId: sId, date: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: null,
                    avgWeight: { $avg: '$avgWeight' },
                    totalDeaths: { $sum: '$deaths' },
                    totalFeed: { $sum: '$feedUsedKg' },
                    totalWater: { $sum: '$waterUsedLiters' },
                    totalElectricity: { $sum: '$electricityUsedKwh' },
                }
            }
        ]);

        const metrics = productionStats[0] || {
            avgWeight: 0,
            totalDeaths: 0,
            totalFeed: 0,
            totalWater: 0,
            totalElectricity: 0,
        };

        // 2. Health Stats (Disease)
        const diseaseStats = await Disease.aggregate([
            { $match: { sectionId: sId, dateDetected: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: '$diseaseName',
                    count: { $sum: 1 },
                    mortality: { $sum: '$mortality' }
                }
            }
        ]);

        // 3. Medication Stats
        const medicationStats = await Medication.aggregate([
            { $match: { sectionId: sId, dateGiven: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: '$medicationName',
                    count: { $sum: 1 },
                    // totalDose is hard to sum if string "100ml". Just counting frequency for now.
                    // Or we could list doses.
                }
            }
        ]);

        // 4. Attendance Stats
        const attendanceStats = await Attendance.aggregate([
            { $match: { sectionId: sId, date: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    present: {
                        $sum: { $cond: [{ $eq: ['$status', AttendanceStatus.PRESENT] }, 1, 0] }
                    },
                    late: {
                        $sum: { $cond: [{ $eq: ['$status', AttendanceStatus.LATE] }, 1, 0] }
                    },
                    early: {
                        $sum: { $cond: [{ $eq: ['$arrivalSymbol', AttendanceArrivalSymbol.EARLY] }, 1, 0] }
                    },
                    absent: {
                        $sum: { $cond: [{ $eq: ['$status', AttendanceStatus.ABSENT] }, 1, 0] }
                    }
                }
            }
        ]);

        const att = attendanceStats[0] || { total: 0, present: 0, late: 0, early: 0, absent: 0 };

        return {
            sectionId: section._id.toString(),
            sectionName: section.name,
            startDate: start,
            endDate: end,
            metrics: {
                totalWeightGain: 0, // Not explicitly tracked yet
                avgWeight: metrics.avgWeight || 0,
                totalDeaths: metrics.totalDeaths || 0,
                totalFeed: metrics.totalFeed || 0,
                totalWater: metrics.totalWater || 0,
                totalElectricity: metrics.totalElectricity || 0,
            },
            health: {
                diseases: diseaseStats.map((d: any) => ({ name: d._id, count: d.count, mortality: d.mortality })),
                medications: medicationStats.map((m: any) => ({ name: m._id, count: m.count, totalDose: 'N/A' })),
            },
            attendance: {
                totalRecords: att.total,
                present: att.present,
                late: att.late,
                early: att.early,
                absent: att.absent,
            }
        };
    }

    static generateCSV(report: AggregatedReport): string {
        const header = [
            'Section Name', 'Start Date', 'End Date',
            'Avg Weight', 'Deaths', 'Feed (kg)', 'Water (L)', 'Electricity (kWh)',
            'Diseases', 'Medications',
            'Attendance Total', 'Present', 'Late', 'Early'
        ].join(',');

        const diseasesStr = report.health.diseases.map(d => `${d.name}(${d.count})`).join('; ');
        const medsStr = report.health.medications.map(m => `${m.name}(${m.count})`).join('; ');

        const row = [
            report.sectionName,
            report.startDate.toISOString().split('T')[0],
            report.endDate.toISOString().split('T')[0],
            report.metrics.avgWeight.toFixed(2),
            report.metrics.totalDeaths,
            report.metrics.totalFeed,
            report.metrics.totalWater,
            report.metrics.totalElectricity,
            `"${diseasesStr}"`,
            `"${medsStr}"`,
            report.attendance.totalRecords,
            report.attendance.present,
            report.attendance.late,
            report.attendance.early,
        ].join(',');

        return `${header}\n${row}`;
    }
}
