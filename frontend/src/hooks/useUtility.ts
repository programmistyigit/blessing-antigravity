import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    recordUtilityCost,
    getUtilityCostsByPeriod,
    getUtilityCostsBySection,
    getUtilityCostsByBatch,
    getUtilitySummary,
    type UtilityCost,
    type UtilityType,
    type RecordUtilityPayload,
    type UtilitySummary,
} from '@/services/utility.service';

/**
 * Hook for recording utility cost (WATER, ELECTRICITY, GAS)
 */
export function useRecordUtilityCost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: RecordUtilityPayload) => recordUtilityCost(payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['utilities', variables.periodId] });
            queryClient.invalidateQueries({ queryKey: ['utility-summary', variables.periodId] });
            if (variables.sectionId) {
                queryClient.invalidateQueries({ queryKey: ['utilities', 'section', variables.sectionId] });
            }
            if (variables.batchId) {
                queryClient.invalidateQueries({ queryKey: ['utilities', 'batch', variables.batchId] });
            }
        },
    });
}

/**
 * Hook for fetching utility costs by period
 */
export function useUtilityCostsByPeriod(periodId: string | undefined, type?: UtilityType) {
    return useQuery<UtilityCost[], Error>({
        queryKey: ['utilities', periodId, type],
        queryFn: () => getUtilityCostsByPeriod(periodId!, type),
        enabled: !!periodId,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook for fetching utility costs by section
 */
export function useUtilityCostsBySection(sectionId: string | undefined, type?: UtilityType) {
    return useQuery<UtilityCost[], Error>({
        queryKey: ['utilities', 'section', sectionId, type],
        queryFn: () => getUtilityCostsBySection(sectionId!, type),
        enabled: !!sectionId,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook for fetching utility costs by batch
 */
export function useUtilityCostsByBatch(batchId: string | undefined, type?: UtilityType) {
    return useQuery<UtilityCost[], Error>({
        queryKey: ['utilities', 'batch', batchId, type],
        queryFn: () => getUtilityCostsByBatch(batchId!, type),
        enabled: !!batchId,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook for fetching utility summary by period
 */
export function useUtilitySummary(periodId: string | undefined) {
    return useQuery<UtilitySummary, Error>({
        queryKey: ['utility-summary', periodId],
        queryFn: () => getUtilitySummary(periodId!),
        enabled: !!periodId,
        staleTime: 30 * 1000,
    });
}
