// Section types for Daily Report module

export enum SectionStatus {
    PREPARING = 'PREPARING',
    ACTIVE = 'ACTIVE',
    CLEANING = 'CLEANING',
    INACTIVE = 'INACTIVE'
}

export interface IBatch {
    _id: string;
    sectionId: string;
    batchNumber: string;
    startDate: string;
    endDate?: string;
    initialPopulation: number;
    currentPopulation: number;
    breed?: string;
    status: 'ACTIVE' | 'CLOSED';
}

export interface ISection {
    _id: string;
    name: string;
    flockAge?: number;
    currentPopulation?: number;
    status: SectionStatus;
    activeBatchId?: string | IBatch; // Can be ID or populated object
}

export interface IDailyReport {
    _id: string;
    section: string | ISection;
    date: string;
    avgWeight: number;
    totalWeight: number;
    deaths: number;
    feedUsedKg: number;
    waterUsedLiters: number;
    electricityUsedKwh: number;
    notes?: string;
    submittedBy: string;
    createdAt: string;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    approvedBy?: string;
    approvedAt?: string;
}

export interface IDailyReportPayload {
    date: string;
    avgWeight: number;
    totalWeight: number;
    deaths: number;
    feedUsedKg: number;
    waterUsedLiters: number;
    electricityUsedKwh: number;
    notes?: string;
}

export interface ITodayReportStatus {
    submitted: boolean;
    report?: IDailyReport;
}
