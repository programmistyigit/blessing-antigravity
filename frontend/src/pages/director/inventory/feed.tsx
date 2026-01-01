import { motion } from 'framer-motion';
import { Wheat, Pill, Plus, AlertTriangle } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const feedItems = [
    { id: '1', name: 'Starter yem', quantity: 2500, unit: 'kg', minThreshold: 500, isLow: false },
    { id: '2', name: 'Grower yem', quantity: 300, unit: 'kg', minThreshold: 500, isLow: true },
    { id: '3', name: 'Finisher yem', quantity: 1800, unit: 'kg', minThreshold: 500, isLow: false },
];

const medicineItems = [
    { id: '1', name: 'Vitamin A', quantity: 50, unit: 'litr', minThreshold: 20, isLow: false },
    { id: '2', name: 'Antibiotik', quantity: 15, unit: 'litr', minThreshold: 30, isLow: true },
];

export default function FeedInventoryPage() {
    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Wheat className="h-6 w-6" />
                        Yem va Dori
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Yem va dori zaxiralari</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors">
                    <Plus className="h-4 w-4" />
                    Kirim
                </button>
            </motion.div>

            {/* Feed */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <Wheat className="h-4 w-4" />
                    Yem zaxiralari
                </h3>
                <div className="space-y-2">
                    {feedItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-3">
                                {item.isLow && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
                            </div>
                            <div className="text-right">
                                <span className={`text-sm font-semibold ${item.isLow ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-100'}`}>
                                    {item.quantity.toLocaleString()} {item.unit}
                                </span>
                                <p className="text-xs text-slate-400">min: {item.minThreshold}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Medicine */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <Pill className="h-4 w-4" />
                    Dori zaxiralari
                </h3>
                <div className="space-y-2">
                    {medicineItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-3">
                                {item.isLow && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
                            </div>
                            <div className="text-right">
                                <span className={`text-sm font-semibold ${item.isLow ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-100'}`}>
                                    {item.quantity} {item.unit}
                                </span>
                                <p className="text-xs text-slate-400">min: {item.minThreshold}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}
