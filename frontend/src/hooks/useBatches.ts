import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getAllBatches,
    getSectionBatches,
    getBatch,
    createBatch,
    closeBatch,
    type Batch,
    type BatchStatus,
    type CreateBatchPayload,
    type CloseBatchPayload,
} from '@/services/batches.service';

/**
 * Hook for fetching all batches (with optional status filter)
 */
export function useAllBatches(status?: BatchStatus) {
    return useQuery<Batch[], Error>({
        queryKey: ['batches', 'all', status],
        queryFn: () => getAllBatches(status),
        staleTime: 30 * 1000,
    });
}

/**
 * Hook for fetching batches for a section
 */
export function useSectionBatches(sectionId: string | undefined) {
    return useQuery<Batch[], Error>({
        queryKey: ['batches', sectionId],
        queryFn: () => getSectionBatches(sectionId!),
        enabled: !!sectionId,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook for fetching a single batch
 */
export function useBatch(id: string | undefined) {
    return useQuery<Batch, Error>({
        queryKey: ['batch', id],
        queryFn: () => getBatch(id!),
        enabled: !!id,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook for creating a new batch
 */
export function useCreateBatch() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateBatchPayload) => createBatch(payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['batches', variables.sectionId] });
            queryClient.invalidateQueries({ queryKey: ['sections'] });
        },
    });
}

/**
 * Hook for closing a batch
 */
export function useCloseBatch() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload?: CloseBatchPayload }) =>
            closeBatch(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['batches'] });
            queryClient.invalidateQueries({ queryKey: ['sections'] });
        },
    });
}
