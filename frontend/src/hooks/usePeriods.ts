import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getPeriods,
    getPeriod,
    createPeriod,
    updatePeriod,
    closePeriod,
    type Period,
    type CreatePeriodPayload,
    type UpdatePeriodPayload,
} from '@/services/periods.service';

/**
 * Hook for fetching all periods
 */
export function usePeriods() {
    return useQuery<Period[], Error>({
        queryKey: ['periods'],
        queryFn: getPeriods,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook for fetching a single period
 */
export function usePeriod(id: string | undefined) {
    return useQuery<Period, Error>({
        queryKey: ['period', id],
        queryFn: () => getPeriod(id!),
        enabled: !!id,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook for creating a new period
 */
export function useCreatePeriod() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreatePeriodPayload) => createPeriod(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['periods'] });
        },
    });
}

/**
 * Hook for updating a period
 */
export function useUpdatePeriod() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdatePeriodPayload }) =>
            updatePeriod(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['periods'] });
        },
    });
}

/**
 * Hook for closing a period (Director only, manual)
 */
export function useClosePeriod() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => closePeriod(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['periods'] });
        },
    });
}
