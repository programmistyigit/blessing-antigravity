import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useThemeStore } from '@/stores/theme.store';
import { useAuthStore } from '@/stores/auth.store';

// Layout
import { DirectorLayout } from '@/components/layout';

// Pages
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import { DirectorLogin } from '@/pages/auth';
import DashboardPage from '@/pages/DashboardPage';
import { DirectorHome } from '@/pages/director';

// Director module pages
import SectionsPage from '@/pages/director/sections';
import PeriodsPage from '@/pages/director/periods';
import InventoryPage from '@/pages/director/inventory';
import ExpensesPage from '@/pages/director/expenses';
import EmployeesPage from '@/pages/director/employees';
import AttendancePage from '@/pages/director/attendance';
import SalaryPage from '@/pages/director/salary';
import ReportsPage from '@/pages/director/reports';
import SettingsPage from '@/pages/director/settings';

// New skeleton pages
import NewEmployeePage from '@/pages/director/employees/new';
import AssignEmployeePage from '@/pages/director/employees/assign';
import RolesPage from '@/pages/director/roles';
import NewRolePage from '@/pages/director/roles/new';
import EditRolePage from '@/pages/director/roles/edit';
import PermissionsPage from '@/pages/director/permissions';
import BatchesPage from '@/pages/director/batches';
import NewBatchPage from '@/pages/director/batches/new';
import FeedInventoryPage from '@/pages/director/inventory/feed';
import ForecastPage from '@/pages/director/forecast';
import ComparisonPage from '@/pages/director/comparison';
import PricesPage from '@/pages/director/prices';
import SectionDetailPage from '@/pages/director/sections/detail';
import AttendanceLocationPage from '@/pages/director/attendance/location';
import NewPeriodPage from '@/pages/director/periods/new';
import PeriodDetailPage from '@/pages/director/periods/detail';

// Components
import { ProtectedRoute, AuthGuard, PermissionGuard } from '@/components/auth';

function App() {
    const { theme } = useThemeStore();
    const { isAuthenticated } = useAuthStore();

    // Apply theme to document
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';
            root.classList.add(systemTheme);
        } else {
            root.classList.add(theme);
        }
    }, [theme]);

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route
                path="/login"
                element={
                    isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
                }
            />

            {/* Hidden Director Login - NO LINK from landing */}
            <Route
                path="/control"
                element={
                    isAuthenticated ? <Navigate to="/director" replace /> : <DirectorLogin />
                }
            />

            {/* Protected Routes - Worker Dashboard */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                }
            />

            {/* Director Dashboard with nested routes */}
            <Route
                path="/director"
                element={
                    <AuthGuard redirectTo="/control">
                        <PermissionGuard
                            permission="DASHBOARD_READ"
                            fallback={<Navigate to="/control" replace />}
                        >
                            <DirectorLayout />
                        </PermissionGuard>
                    </AuthGuard>
                }
            >
                {/* Director child routes - 19 total */}
                <Route index element={<DirectorHome />} />

                {/* Ishchilar */}
                <Route path="employees" element={<EmployeesPage />} />
                <Route path="employees/new" element={<NewEmployeePage />} />
                <Route path="employees/assign" element={<AssignEmployeePage />} />

                {/* Lavozimlar */}
                <Route path="roles" element={<RolesPage />} />
                <Route path="roles/new" element={<NewRolePage />} />
                <Route path="roles/:id/edit" element={<EditRolePage />} />
                <Route path="permissions" element={<PermissionsPage />} />

                {/* Sexlar */}
                <Route path="sections" element={<SectionsPage />} />
                <Route path="sections/:id" element={<SectionDetailPage />} />
                <Route path="batches" element={<BatchesPage />} />
                <Route path="batches/new" element={<NewBatchPage />} />

                {/* Ombor */}
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="inventory/feed" element={<FeedInventoryPage />} />

                {/* Moliyaviy */}
                <Route path="reports" element={<ReportsPage />} />
                <Route path="expenses" element={<ExpensesPage />} />
                <Route path="periods" element={<PeriodsPage />} />
                <Route path="periods/new" element={<NewPeriodPage />} />
                <Route path="periods/:id" element={<PeriodDetailPage />} />

                {/* Yo'qlama */}
                <Route path="attendance" element={<AttendancePage />} />
                <Route path="attendance/location" element={<AttendanceLocationPage />} />
                <Route path="salary" element={<SalaryPage />} />

                {/* Tahlil */}
                <Route path="forecast" element={<ForecastPage />} />
                <Route path="comparison" element={<ComparisonPage />} />

                {/* Sozlamalar */}
                <Route path="prices" element={<PricesPage />} />
                <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
