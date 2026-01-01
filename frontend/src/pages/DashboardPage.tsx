import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    Factory,
    Users,
    Package,
    TrendingUp,
    Activity,
    DollarSign,
    Calendar,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { KPICard, KPICardSkeleton } from '@/components/dashboard/KPICard';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

export default function DashboardPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading] = useState(false); // Will be connected to real data later

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const navItems = [
        { icon: Factory, label: t('nav.dashboard'), href: '/dashboard', permission: null },
        { icon: Package, label: t('nav.sections'), href: '/sections', permission: 'SECTION_VIEW' },
        { icon: Calendar, label: t('nav.periods'), href: '/periods', permission: 'PERIOD_VIEW' },
        { icon: Users, label: t('nav.employees'), href: '/employees', permission: 'USER_VIEW' },
        { icon: Activity, label: t('nav.inventory'), href: '/inventory', permission: 'INVENTORY_READ' },
        { icon: TrendingUp, label: t('nav.reports'), href: '/reports', permission: 'REPORT_VIEW' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transform transition-transform duration-300 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="UMID" className="h-8 w-auto" />
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {navItems.map((item) => {
                        const NavLink = (
                            <Link
                                key={item.href}
                                to={item.href}
                                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <item.icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </Link>
                        );

                        if (item.permission) {
                            return (
                                <PermissionGuard key={item.href} permission={item.permission}>
                                    {NavLink}
                                </PermissionGuard>
                            );
                        }
                        return NavLink;
                    })}
                </nav>

                {/* User section */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <span className="text-primary-600 dark:text-primary-400 font-semibold">
                                {user?.fullName?.charAt(0) || 'U'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {user?.fullName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {user?.role?.name}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>{t('auth.logout')}</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top header */}
                <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {t('dashboard.welcome')}, {user?.fullName?.split(' ')[0]}!
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <LanguageSwitcher />
                        <ThemeToggle />
                    </div>
                </header>

                {/* Dashboard content */}
                <main className="p-4 lg:p-8">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Section Title */}
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                            {t('dashboard.overview')}
                        </h2>

                        {/* KPI Cards Grid - SKELETON */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {isLoading ? (
                                <>
                                    <KPICardSkeleton />
                                    <KPICardSkeleton />
                                    <KPICardSkeleton />
                                    <KPICardSkeleton />
                                </>
                            ) : (
                                <>
                                    <KPICard
                                        title={t('dashboard.kpi.totalSections')}
                                        value="10"
                                        icon={Factory}
                                        color="blue"
                                    />
                                    <KPICard
                                        title={t('dashboard.kpi.activeBatches')}
                                        value="8"
                                        icon={Package}
                                        color="green"
                                        trend={{ value: 12, isPositive: true }}
                                    />
                                    <KPICard
                                        title={t('dashboard.kpi.totalChicks')}
                                        value="85,000"
                                        icon={Activity}
                                        color="purple"
                                    />
                                    <KPICard
                                        title={t('dashboard.kpi.dailyMortality')}
                                        value="0.3%"
                                        icon={TrendingUp}
                                        color="yellow"
                                        trend={{ value: 5, isPositive: false }}
                                    />
                                </>
                            )}
                        </div>

                        {/* Charts Section - SKELETON PLACEHOLDER */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Revenue Chart Placeholder */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    {t('dashboard.kpi.revenue')} & {t('dashboard.kpi.expenses')}
                                </h3>
                                <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <p className="text-gray-400 dark:text-gray-500">
                                        Grafik bu yerda bo'ladi
                                    </p>
                                </div>
                            </div>

                            {/* Sections Overview Placeholder */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    {t('dashboard.sections')}
                                </h3>
                                <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <p className="text-gray-400 dark:text-gray-500">
                                        Sexlar ro'yxati bu yerda bo'ladi
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Financial Summary - SKELETON PLACEHOLDER */}
                        <PermissionGuard permission="SYSTEM_ALL">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                                    <div className="flex items-center gap-2 mb-2">
                                        <DollarSign className="h-5 w-5 opacity-80" />
                                        <span className="text-sm opacity-80">{t('dashboard.kpi.revenue')}</span>
                                    </div>
                                    <p className="text-3xl font-bold">125,000,000</p>
                                    <p className="text-sm opacity-80 mt-1">so'm</p>
                                </div>

                                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Activity className="h-5 w-5 opacity-80" />
                                        <span className="text-sm opacity-80">{t('dashboard.kpi.expenses')}</span>
                                    </div>
                                    <p className="text-3xl font-bold">85,000,000</p>
                                    <p className="text-sm opacity-80 mt-1">so'm</p>
                                </div>

                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="h-5 w-5 opacity-80" />
                                        <span className="text-sm opacity-80">{t('dashboard.kpi.profit')}</span>
                                    </div>
                                    <p className="text-3xl font-bold">40,000,000</p>
                                    <p className="text-sm opacity-80 mt-1">so'm</p>
                                </div>
                            </div>
                        </PermissionGuard>
                    </motion.div>
                </main>
            </div>
        </div>
    );
}
