import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    recordFeedDelivery,
    getFeedDeliveriesByBatch,
    getBatchFeedSummary,
    type FeedDelivery,
    type RecordFeedDeliveryPayload,
} from '@/services/feed.service';

/**
 * Hook for recording feed delivery
 */
export function useRecordFeedDelivery() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: RecordFeedDeliveryPayload) => recordFeedDelivery(payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['feed', 'batch', variables.batchId] });
            queryClient.invalidateQueries({ queryKey: ['feed-summary', variables.batchId] });
            queryClient.invalidateQueries({ queryKey: ['batches'] });
        },
    });
}

/**
 * Hook for fetching feed deliveries by batch
 */
export function useFeedDeliveriesByBatch(batchId: string | undefined) {
    return useQuery<FeedDelivery[], Error>({
        queryKey: ['feed', 'batch', batchId],
        queryFn: () => getFeedDeliveriesByBatch(batchId!),
        enabled: !!batchId,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook for fetching feed summary by batch
 */
export function useBatchFeedSummary(batchId: string | undefined) {
    return useQuery<{ totalKg: number; totalCost: number; deliveryCount: number }, Error>({
        queryKey: ['feed-summary', batchId],
        queryFn: () => getBatchFeedSummary(batchId!),
        enabled: !!batchId,
        staleTime: 30 * 1000,
    });
}
