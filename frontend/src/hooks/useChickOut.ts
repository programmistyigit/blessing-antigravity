import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    createChickOut,
    completeChickOut,
    getSectionChickOuts,
    type ChickOut,
    type CreateChickOutPayload,
    type CompleteChickOutPayload,
} from '@/services/chickout.service';

/**
 * Hook for fetching section's chick-outs
 */
export function useSectionChickOuts(sectionId: string | undefined) {
    return useQuery<ChickOut[], Error>({
        queryKey: ['chick-outs', sectionId],
        queryFn: () => getSectionChickOuts(sectionId!),
        enabled: !!sectionId,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook for creating a chick-out
 */
export function useCreateChickOut() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ sectionId, payload }: { sectionId: string; payload: CreateChickOutPayload }) =>
            createChickOut(sectionId, payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['chick-outs', variables.sectionId] });
            queryClient.invalidateQueries({ queryKey: ['batches'] });
            queryClient.invalidateQueries({ queryKey: ['sections'] });
        },
    });
}

/**
 * Hook for completing a chick-out
 */
export function useCompleteChickOut() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ chickOutId, payload }: { chickOutId: string; payload: CompleteChickOutPayload }) =>
            completeChickOut(chickOutId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chick-outs'] });
            queryClient.invalidateQueries({ queryKey: ['batches'] });
        },
    });
}
