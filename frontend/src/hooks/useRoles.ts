import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getRoles,
    getRole,
    createRole,
    updateRole,
    type Role,
    type CreateRolePayload,
    type UpdateRolePayload,
} from '@/services/roles.service';

/**
 * Hook for fetching all roles
 * queryKey: ['roles']
 */
export function useRoles() {
    return useQuery<Role[], Error>({
        queryKey: ['roles'],
        queryFn: getRoles,
        staleTime: 60 * 1000, // 1 minute
    });
}

/**
 * Hook for fetching single role
 * queryKey: ['roles', id]
 */
export function useRole(id: string | undefined) {
    return useQuery<Role, Error>({
        queryKey: ['roles', id],
        queryFn: () => getRole(id!),
        enabled: !!id,
        staleTime: 60 * 1000,
    });
}

/**
 * Hook for creating a new role
 * Invalidates ['roles'] on success
 */
export function useCreateRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateRolePayload) => createRole(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        },
    });
}

/**
 * Hook for updating a role
 * Invalidates ['roles'] on success
 */
export function useUpdateRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateRolePayload }) =>
            updateRole(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        },
    });
}
