import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getUsers,
    createUser,
    updateUser,
    type User,
    type CreateUserPayload,
    type UpdateUserPayload,
} from '@/services/users.service';

/**
 * Hook for fetching all users
 * queryKey: ['users']
 */
export function useUsers() {
    return useQuery<User[], Error>({
        queryKey: ['users'],
        queryFn: getUsers,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook for creating a new user
 * Invalidates ['users'] on success
 */
export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateUserPayload) => createUser(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
}

/**
 * Hook for updating a user
 * Invalidates ['users'] on success
 */
export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
            updateUser(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
}
