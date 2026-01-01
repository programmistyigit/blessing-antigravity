import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getSectionReports,
    createDailyReport,
    updateDailyReport,
    type DailyReport,
    type CreateReportPayload,
    type UpdateReportPayload,
} from '@/services/reports.service';

/**
 * Hook for fetching reports for a section
 */
export function useSectionReports(sectionId: string | undefined) {
    return useQuery<DailyReport[], Error>({
        queryKey: ['reports', sectionId],
        queryFn: () => getSectionReports(sectionId!),
        enabled: !!sectionId,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook for creating a daily report
 */
export function useCreateDailyReport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ sectionId, payload }: { sectionId: string; payload: CreateReportPayload }) =>
            createDailyReport(sectionId, payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['reports', variables.sectionId] });
            queryClient.invalidateQueries({ queryKey: ['sections'] });
        },
    });
}

/**
 * Hook for updating a daily report
 */
export function useUpdateDailyReport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ reportId, payload }: { reportId: string; payload: UpdateReportPayload }) =>
            updateDailyReport(reportId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports'] });
        },
    });
}
