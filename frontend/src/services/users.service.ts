import api, { type ApiResponse } from '@/lib/api';

/**
 * User Types - matching backend response
 */
export interface UserRole {
    _id: string;
    id?: string;
    name: string;
    permissions: string[];
}

export interface User {
    _id: string;
    id?: string;
    fullName: string;
    username: string;
    role: UserRole;
    isActive: boolean;
    createdAt: string;
}

export interface CreateUserPayload {
    fullName: string;
    username: string;
    password: string;
    roleId: string;
    isActive?: boolean;
}

export interface UpdateUserPayload {
    fullName?: string;
    username?: string;
    password?: string;
    roleId?: string;
    isActive?: boolean;
}

/**
 * GET /api/users
 * Permission: USER_VIEW or SYSTEM_ALL
 */
export async function getUsers(): Promise<User[]> {
    const response = await api.get<ApiResponse<User[]>>('/users');
    return response.data.data;
}

/**
 * POST /api/users
 * Permission: USER_CREATE or SYSTEM_ALL
 */
export async function createUser(payload: CreateUserPayload): Promise<User> {
    const response = await api.post<ApiResponse<User>>('/users', payload);
    return response.data.data;
}

/**
 * PATCH /api/users/:id
 * Permission: USER_UPDATE or SYSTEM_ALL
 */
export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
    const response = await api.patch<ApiResponse<User>>(`/users/${id}`, payload);
    return response.data.data;
}
