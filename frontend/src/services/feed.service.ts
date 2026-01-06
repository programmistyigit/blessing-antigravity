import api, { type ApiResponse } from '@/lib/api';

export interface FeedDelivery {
    _id: string;
    id?: string;
    batchId: string;
    periodId: string;
    quantityKg: number;
    pricePerKg: number;
    totalCost: number;
    deliveredAt: string;
    deliveredBy: {
        _id: string;
        fullName: string;
        username: string;
    } | string;
    expenseId: string | null;
    notes: string;
    createdAt: string;
}

export interface RecordFeedDeliveryPayload {
    batchId: string;
    quantityKg: number;
    pricePerKg: number;
    deliveredAt?: string;
    notes?: string;
}

/**
 * POST /api/feed/deliveries
 * Permission: FEED_MANAGE
 */
export async function recordFeedDelivery(payload: RecordFeedDeliveryPayload): Promise<FeedDelivery> {
    const response = await api.post<ApiResponse<FeedDelivery>>('/feed/deliveries', payload);
    return response.data.data;
}

/**
 * GET /api/feed/deliveries?batchId=xxx
 * Permission: FEED_MANAGE
 */
export async function getFeedDeliveriesByBatch(batchId: string): Promise<FeedDelivery[]> {
    const response = await api.get<ApiResponse<FeedDelivery[]>>(`/feed/deliveries?batchId=${batchId}`);
    return response.data.data;
}

/**
 * GET /api/feed/batches/:batchId/summary
 * Permission: FEED_MANAGE
 */
export async function getBatchFeedSummary(batchId: string): Promise<{ totalKg: number; totalCost: number; deliveryCount: number }> {
    const response = await api.get<ApiResponse<{ totalKg: number; totalCost: number; deliveryCount: number }>>(`/feed/batches/${batchId}/summary`);
    return response.data.data;
}
