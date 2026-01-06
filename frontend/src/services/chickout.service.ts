import api, { type ApiResponse } from '@/lib/api';

/**
 * ChickOut Types - matching backend
 */
export type ChickOutStatus = 'INCOMPLETE' | 'COMPLETE';

export interface ChickOut {
    _id: string;
    sectionId: string;
    batchId: string;
    date: string;
    count: number;
    vehicleNumber: string;
    machineNumber: string;
    isFinal: boolean;
    status: ChickOutStatus;
    createdBy: string;
    createdAt: string;
    // Financial fields (set on complete)
    totalWeightKg?: number;
    wastePercent?: number;
    netWeightKg?: number;
    pricePerKg?: number;
    totalRevenue?: number;
    completedAt?: string;
    completedBy?: string;
}

export interface CreateChickOutPayload {
    date?: string;
    count: number;
    vehicleNumber: string;
    machineNumber: string;
    isFinal?: boolean;
}

export interface CompleteChickOutPayload {
    totalWeightKg: number;
    wastePercent: number;
    pricePerKg: number;
}

/**
 * POST /api/sections/:id/chick-outs
 * Permission: CHICK_OUT_CREATE
 */
export async function createChickOut(sectionId: string, payload: CreateChickOutPayload): Promise<ChickOut> {
    const response = await api.post<ApiResponse<ChickOut>>(`/sections/${sectionId}/chick-outs`, payload);
    return response.data.data;
}

/**
 * PATCH /api/chick-outs/:id/complete
 * Permission: CHICKOUT_COMPLETE
 */
export async function completeChickOut(chickOutId: string, payload: CompleteChickOutPayload): Promise<ChickOut> {
    const response = await api.patch<ApiResponse<ChickOut>>(`/chick-outs/${chickOutId}/complete`, payload);
    return response.data.data;
}

/**
 * GET /api/sections/:id/chick-outs
 * Permission: SECTION_VIEW
 */
export async function getSectionChickOuts(sectionId: string): Promise<ChickOut[]> {
    const response = await api.get<ApiResponse<ChickOut[]>>(`/sections/${sectionId}/chick-outs`);
    return response.data.data;
}

/**
 * GET all incomplete chick-outs (for dashboard)
 * Uses sections endpoint and filters client-side
 */
export async function getAllIncompleteChickOuts(): Promise<ChickOut[]> {
    // We'll need to get this from a dedicated endpoint or aggregate
    // For now, this will be handled in the dashboard component
    return [];
}
