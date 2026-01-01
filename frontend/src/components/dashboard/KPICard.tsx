import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
    loading?: boolean;
}

const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
};

export function KPICard({
    title,
    value,
    icon: Icon,
    trend,
    color = 'blue',
    loading = false,
}: KPICardProps) {
    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="animate-pulse">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                    </div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
        >
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {title}
                </span>
                <div className={`p-2.5 rounded-lg ${colorClasses[color]}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>

            <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {value}
                </span>

                {trend && (
                    <div
                        className={`flex items-center text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'
                            }`}
                    >
                        <span>{trend.isPositive ? '↑' : '↓'}</span>
                        <span>{Math.abs(trend.value)}%</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// Skeleton version for loading states
export function KPICardSkeleton() {
    return <KPICard title="" value="" icon={Loader2} loading />;
}
