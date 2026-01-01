import type { ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth.store';

interface PermissionGuardProps {
    children: ReactNode;
    permission?: string;
    permissions?: string[];
    requireAll?: boolean;
    fallback?: ReactNode;
}

/**
 * PermissionGuard - Hides content if user lacks permission
 * Use this to conditionally show/hide UI elements based on permissions
 */
export function PermissionGuard({
    children,
    permission,
    permissions,
    requireAll = false,
    fallback = null,
}: PermissionGuardProps) {
    const { hasPermission, hasAnyPermission, isAuthenticated } = useAuthStore();

    // Not authenticated - hide
    if (!isAuthenticated) {
        return <>{fallback}</>;
    }

    // Check single permission
    if (permission && !hasPermission(permission)) {
        return <>{fallback}</>;
    }

    // Check multiple permissions
    if (permissions && permissions.length > 0) {
        if (requireAll) {
            const hasAll = permissions.every((p) => hasPermission(p));
            if (!hasAll) return <>{fallback}</>;
        } else {
            if (!hasAnyPermission(permissions)) return <>{fallback}</>;
        }
    }

    return <>{children}</>;
}
