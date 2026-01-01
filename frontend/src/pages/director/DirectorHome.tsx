import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    Wheat,
    Skull,
    Factory,
    ChevronRight,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { useCompanyDashboard } from '@/hooks';

// Animation variants - subtle
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const },
    },
};

// Tooltip style
const tooltipStyle = {
    contentStyle: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        border: 'none',
        borderRadius: '8px',
        fontSize: '12px',
        padding: '8px 12px',
    },
    itemStyle: { color: '#e2e8f0' },
    labelStyle: { color: '#94a3b8', marginBottom: '4px' },
};

// Status config
const statusColors: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
    CLEANING: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    EMPTY: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
    PREPARING: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
};

// KPI Card - subtle, professional
interface KPIProps {
    label: string;
    value: string;
    trend?: { value: number; up: boolean };
    icon: React.ElementType;
    loading?: boolean;
}

function KPICard({ label, value, trend, icon: Icon, loading }: KPIProps) {
    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.01, y: -2 }}
            transition={{ duration: 0.15 }}
            className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800"
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {label}
                </span>
                <div className="p-1.5 rounded-md bg-slate-50 dark:bg-slate-800">
                    <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
                </div>
            </div>
            <div className="flex items-end justify-between">
                {loading ? (
                    <div className="h-7 w-20 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                ) : (
                    <span className="text-xl font-semibold text-slate-800 dark:text-slate-100">{value}</span>
                )}
                {trend && !loading && (
                    <div className={`flex items-center gap-0.5 text-xs font-medium ${trend.up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                        }`}>
                        {trend.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        <span>{trend.value}%</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// Chart container
function ChartCard({ title, children, loading }: { title: string; children: React.ReactNode; loading?: boolean }) {
    return (
        <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800"
        >
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">{title}</h3>
            {loading ? (
                <div className="h-52 bg-slate-50 dark:bg-slate-800 rounded animate-pulse" />
            ) : (
                children
            )}
        </motion.div>
    );
}

// Skeleton Card
function SkeletonCard() {
    return (
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
            <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded mb-3 animate-pulse" />
            <div className="h-7 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        </motion.div>
    );
}

export default function DirectorHome() {
    const { data, isLoading, isError, error, refetch } = useCompanyDashboard();

    // Transform data for charts
    const feedChartData = data?.sectionsSummary?.map(s => ({
        section: s.name,
        value: s.attendance || 0,
    })) || [];

    // Calculate active sections
    const activeSectionsCount = data?.sectionsSummary?.length || 0;
    const totalSections = 6; // Mock total

    // Error State
    if (isError) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20"
            >
                <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                    Ma'lumot yuklanmadi
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 text-center max-w-md">
                    {error?.message || 'Backend bilan aloqa yo\'q. Backendni ishga tushiring.'}
                </p>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                >
                    <RefreshCw className="h-4 w-4" />
                    Qayta yuklash
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 max-w-7xl mx-auto"
        >
            {/* Header */}
            <motion.div variants={itemVariants}>
                <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                    Boshqaruv Pulti
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Korxona holati va asosiy ko'rsatkichlar
                </p>
            </motion.div>

            {/* KPI Cards */}
            <motion.div
                variants={containerVariants}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
            >
                {isLoading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : (
                    <>
                        <KPICard
                            label="Jami yem"
                            value={`${((data?.metrics?.totalFeed || 0) / 1000).toFixed(1)}t`}
                            icon={Wheat}
                        />
                        <KPICard
                            label="O'lim"
                            value={`${data?.metrics?.totalDeaths || 0}`}
                            icon={Skull}
                            trend={data?.metrics?.totalDeaths && data.metrics.totalDeaths > 50 ? { value: 12, up: true } : undefined}
                        />
                        <KPICard
                            label="O'rtacha vazn"
                            value={`${(data?.metrics?.avgWeight || 0).toFixed(0)}g`}
                            icon={TrendingUp}
                        />
                        <KPICard
                            label="Davomat"
                            value={`${data?.attendance?.present || 0}/${data?.attendance?.totalRecords || 0}`}
                            icon={TrendingDown}
                        />
                        <KPICard
                            label="Faol sexlar"
                            value={`${activeSectionsCount}/${totalSections}`}
                            icon={Factory}
                        />
                    </>
                )}
            </motion.div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Attendance by Section */}
                <ChartCard title="Sexlar bo'yicha davomat" loading={isLoading}>
                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={feedChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                                <XAxis dataKey="section" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip {...tooltipStyle} />
                                <Bar dataKey="value" name="Davomat" fill="#64748b" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                {/* Resource Usage */}
                <ChartCard title="Resurs iste'moli" loading={isLoading}>
                    <div className="h-52 flex items-center justify-center">
                        <div className="grid grid-cols-3 gap-4 text-center w-full">
                            <div>
                                <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                                    {((data?.metrics?.totalFeed || 0) / 1000).toFixed(1)}
                                </p>
                                <p className="text-xs text-slate-500">Yem (t)</p>
                            </div>
                            <div>
                                <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                                    {((data?.metrics?.totalWater || 0) / 1000).toFixed(1)}
                                </p>
                                <p className="text-xs text-slate-500">Suv (m³)</p>
                            </div>
                            <div>
                                <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                                    {data?.metrics?.totalElectricity?.toFixed(0) || 0}
                                </p>
                                <p className="text-xs text-slate-500">Elektr (kWh)</p>
                            </div>
                        </div>
                    </div>
                </ChartCard>
            </div>

            {/* Bottom: Sections + Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Sections */}
                <motion.div
                    variants={itemVariants}
                    className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[calc(100vh-20rem)]"
                >
                    <div className="flex items-center justify-between mb-4 flex-shrink-0">
                        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Sexlar</h3>
                        <button className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                            Barchasi →
                        </button>
                    </div>
                    <div className="overflow-y-auto flex-1 pr-1">
                        {isLoading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="h-12 bg-slate-50 dark:bg-slate-800 rounded-lg animate-pulse" />
                                ))}
                            </div>
                        ) : data?.sectionsSummary && data.sectionsSummary.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {data.sectionsSummary.map((s) => (
                                    <div
                                        key={s.id}
                                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    >
                                        <div>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{s.name}</span>
                                            <span className={`ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded ${statusColors['ACTIVE']}`}>
                                                Faol
                                            </span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-slate-400" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 text-center py-4">Faol sex yo'q</p>
                        )}
                    </div>
                </motion.div>

                {/* Alerts */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[calc(100vh-20rem)]"
                >
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2 flex-shrink-0">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        Ogohlantirish
                    </h3>
                    <div className="overflow-y-auto flex-1 pr-1">
                        {isLoading ? (
                            <div className="space-y-2">
                                <div className="h-16 bg-slate-50 dark:bg-slate-800 rounded animate-pulse" />
                                <div className="h-16 bg-slate-50 dark:bg-slate-800 rounded animate-pulse" />
                            </div>
                        ) : data?.alerts && data.alerts.length > 0 ? (
                            <div className="space-y-2">
                                {data.alerts.map((a, i) => (
                                    <div
                                        key={i}
                                        className={`p-2.5 rounded-lg text-xs ${a.severity === 'critical'
                                            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                            : a.severity === 'warning'
                                                ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                                                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                            }`}
                                    >
                                        <p className="font-medium">{a.message}</p>
                                        <p className="opacity-60 mt-0.5">{a.type}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 text-center py-4">Hozircha yo'q</p>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Low Stock Inventory */}
            {data?.inventory?.criticalItems && data.inventory.criticalItems.length > 0 && (
                <motion.div
                    key="low-stock"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                    className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4"
                >
                    <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Kam qolgan zaxiralar ({data.inventory.lowStockCount})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {data.inventory.criticalItems.map((item, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 rounded-lg p-2 text-sm">
                                <p className="font-medium text-slate-800 dark:text-slate-100">{item.name}</p>
                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                    {item.quantity} / {item.minThreshold} min
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
