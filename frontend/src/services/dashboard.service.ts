import api, { type ApiResponse } from '@/lib/api';

/**
 * Dashboard Data Types - matching backend response
 */
export interface DashboardMetrics {
    avgWeight: number;
    totalDeaths: number;
    totalFeed: number;
    totalWater: number;
    totalElectricity: number;
    totalWeightGain: number;
}

export interface DashboardHealth {
    diseases: { name: string; count: number }[];
    medications: { name: string; dosage: string }[];
}

export interface DashboardAttendance {
    totalRecords: number;
    present: number;
    late: number;
    early: number;
    absent: number;
}

export interface DashboardInventory {
    lowStockCount: number;
    totalValue?: number;
    criticalItems: { name: string; quantity: number; minThreshold: number }[];
}

export interface DashboardAlert {
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
    count: number;
}

export interface SectionSummary {
    id: string;
    name: string;
    deaths: number;
    attendance: number;
}

export interface CompanyDashboardData {
    metrics: DashboardMetrics;
    health: DashboardHealth;
    attendance: DashboardAttendance;
    inventory: DashboardInventory;
    alerts: DashboardAlert[];
    sectionsSummary: SectionSummary[];
}

/**
 * Get Company Dashboard Data
 * GET /api/dashboard/company
 */
export async function getCompanyDashboard(): Promise<CompanyDashboardData> {
    const response = await api.get<ApiResponse<CompanyDashboardData>>('/dashboard/company');
    return response.data.data;
}
