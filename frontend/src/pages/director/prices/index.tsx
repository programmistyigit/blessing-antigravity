import { motion } from 'framer-motion';
import { Tag, Plus, History } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const prices = [
    { type: 'FEED', label: 'Yem narxi', value: 5000, unit: 'so\'m/kg', lastUpdated: '2024-12-25' },
    { type: 'WATER', label: 'Suv narxi', value: 500, unit: 'so\'m/m³', lastUpdated: '2024-12-20' },
    { type: 'ELECTRICITY', label: 'Elektr narxi', value: 800, unit: 'so\'m/kWh', lastUpdated: '2024-12-15' },
    { type: 'CHICK_PRICE', label: 'Joja narxi', value: 30000, unit: 'so\'m/kg', lastUpdated: '2024-12-28' },
];

export default function PricesPage() {
    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Tag className="h-6 w-6" />
                        Narxlar
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Joriy narxlar va tarix</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors">
                    <Plus className="h-4 w-4" />
                    Narx yangilash
                </button>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {prices.map((price) => (
                    <div key={price.type} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{price.label}</span>
                            <button className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1">
                                <History className="h-3 w-3" />
                                Tarix
                            </button>
                        </div>
                        <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                            {price.value.toLocaleString()} <span className="text-sm font-normal text-slate-500">{price.unit}</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-2">Yangilangan: {price.lastUpdated}</p>
                    </div>
                ))}
            </motion.div>
        </motion.div>
    );
}
