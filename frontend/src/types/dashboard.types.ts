import { SectionStatus } from './section.types';

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertType = 'MORTALITY' | 'INVENTORY' | 'ATTENDANCE' | 'BATCH' | 'SYSTEM';

export interface IDashboardAlert {
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    message: string;
    timestamp: string;
    metadata?: any;
}

export interface ISectionSummary {
    id: string;
    name: string;
    status: SectionStatus;
    hasActiveBatch: boolean;
    batchAge?: number; // days
    dailyMortality?: number;
    dailyFeed?: number;
    reportStatus: 'pending' | 'submitted' | 'approved' | 'rejected' | 'none';
}

export interface IInventorySummary {
    totalItems: number;
    lowStockItems: {
        name: string;
        currentStock: number;
        unit: string;
        minStock: number;
    }[];
}

export interface IAttendanceSummary {
    totalEmployees: number;
    present: number;
    late: number;
    absent: number;
    fakeGps: number;
}

export interface ICompanyStats {
    kpi: {
        activeSections: number;
        activeBatches: number;
        dailyMortality: number;
        dailyConsumption: {
            feed: number;
            water: number;
            electricity: number;
        };
        lateEmployees: number;
    };
    alerts: IDashboardAlert[];
    sections: ISectionSummary[];
    inventory: IInventorySummary;
    attendance: IAttendanceSummary;
}
