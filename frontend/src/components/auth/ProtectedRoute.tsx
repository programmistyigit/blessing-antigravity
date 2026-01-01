import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

interface ProtectedRouteProps {
    children: ReactNode;
    requiredPermission?: string;
    requiredPermissions?: string[];
    requireAll?: boolean; // If true, requires all permissions; if false, any permission
}

export function ProtectedRoute({
    children,
    requiredPermission,
    requiredPermissions,
    requireAll = false,
}: ProtectedRouteProps) {
    const location = useLocation();
    const { isAuthenticated, hasPermission, hasAnyPermission } = useAuthStore();

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check single permission
    if (requiredPermission && !hasPermission(requiredPermission)) {
        return <Navigate to="/dashboard" replace />;
    }

    // Check multiple permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
        if (requireAll) {
            // Need ALL permissions
            const hasAll = requiredPermissions.every((p) => hasPermission(p));
            if (!hasAll) {
                return <Navigate to="/dashboard" replace />;
            }
        } else {
            // Need ANY permission
            if (!hasAnyPermission(requiredPermissions)) {
                return <Navigate to="/dashboard" replace />;
            }
        }
    }

    return <>{children}</>;
}
