import api from './api';
import type { ISection, IBatch, SectionStatus } from '@/types/section.types';

export const ManagerService = {
    /**
     * Approve a daily report
     */
    approveReport: async (reportId: string): Promise<void> => {
        await api.post(`/reports/${reportId}/approve`);
    },

    /**
     * Reject a daily report
     */
    rejectReport: async (reportId: string, reason: string): Promise<void> => {
        await api.post(`/reports/${reportId}/reject`, { reason });
    },

    /**
     * Update section status
     */
    updateSectionStatus: async (sectionId: string, status: SectionStatus): Promise<ISection> => {
        const response = await api.patch<ISection>(`/sections/${sectionId}/status`, { status });
        return response.data;
    },

    /**
     * Start a new batch
     */
    startBatch: async (data: {
        sectionId: string;
        batchNumber: string;
        initialPopulation: number;
        breed?: string;
        startDate?: string;
    }): Promise<IBatch> => {
        const response = await api.post<IBatch>('/batches', data);
        return response.data;
    },

    /**
     * Close a batch
     */
    closeBatch: async (batchId: string, endDate?: string, notes?: string): Promise<IBatch> => {
        const response = await api.post<IBatch>(`/batches/${batchId}/close`, {
            endDate,
            notes
        });
        return response.data;
    },

    /**
     * Get all sections for manager view (typically all sections or assigned ones with expanded info)
     */
    getAllSections: async (): Promise<ISection[]> => {
        // Assuming there is an endpoint to get all sections or using existing one
        const response = await api.get<ISection[]>('/sections');
        return response.data;
    }
};
