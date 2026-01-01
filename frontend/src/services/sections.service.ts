import api, { type ApiResponse } from '@/lib/api';

/**
 * Section Types - matching backend response
 */
export type SectionStatus = 'EMPTY' | 'PREPARING' | 'ACTIVE' | 'PARTIAL_OUT' | 'CLEANING';

export interface Section {
    _id: string;
    id?: string; // alias for _id
    name: string;
    status: SectionStatus;
    activeBatchId: string | null;
    activePeriodId: string | null;
    assignedWorkers: string[]; // User IDs
    location: {
        lat: number;
        lng: number;
        radius: number;
    } | null;
    chickArrivalDate: string | null;
    expectedEndDate: string | null;
    isArchived: boolean;
    createdAt: string;
}

export interface CreateSectionPayload {
    name: string;
    expectedEndDate?: string | null;
    assignedWorkers?: string[];
}

export interface UpdateSectionPayload {
    name?: string;
    status?: SectionStatus;
    chickArrivalDate?: string | null;
    expectedEndDate?: string | null;
    assignedWorkers?: string[];
    isArchived?: boolean;
    activePeriodId?: string | null;
    location?: {
        lat: number;
        lng: number;
        radius: number;
    } | null;
}

export interface AssignWorkersPayload {
    workerIds: string[];
}

/**
 * GET /api/sections
 * Permission: SECTION_VIEW
 */
export async function getSections(): Promise<Section[]> {
    const response = await api.get<ApiResponse<Section[]>>('/sections');
    return response.data.data;
}

/**
 * POST /api/sections
 * Permission: SECTION_CREATE
 */
export async function createSection(payload: CreateSectionPayload): Promise<Section> {
    const response = await api.post<ApiResponse<Section>>('/sections', payload);
    return response.data.data;
}

/**
 * PATCH /api/sections/:id
 * Permission: SECTION_UPDATE
 */
export async function updateSection(id: string, payload: UpdateSectionPayload): Promise<Section> {
    const response = await api.patch<ApiResponse<Section>>(`/sections/${id}`, payload);
    return response.data.data;
}

/**
 * POST /api/sections/:id/assign-workers
 * Permission: SECTION_ASSIGN_WORKER
 */
export async function assignWorkersToSection(sectionId: string, workerIds: string[]): Promise<void> {
    await api.post(`/sections/${sectionId}/assign-workers`, { workerIds });
}
