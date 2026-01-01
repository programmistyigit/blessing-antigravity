import { motion } from 'framer-motion';
import {
    DollarSign,
    TrendingDown,
    Wheat,
    Skull,
    Factory,
    ChevronRight,
    BarChart3,
    LineChart,
    Activity,
    Target,
} from 'lucide-react';
import {
    LineChart as ReLineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

// ============================================
// TYPES
// ============================================
interface KPICardProps {
    title: string;
    value: string;
    icon: React.ElementType;
    color: 'green' | 'red' | 'blue' | 'yellow' | 'purple';
    trend?: { value: number; isPositive: boolean };
    loading?: boolean;
}

interface SectionCardProps {
    name: string;
    status: 'active' | 'cleaning' | 'empty';
}

// ============================================
// DUMMY DATA (placeholder - no real data)
// ============================================
const dummyPLData = [
    { month: 'Yan', revenue: 0, expense: 0 },
    { month: 'Fev', revenue: 0, expense: 0 },
    { month: 'Mar', revenue: 0, expense: 0 },
    { month: 'Apr', revenue: 0, expense: 0 },
    { month: 'May', revenue: 0, expense: 0 },
    { month: 'Iyn', revenue: 0, expense: 0 },
];

const dummyFeedData = [
    { section: 'Sex 1', feed: 0 },
    { section: 'Sex 2', feed: 0 },
    { section: 'Sex 3', feed: 0 },
    { section: 'Sex 4', feed: 0 },
    { section: 'Sex 5', feed: 0 },
];

const dummyMortalityData = [
    { day: '1', rate: 0 },
    { day: '5', rate: 0 },
    { day: '10', rate: 0 },
    { day: '15', rate: 0 },
    { day: '20', rate: 0 },
    { day: '25', rate: 0 },
    { day: '30', rate: 0 },
];

const dummyForecastData = [
    { week: '1-hf', forecast: 0, actual: 0 },
    { week: '2-hf', forecast: 0, actual: 0 },
    { week: '3-hf', forecast: 0, actual: 0 },
    { week: '4-hf', forecast: 0, actual: 0 },
];

const dummySections = [
    { id: '1', name: 'Sex 1', status: 'active' as const },
    { id: '2', name: 'Sex 2', status: 'active' as const },
    { id: '3', name: 'Sex 3', status: 'cleaning' as const },
    { id: '4', name: 'Sex 4', status: 'empty' as const },
    { id: '5', name: 'Sex 5', status: 'active' as const },
    { id: '6', name: 'Sex 6', status: 'active' as const },
];

// ============================================
// ANIMATION VARIANTS
// ============================================
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
    },
};

// ============================================
// KPI CARD COMPONENT
// ============================================
const colorClasses = {
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
};

const iconBgClasses = {
    green: 'bg-green-100 dark:bg-green-900/40',
    red: 'bg-red-100 dark:bg-red-900/40',
    blue: 'bg-blue-100 dark:bg-blue-900/40',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/40',
    purple: 'bg-purple-100 dark:bg-purple-900/40',
};

function KPICard({ title, value, icon: Icon, color, trend, loading }: KPICardProps) {
    if (loading) {
        return (
            <motion.div
                variants={itemVariants}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm"
            >
                <div className="animate-pulse">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                    </div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-28" />
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
            className={`bg-white dark:bg-gray-800 rounded-xl p-5 border shadow-sm hover:shadow-md transition-shadow cursor-default ${colorClasses[color]}`}
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {title}
                </span>
                <div className={`p-2.5 rounded-lg ${iconBgClasses[color]}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>

            <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {value}
                </span>
                {trend && (
                    <div
                        className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${trend.isPositive
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            }`}
                    >
                        <span>{trend.isPositive ? '↑' : '↓'}</span>
                        <span className="ml-0.5">{Math.abs(trend.value)}%</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ============================================
// CHART CARD COMPONENT
// ============================================
interface ChartCardProps {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
}

function ChartCard({ title, icon: Icon, children }: ChartCardProps) {
    return (
        <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm"
        >
            <div className="flex items-center gap-2 mb-4">
                <Icon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    {title}
                </h3>
            </div>
            <div className="h-56">
                {children}
            </div>
        </motion.div>
    );
}

// ============================================
// SECTION CARD COMPONENT
// ============================================
const statusConfig = {
    active: { label: 'Faol', class: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
    cleaning: { label: 'Tozalash', class: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
    empty: { label: "Bo'sh", class: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' },
};

function SectionCard({ name, status }: SectionCardProps) {
    const statusInfo = statusConfig[status];

    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
        >
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">{name}</h4>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusInfo.class}`}>
                    {statusInfo.label}
                </span>
            </div>

            {/* Sparkline placeholder */}
            <div className="h-10 bg-gray-50 dark:bg-gray-700/50 rounded mb-3 flex items-center justify-center">
                <span className="text-xs text-gray-400 dark:text-gray-500">Sparkline</span>
            </div>

            <button className="w-full flex items-center justify-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                <span>Ochish</span>
                <ChevronRight className="h-4 w-4" />
            </button>
        </motion.div>
    );
}

// ============================================
// MAIN DIRECTOR DASHBOARD
// ============================================
export default function DirectorDashboard() {
    const isLoading = false; // Will be connected to real loading state later

    return (
        <PermissionGuard permission="DASHBOARD_READ" fallback={<AccessDenied />}>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 lg:p-8">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-[1800px] mx-auto"
                >
                    {/* Header */}
                    <motion.div variants={itemVariants} className="mb-8">
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Boshqaruv Pulti
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Fabrika holati va statistikasi
                        </p>
                    </motion.div>

                    {/* KPI Cards Grid */}
                    <motion.div
                        variants={containerVariants}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
                    >
                        <KPICard
                            title="Umumiy Foyda"
                            value="---"
                            icon={DollarSign}
                            color="green"
                            loading={isLoading}
                        />
                        <KPICard
                            title="Umumiy Xarajat"
                            value="---"
                            icon={TrendingDown}
                            color="red"
                            loading={isLoading}
                        />
                        <KPICard
                            title="Yem Sarfi"
                            value="--- kg"
                            icon={Wheat}
                            color="yellow"
                            loading={isLoading}
                        />
                        <KPICard
                            title="O'lim Foizi"
                            value="--- %"
                            icon={Skull}
                            color="purple"
                            loading={isLoading}
                        />
                        <KPICard
                            title="Faol Sexlar"
                            value="---"
                            icon={Factory}
                            color="blue"
                            loading={isLoading}
                        />
                    </motion.div>

                    {/* Charts Grid */}
                    <motion.div
                        variants={containerVariants}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
                    >
                        {/* P&L Trend Chart */}
                        <ChartCard title="Daromad va Xarajat Dinamikasi" icon={BarChart3}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dummyPLData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                                    <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                                    <YAxis stroke="#9CA3AF" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1F2937',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: '#F9FAFB',
                                        }}
                                    />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        name="Daromad"
                                        stroke="#22C55E"
                                        fill="#22C55E"
                                        fillOpacity={0.2}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="expense"
                                        name="Xarajat"
                                        stroke="#EF4444"
                                        fill="#EF4444"
                                        fillOpacity={0.2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* Feed Consumption by Section */}
                        <ChartCard title="Sexlar bo'yicha Yem Sarfi" icon={Wheat}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dummyFeedData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                                    <XAxis dataKey="section" stroke="#9CA3AF" fontSize={12} />
                                    <YAxis stroke="#9CA3AF" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1F2937',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: '#F9FAFB',
                                        }}
                                    />
                                    <Bar dataKey="feed" name="Yem (kg)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* Mortality Trend */}
                        <ChartCard title="O'lim Dinamikasi" icon={LineChart}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ReLineChart data={dummyMortalityData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                                    <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} />
                                    <YAxis stroke="#9CA3AF" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1F2937',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: '#F9FAFB',
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="rate"
                                        name="O'lim %"
                                        stroke="#A855F7"
                                        strokeWidth={2}
                                        dot={{ fill: '#A855F7', strokeWidth: 0 }}
                                    />
                                </ReLineChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* Forecast vs Actual */}
                        <ChartCard title="Bashorat vs Haqiqat" icon={Target}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ReLineChart data={dummyForecastData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                                    <XAxis dataKey="week" stroke="#9CA3AF" fontSize={12} />
                                    <YAxis stroke="#9CA3AF" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1F2937',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: '#F9FAFB',
                                        }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="forecast"
                                        name="Bashorat"
                                        stroke="#3B82F6"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="actual"
                                        name="Haqiqat"
                                        stroke="#22C55E"
                                        strokeWidth={2}
                                    />
                                </ReLineChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </motion.div>

                    {/* Sections Overview */}
                    <motion.div variants={itemVariants}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Factory className="h-5 w-5 text-gray-500" />
                                Sexlar Ko'rinishi
                            </h2>
                            <button className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                                Barchasini ko'rish →
                            </button>
                        </div>

                        <motion.div
                            variants={containerVariants}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
                        >
                            {dummySections.map((section) => (
                                <SectionCard
                                    key={section.id}
                                    name={section.name}
                                    status={section.status}
                                />
                            ))}
                        </motion.div>
                    </motion.div>
                </motion.div>
            </div>
        </PermissionGuard>
    );
}

// ============================================
// ACCESS DENIED COMPONENT
// ============================================
function AccessDenied() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
            <div className="text-center">
                <div className="inline-flex p-4 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                    <Activity className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Ruxsat yo'q
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    Bu sahifani ko'rish uchun DASHBOARD_READ ruxsati kerak.
                </p>
            </div>
        </div>
    );
}
