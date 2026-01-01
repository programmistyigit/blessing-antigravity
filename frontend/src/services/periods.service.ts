import api, { type ApiResponse } from '@/lib/api';

/**
 * Period Types - matching backend response
 */
export type PeriodStatus = 'ACTIVE' | 'CLOSED';

export interface Period {
    _id: string;
    id?: string;
    name: string;
    status: PeriodStatus;
    startDate: string;
    endDate: string | null;
    sections: string[];
    notes: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePeriodPayload {
    name: string;
    startDate: string;
    sections?: string[];
    notes?: string;
}

export interface UpdatePeriodPayload {
    name?: string;
    sections?: string[];
    notes?: string;
}

/**
 * GET /api/periods
 * Permission: PERIOD_VIEW
 */
export async function getPeriods(): Promise<Period[]> {
    const response = await api.get<ApiResponse<Period[]>>('/periods');
    return response.data.data;
}

/**
 * GET /api/periods/:id
 * Permission: PERIOD_VIEW
 */
export async function getPeriod(id: string): Promise<Period> {
    const response = await api.get<ApiResponse<Period>>(`/periods/${id}`);
    return response.data.data;
}

/**
 * POST /api/periods
 * Permission: PERIOD_CREATE
 */
export async function createPeriod(payload: CreatePeriodPayload): Promise<Period> {
    const response = await api.post<ApiResponse<Period>>('/periods', payload);
    return response.data.data;
}

/**
 * PATCH /api/periods/:id
 * Permission: PERIOD_UPDATE
 */
export async function updatePeriod(id: string, payload: UpdatePeriodPayload): Promise<Period> {
    const response = await api.patch<ApiResponse<Period>>(`/periods/${id}`, payload);
    return response.data.data;
}

/**
 * POST /api/periods/:id/close
 * Permission: PERIOD_CLOSE
 */
export async function closePeriod(id: string): Promise<Period> {
    const response = await api.post<ApiResponse<Period>>(`/periods/${id}/close`);
    return response.data.data;
}
