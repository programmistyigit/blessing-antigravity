import { motion } from 'framer-motion';
import { GitCompare, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const comparisonData = [
    { section: '1-Sex', plan: 95, actual: 92 },
    { section: '2-Sex', plan: 90, actual: 88 },
    { section: '3-Sex', plan: 92, actual: 95 },
    { section: '5-Sex', plan: 88, actual: 85 },
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

export default function ComparisonPage() {
    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <GitCompare className="h-6 w-6" />
                        Reja vs Haqiqat
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Rejaga nisbatan haqiqiy natijalar</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <Calendar className="h-4 w-4" />
                    Davr tanlash
                </button>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Reja bajarilishi</p>
                    <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mt-1">94.5%</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">+2.1% o'tgan oylarga nisbatan</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Farq</p>
                    <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400 mt-1">-5.5%</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Rejadan past</p>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Sexlar bo'yicha solishtirish (%)</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                            <XAxis dataKey="section" stroke="#64748b" fontSize={11} />
                            <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                            <Tooltip {...tooltipStyle} />
                            <Legend />
                            <Bar dataKey="plan" name="Reja" fill="#64748b" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="actual" name="Haqiqiy" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </motion.div>
    );
}
