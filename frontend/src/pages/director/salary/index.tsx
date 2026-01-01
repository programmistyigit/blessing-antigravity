import { motion } from 'framer-motion';
import { Wallet, Calendar } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function SalaryPage() {
    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Wallet className="h-7 w-7" />
                        Ish haqi
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Maosh, avans va bonuslar</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <Calendar className="h-4 w-4" />
                    Davr tanlash
                </button>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                <Wallet className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Ish haqi bo'limi</h3>
                <p className="text-gray-500 dark:text-gray-400">
                    Bu yerda ishchilar maoshlari, avanslar va bonuslar ko'rsatiladi.
                </p>
            </motion.div>
        </motion.div>
    );
}
