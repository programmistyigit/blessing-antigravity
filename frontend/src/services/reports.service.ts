import api, { type ApiResponse } from '@/lib/api';

/**
 * Daily Report Types - faqat jo'ja holati
 */
export interface Medicine {
    name: string;
    dose: string;
}

export interface DailyReport {
    _id: string;
    id?: string;
    batchId: string;
    date: string;
    deaths: number;
    avgWeight: number;
    medicines: Medicine[];
    notes: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateReportPayload {
    date: string;
    deaths: number;
    avgWeight: number;
    medicines?: Medicine[];
    note?: string;
}

export interface UpdateReportPayload {
    deaths?: number;
    avgWeight?: number;
    medicines?: Medicine[];
    note?: string;
}

/**
 * GET /api/sections/:id/reports
 * Permission: SECTION_DAILY_REPORT_VIEW
 */
export async function getSectionReports(sectionId: string): Promise<DailyReport[]> {
    const response = await api.get<ApiResponse<DailyReport[]>>(`/sections/${sectionId}/reports`);
    return response.data.data;
}

/**
 * GET /api/batches/:id/reports
 * Permission: SECTION_DAILY_REPORT_VIEW
 */
export async function getBatchReports(batchId: string): Promise<DailyReport[]> {
    const response = await api.get<ApiResponse<DailyReport[]>>(`/batches/${batchId}/reports`);
    return response.data.data;
}

/**
 * POST /api/sections/:id/reports
 * Permission: SECTION_DAILY_REPORT_CREATE
 */
export async function createDailyReport(sectionId: string, payload: CreateReportPayload): Promise<DailyReport> {
    const response = await api.post<ApiResponse<DailyReport>>(`/sections/${sectionId}/reports`, payload);
    return response.data.data;
}

/**
 * PATCH /api/reports/:id
 * Permission: SECTION_DAILY_REPORT_UPDATE
 */
export async function updateDailyReport(reportId: string, payload: UpdateReportPayload): Promise<DailyReport> {
    const response = await api.patch<ApiResponse<DailyReport>>(`/reports/${reportId}`, payload);
    return response.data.data;
}
