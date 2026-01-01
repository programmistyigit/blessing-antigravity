import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

interface AuthGuardProps {
    children: ReactNode;
    redirectTo?: string;
}

/**
 * AuthGuard - Protects routes that require authentication
 * 
 * If user is not authenticated, redirects to specified route (default: /control)
 * This should be used BEFORE PermissionGuard in the component tree.
 */
export function AuthGuard({ children, redirectTo = '/control' }: AuthGuardProps) {
    const location = useLocation();
    const { isAuthenticated } = useAuthStore();

    if (!isAuthenticated) {
        // Save the attempted URL for redirecting after login
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
