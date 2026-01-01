import api, { type ApiResponse } from '@/lib/api';

/**
 * Batch Types - matching backend response
 */
export type BatchStatus = 'ACTIVE' | 'PARTIAL_OUT' | 'CLOSED';

export interface Batch {
    _id: string;
    id?: string;
    name: string;
    sectionId: string | { _id: string; name: string; status: string };
    startedAt: string;
    expectedEndAt: string;
    endedAt: string | null;
    totalChicksIn: number;
    totalChicksOut: number;
    totalDeaths: number;
    remainingChicks: number;
    status: BatchStatus;
    createdBy: string;
    createdAt: string;
}

/**
 * GET /api/batches?status=ACTIVE
 * Permission: SECTION_VIEW
 * Get all batches (with optional status filter)
 */
export async function getAllBatches(status?: BatchStatus): Promise<Batch[]> {
    const params = status ? `?status=${status}` : '';
    const response = await api.get<ApiResponse<Batch[]>>(`/batches${params}`);
    return response.data.data;
}

export interface CreateBatchPayload {
    name: string;
    sectionId: string;
    startedAt?: string;
    expectedEndAt: string;
    totalChicksIn: number;
}

export interface CloseBatchPayload {
    endedAt?: string;
}

/**
 * GET /api/sections/:id/batches
 * Permission: SECTION_VIEW
 * Get all batches for a section
 */
export async function getSectionBatches(sectionId: string): Promise<Batch[]> {
    const response = await api.get<ApiResponse<Batch[]>>(`/sections/${sectionId}/batches`);
    return response.data.data;
}

/**
 * GET /api/batches/:id
 * Permission: SECTION_VIEW
 * Get batch by ID
 */
export async function getBatch(id: string): Promise<Batch> {
    const response = await api.get<ApiResponse<Batch>>(`/batches/${id}`);
    return response.data.data;
}

/**
 * POST /api/batches
 * Permission: BATCH_CREATE
 * Create new batch
 */
export async function createBatch(payload: CreateBatchPayload): Promise<Batch> {
    const response = await api.post<ApiResponse<Batch>>('/batches', payload);
    return response.data.data;
}

/**
 * POST /api/batches/:id/close
 * Permission: BATCH_CLOSE
 * Close a batch
 */
export async function closeBatch(id: string, payload?: CloseBatchPayload): Promise<Batch> {
    const response = await api.post<ApiResponse<Batch>>(`/batches/${id}/close`, payload || {});
    return response.data.data;
}
