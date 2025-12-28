import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IUser } from '@/types/auth.types';
import { Permission } from '@/types/auth.types';

interface AuthState {
    user: IUser | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (token: string, user: IUser) => void;
    logout: () => void;
    hasPermission: (permission: Permission) => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            login: (token: string, user: IUser) => set({ token, user, isAuthenticated: true }),
            logout: () => set({ token: null, user: null, isAuthenticated: false }),
            hasPermission: (permission: Permission) => {
                const user = get().user;
                if (!user) return false;
                // SYSTEM_ALL grants everything
                if (user.role.permissions.includes(Permission.SYSTEM_ALL)) return true;

                // Check role permissions
                if (user.role.permissions.includes(permission)) return true;

                // Check active delegations
                if (user.activeDelegations) {
                    return user.activeDelegations.some(delegation =>
                        delegation.permissions.includes(permission)
                    );
                }

                return false;
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);
