import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    Shield,
    Factory,
    Package,
    BarChart3,
    TrendingUp,
    Settings,
    ClipboardCheck,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    LogOut,
    Menu,
    X,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

// Menu structure - Director perspective
interface MenuItem {
    icon: React.ElementType;
    label: string;
    path?: string;
    children?: { label: string; path: string }[];
}

const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/director' },
    {
        icon: Users,
        label: 'Ishchilar',
        children: [
            { label: "Ro'yxat", path: '/director/employees' },
            { label: "Qo'shish", path: '/director/employees/new' },
            { label: 'Sexga biriktirish', path: '/director/employees/assign' },
        ],
    },
    {
        icon: Shield,
        label: 'Lavozimlar',
        children: [
            { label: 'Rollar', path: '/director/roles' },
            { label: "Ruxsatlar", path: '/director/permissions' },
        ],
    },
    {
        icon: Factory,
        label: 'Sexlar',
        children: [
            { label: 'Seksiyalar', path: '/director/sections' },
            { label: 'Partiyalar', path: '/director/batches' },
        ],
    },
    {
        icon: Package,
        label: 'Ombor',
        children: [
            { label: 'Inventar', path: '/director/inventory' },
            { label: 'Yem / Dori', path: '/director/inventory/feed' },
        ],
    },
    {
        icon: BarChart3,
        label: 'Moliyaviy',
        children: [
            { label: 'P&L', path: '/director/reports' },
            { label: 'Xarajatlar', path: '/director/expenses' },
            { label: 'Davrlar', path: '/director/periods' },
        ],
    },
    {
        icon: ClipboardCheck,
        label: "Yo'qlama",
        children: [
            { label: 'Davomat', path: '/director/attendance' },
            { label: 'Ish haqi', path: '/director/salary' },
        ],
    },
    {
        icon: TrendingUp,
        label: 'Tahlil',
        children: [
            { label: 'Prognoz', path: '/director/forecast' },
            { label: 'Reja vs Haqiqat', path: '/director/comparison' },
        ],
    },
    {
        icon: Settings,
        label: 'Sozlamalar',
        children: [
            { label: 'Narxlar', path: '/director/prices' },
            { label: 'Tizim', path: '/director/settings' },
        ],
    },
];

// Collapsible menu item component
function SidebarItem({ item, collapsed }: { item: MenuItem; collapsed: boolean }) {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    const isActive = item.path
        ? location.pathname === item.path
        : item.children?.some(child => location.pathname === child.path);

    if (item.path) {
        return (
            <NavLink
                to={item.path}
                end
                className={`flex items-center gap-3 mx-2 my-0.5 px-3 py-2 rounded-lg transition-all duration-150 ${isActive
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
            >
                <item.icon className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.5} />
                {!collapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                )}
            </NavLink>
        );
    }

    return (
        <div className="mx-2 my-0.5">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-150 ${isActive
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <item.icon className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.5} />
                    {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </div>
                {!collapsed && (
                    <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                )}
            </button>

            <AnimatePresence>
                {isOpen && !collapsed && item.children && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                    >
                        <div className="ml-7 mt-1 space-y-0.5 border-l border-slate-200 dark:border-slate-700 pl-3">
                            {item.children.map((child) => (
                                <NavLink
                                    key={child.path}
                                    to={child.path}
                                    className={({ isActive }) =>
                                        `block py-1.5 px-2 text-sm rounded transition-colors ${isActive
                                            ? 'text-slate-900 dark:text-white font-medium'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`
                                    }
                                >
                                    {child.label}
                                </NavLink>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function DirectorLayout() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/control');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
            {/* Desktop Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: sidebarOpen ? 240 : 64 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="hidden lg:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 fixed left-0 top-0 bottom-0 z-30"
            >
                {/* Logo */}
                <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800">
                    {sidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2"
                        >
                            <img src="/logo.png" alt="UMID" className="h-7 w-auto" />
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">UMID</span>
                        </motion.div>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-3 overflow-y-auto">
                    {menuItems.map((item) => (
                        <SidebarItem key={item.label} item={item} collapsed={!sidebarOpen} />
                    ))}
                </nav>

                {/* User section */}
                <div className="p-3 border-t border-slate-100 dark:border-slate-800">
                    {sidebarOpen ? (
                        <div className="flex items-center gap-2.5 px-2">
                            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                    {user?.fullName?.charAt(0) || 'D'}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                                    {user?.fullName || 'Director'}
                                </p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                    {user?.role?.name || 'DIRECTOR'}
                                </p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                title="Chiqish"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                            title="Chiqish"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </motion.aside>

            {/* Mobile sidebar */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -260 }}
                            animate={{ x: 0 }}
                            exit={{ x: -260 }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed left-0 top-0 bottom-0 w-[260px] bg-white dark:bg-slate-900 z-50 lg:hidden flex flex-col border-r border-slate-200 dark:border-slate-800"
                        >
                            {/* Logo */}
                            <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <img src="/logo.png" alt="UMID" className="h-7 w-auto" />
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">UMID</span>
                                </div>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Navigation */}
                            <nav className="flex-1 py-3 overflow-y-auto">
                                {menuItems.map((item) => (
                                    <SidebarItem key={item.label} item={item} collapsed={false} />
                                ))}
                            </nav>

                            {/* User section */}
                            <div className="p-3 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2.5 px-2">
                                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                            {user?.fullName?.charAt(0) || 'D'}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                                            {user?.fullName || 'Director'}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                            {user?.role?.name || 'DIRECTOR'}
                                        </p>
                                    </div>
                                    <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-red-500">
                                        <LogOut className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main content */}
            <div className={`flex-1 flex flex-col transition-all ${sidebarOpen ? 'lg:ml-60' : 'lg:ml-16'}`}>
                {/* Header */}
                <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 z-20">
                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="lg:hidden p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    {/* Spacer */}
                    <div className="hidden lg:block" />

                    {/* Right actions */}
                    <div className="flex items-center gap-2">
                        <LanguageSwitcher />
                        <ThemeToggle />
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
