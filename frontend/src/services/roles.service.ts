import api, { type ApiResponse } from '@/lib/api';

/**
 * Role Types - matching backend response
 */
export interface Role {
    _id: string;
    name: string;
    permissions: string[];
    canCreateUsers: boolean;
    canCreateRoles: boolean;
    baseSalary: number;
    createdAt: string;
}

export interface CreateRolePayload {
    name: string;
    permissions: string[];
    canCreateUsers?: boolean;
    canCreateRoles?: boolean;
    baseSalary: number;
}

export interface UpdateRolePayload {
    name?: string;
    permissions?: string[];
    canCreateUsers?: boolean;
    canCreateRoles?: boolean;
    baseSalary?: number;
}

/**
 * GET /api/roles
 * Permission: ROLE_VIEW or SYSTEM_ALL
 */
export async function getRoles(): Promise<Role[]> {
    const response = await api.get<ApiResponse<Role[]>>('/roles');
    return response.data.data;
}

/**
 * POST /api/roles
 * Permission: ROLE_CREATE or SYSTEM_ALL
 */
export async function createRole(payload: CreateRolePayload): Promise<Role> {
    const response = await api.post<ApiResponse<Role>>('/roles', payload);
    return response.data.data;
}

/**
 * PATCH /api/roles/:id
 * Permission: ROLE_UPDATE or SYSTEM_ALL
 */
export async function updateRole(id: string, payload: UpdateRolePayload): Promise<Role> {
    const response = await api.patch<ApiResponse<Role>>(`/roles/${id}`, payload);
    return response.data.data;
}

/**
 * GET /api/roles/:id
 * Get single role (for edit form)
 */
export async function getRole(id: string): Promise<Role> {
    const response = await api.get<ApiResponse<Role>>(`/roles/${id}`);
    return response.data.data;
}
