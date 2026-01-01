import { motion } from 'framer-motion';
import { Package, Plus } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function InventoryPage() {
    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Package className="h-7 w-7" />
                        Ombor
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Yem, dori va boshqa zaxiralar</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
                    <Plus className="h-4 w-4" />
                    Yangi mahsulot
                </button>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Ombor bo'limi</h3>
                <p className="text-gray-500 dark:text-gray-400">
                    Bu yerda ombor zaxiralari ko'rsatiladi: yem, dori, suv va boshqalar.
                </p>
            </motion.div>
        </motion.div>
    );
}
