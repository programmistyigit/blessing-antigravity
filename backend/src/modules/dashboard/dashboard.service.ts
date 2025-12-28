import { ReportService, AggregatedReport } from '../reports/report.service';
import { InventoryItem } from '../inventory/inventory.model';
import { Section, SectionStatus } from '../sections/section.model';
import { startOfDay, endOfDay } from 'date-fns';

export interface DashboardData {
    sectionId?: string;
    sectionName?: string;
    metrics: AggregatedReport['metrics'];
    health: AggregatedReport['health'];
    attendance: AggregatedReport['attendance'];
    inventory: {
        lowStockCount: number;
        totalValue?: number; // Not tracking price yet
        criticalItems: { name: string; quantity: number; minThreshold: number }[];
    };
    alerts: {
        type: string;
        message: string;
        severity: 'info' | 'warning' | 'critical';
        count: number;
    }[];
}

export class DashboardService {

    static async getSectionDashboard(sectionId: string): Promise<DashboardData> {
        const today = new Date();
        const start = startOfDay(today).toISOString();
        const end = endOfDay(today).toISOString();

        // reuse ReportService for aggregation logic
        const report = await ReportService.generateSectionReport(sectionId, start, end);

        // Inventory Stock Check (Global Warehouse - relevant for section context usually means "can I get feed?")
        // For distinct section dashboard, we might show "Low Stock" alerts generally or specific to section requests (if implemented).
        // For now, we show Global Low Stock of relevant categories (FEED, MEDICINE) as a warning.

        const lowStockItems = await InventoryItem.find({
            isActive: true,
            $expr: { $lte: ['$quantity', '$minThreshold'] }
        });

        const critical = lowStockItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            minThreshold: item.minThreshold
        }));

        const alerts: DashboardData['alerts'] = [];

        // High Mortality Alert
        const mortalityThreshold = 50; // hardcoded for now or config
        if (report.metrics.totalDeaths > mortalityThreshold) {
            alerts.push({
                type: 'HIGH_MORTALITY',
                message: `High mortality detected: ${report.metrics.totalDeaths}`,
                severity: 'critical',
                count: report.metrics.totalDeaths
            });
        }

        // Late Arrival Alert
        if (report.attendance.late > 0) {
            alerts.push({
                type: 'LATE_ARRIVAL',
                message: `${report.attendance.late} employees arrived late`,
                severity: 'warning',
                count: report.attendance.late
            });
        }

        // Fake Attendance Alert (Not strictly aggregated in report yet, but could be)
        // Check "Fake" count if we update report service to return it. 
        // For now, we rely on event stream for critical fake alerts, dashboard shows summary.

        // Low Stock Alert
        if (critical.length > 0) {
            alerts.push({
                type: 'LOW_STOCK',
                message: `${critical.length} items below minimum threshold`,
                severity: 'warning',
                count: critical.length
            });
        }

        return {
            sectionId: report.sectionId,
            sectionName: report.sectionName,
            metrics: report.metrics,
            health: report.health,
            attendance: report.attendance,
            inventory: {
                lowStockCount: critical.length,
                criticalItems: critical
            },
            alerts
        };
    }

    static async getCompanyDashboard(): Promise<DashboardData & { sectionsSummary: any[] }> {
        // Aggregate all active sections
        const sections = await Section.find({ status: SectionStatus.ACTIVE });
        const sectionDashboards = await Promise.all(sections.map(s => this.getSectionDashboard(s._id.toString())));

        // Merge logic
        const merged: DashboardData = {
            metrics: { avgWeight: 0, totalDeaths: 0, totalFeed: 0, totalWater: 0, totalElectricity: 0, totalWeightGain: 0 },
            health: { diseases: [], medications: [] },
            attendance: { totalRecords: 0, present: 0, late: 0, early: 0, absent: 0 },
            inventory: { lowStockCount: 0, criticalItems: [] }, // Inventory is global, so take once?
            alerts: []
        };

        // Inventory is global, fetch once
        const lowStockItems = await InventoryItem.find({
            isActive: true,
            $expr: { $lte: ['$quantity', '$minThreshold'] }
        });
        merged.inventory.lowStockCount = lowStockItems.length;
        merged.inventory.criticalItems = lowStockItems.map(i => ({ name: i.name, quantity: i.quantity, minThreshold: i.minThreshold }));

        // Sum up others
        let totalAvgWeightAccumulator = 0;
        let avgCount = 0;

        for (const d of sectionDashboards) {
            merged.metrics.totalDeaths += d.metrics.totalDeaths;
            merged.metrics.totalFeed += d.metrics.totalFeed;
            merged.metrics.totalWater += d.metrics.totalWater;
            merged.metrics.totalElectricity += d.metrics.totalElectricity;

            if (d.metrics.avgWeight > 0) {
                totalAvgWeightAccumulator += d.metrics.avgWeight;
                avgCount++;
            }

            merged.attendance.totalRecords += d.attendance.totalRecords;
            merged.attendance.present += d.attendance.present;
            merged.attendance.late += d.attendance.late;
            merged.attendance.early += d.attendance.early;
            merged.attendance.absent += d.attendance.absent;

            merged.alerts.push(...d.alerts.map(a => ({ ...a, message: `[${d.sectionName}] ${a.message}` })));
        }

        if (avgCount > 0) merged.metrics.avgWeight = totalAvgWeightAccumulator / avgCount;

        return {
            ...merged,
            sectionsSummary: sectionDashboards.map(d => ({
                id: d.sectionId,
                name: d.sectionName,
                deaths: d.metrics.totalDeaths,
                attendance: d.attendance.present
            }))
        };
    }
}
