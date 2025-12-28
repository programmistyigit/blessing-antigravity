// Section API Service
import api from './api';
import type { ISection, IDailyReport, IDailyReportPayload, ITodayReportStatus } from '@/types/section.types';

/**
 * Get current user's assigned sections
 */
export const getUserSections = async (): Promise<ISection[]> => {
    const response = await api.get<ISection[]>('/sections/my');
    return response.data;
};

/**
 * Get today's report status for a specific section
 */
export const getTodayReportStatus = async (sectionId: string): Promise<ITodayReportStatus> => {
    const response = await api.get<ITodayReportStatus>(`/sections/${sectionId}/reports/today`);
    return response.data;
};

/**
 * Submit daily report for a section
 */
export const submitDailyReport = async (sectionId: string, data: IDailyReportPayload): Promise<IDailyReport> => {
    const response = await api.post<IDailyReport>(`/sections/${sectionId}/reports`, data);
    return response.data;
};
