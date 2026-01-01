import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
    id: string;
    username: string;
    fullName: string;
    role: {
        id: string;
        name: string;
        permissions: string[];
    };
}

interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;

    // Actions
    login: (token: string, user: User) => void;
    logout: () => void;
    hasPermission: (permission: string) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            isAuthenticated: false,

            login: (token, user) => {
                set({
                    token,
                    user,
                    isAuthenticated: true,
                });
            },

            logout: () => {
                set({
                    token: null,
                    user: null,
                    isAuthenticated: false,
                });
            },

            hasPermission: (permission) => {
                const { user } = get();
                if (!user) return false;

                const permissions = user.role.permissions;

                // SYSTEM_ALL grants access to everything
                if (permissions.includes('SYSTEM_ALL')) return true;

                return permissions.includes(permission);
            },

            hasAnyPermission: (permissions) => {
                const { user } = get();
                if (!user) return false;

                const userPermissions = user.role.permissions;

                // SYSTEM_ALL grants access to everything
                if (userPermissions.includes('SYSTEM_ALL')) return true;

                return permissions.some((p) => userPermissions.includes(p));
            },
        }),
        {
            name: 'blessing-auth',
        }
    )
);
