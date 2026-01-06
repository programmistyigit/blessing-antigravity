import api, { type ApiResponse } from '@/lib/api';

/**
 * Utility Types - matching backend response
 */
export type UtilityType = 'WATER' | 'ELECTRICITY' | 'GAS';

export interface UtilityCost {
    _id: string;
    id?: string;
    type: UtilityType;
    sectionId: string | null;
    periodId: string;
    amount: number;
    quantity: number | null;
    unitCost: number | null;
    date: string;
    createdBy: string;
    expenseId: string | null;
    notes: string;
    createdAt: string;
}

export interface RecordUtilityPayload {
    type: UtilityType;
    sectionId?: string;
    batchId?: string;
    periodId: string;
    amount: number;
    quantity?: number;
    unitCost?: number;
    date?: string;
    notes?: string;
}

export interface UtilitySummary {
    waterTotal: number;
    electricityTotal: number;
    gasTotal: number;
    totalCost: number;
}

/**
 * POST /api/utilities
 * Permission: WATER_REPORT / ELECTRICITY_REPORT / GAS_REPORT
 */
export async function recordUtilityCost(payload: RecordUtilityPayload): Promise<UtilityCost> {
    const response = await api.post<ApiResponse<UtilityCost>>('/utilities', payload);
    return response.data.data;
}

/**
 * GET /api/utilities?periodId=xxx&type=xxx
 * Permission: WATER_REPORT
 */
export async function getUtilityCostsByPeriod(periodId: string, type?: UtilityType): Promise<UtilityCost[]> {
    const params = new URLSearchParams({ periodId });
    if (type) params.append('type', type);
    const response = await api.get<ApiResponse<UtilityCost[]>>(`/utilities?${params.toString()}`);
    return response.data.data;
}

/**
 * GET /api/utilities/section?sectionId=xxx&type=xxx
 * Permission: WATER_REPORT
 */
export async function getUtilityCostsBySection(sectionId: string, type?: UtilityType): Promise<UtilityCost[]> {
    const params = new URLSearchParams({ sectionId });
    if (type) params.append('type', type);
    const response = await api.get<ApiResponse<UtilityCost[]>>(`/utilities/section?${params.toString()}`);
    return response.data.data;
}

/**
 * GET /api/utilities/batch?batchId=xxx&type=xxx
 * Permission: WATER_REPORT
 */
export async function getUtilityCostsByBatch(batchId: string, type?: UtilityType): Promise<UtilityCost[]> {
    const params = new URLSearchParams({ batchId });
    if (type) params.append('type', type);
    const response = await api.get<ApiResponse<UtilityCost[]>>(`/utilities/batch?${params.toString()}`);
    return response.data.data;
}

/**
 * GET /api/utilities/periods/:periodId/summary
 * Permission: WATER_REPORT
 */
export async function getUtilitySummary(periodId: string): Promise<UtilitySummary> {
    const response = await api.get<ApiResponse<UtilitySummary>>(`/utilities/periods/${periodId}/summary`);
    return response.data.data;
}
