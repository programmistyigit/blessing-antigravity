import { motion } from 'framer-motion';
import { TrendingUp, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const forecastData = [
    { week: 'H1', weight: 200, forecast: 220 },
    { week: 'H2', weight: 450, forecast: 480 },
    { week: 'H3', weight: 900, forecast: 950 },
    { week: 'H4', weight: 1400, forecast: 1500 },
    { week: 'H5', weight: 1900, forecast: 2000 },
    { week: 'H6', weight: 2400, forecast: 2500 },
];

const tooltipStyle = {
    contentStyle: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        border: 'none',
        borderRadius: '8px',
        fontSize: '12px',
    },
    itemStyle: { color: '#e2e8f0' },
};

export default function ForecastPage() {
    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <TrendingUp className="h-6 w-6" />
                        Prognoz
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Vazn va sotish bashorati</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <Calendar className="h-4 w-4" />
                    Davr tanlash
                </button>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Kutilayotgan vazn</p>
                    <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mt-1">2,500 g</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Kutilayotgan daromad</p>
                    <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 mt-1">285M so'm</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Kutilayotgan foyda</p>
                    <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mt-1">85M so'm</p>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Vazn o'sish bashorati</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={forecastData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                            <XAxis dataKey="week" stroke="#64748b" fontSize={11} />
                            <YAxis stroke="#64748b" fontSize={11} />
                            <Tooltip {...tooltipStyle} />
                            <Line type="monotone" dataKey="forecast" name="Bashorat" stroke="#64748b" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                            <Line type="monotone" dataKey="weight" name="Haqiqiy" stroke="#3b82f6" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </motion.div>
    );
}
