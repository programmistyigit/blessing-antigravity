import { useQuery } from '@tanstack/react-query';
import { getCompanyDashboard, type CompanyDashboardData } from '@/services/dashboard.service';

/**
 * Hook for fetching company dashboard data
 * queryKey: ['dashboard-company']
 */
export function useCompanyDashboard() {
    return useQuery<CompanyDashboardData, Error>({
        queryKey: ['dashboard-company'],
        queryFn: getCompanyDashboard,
        staleTime: 30 * 1000, // 30 seconds
        refetchInterval: 60 * 1000, // Refetch every minute
    });
}
