import api from './api';
import type { ICompanyStats } from '@/types/dashboard.types';

export const DashboardService = {
    async getCompanyStats(): Promise<ICompanyStats> {
        const response = await api.get<{ success: boolean; data: ICompanyStats }>('/dashboard/company');
        return response.data.data;
    }
};
