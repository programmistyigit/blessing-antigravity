import { motion } from 'framer-motion';
import { Key, Check } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const permissionGroups = [
    { name: 'Foydalanuvchilar', permissions: ['USER_CREATE', 'USER_UPDATE', 'USER_VIEW'] },
    { name: 'Sexlar', permissions: ['SECTION_CREATE', 'SECTION_UPDATE', 'SECTION_VIEW', 'SECTION_CLOSE'] },
    { name: 'Hisobotlar', permissions: ['REPORT_VIEW', 'REPORT_EXPORT'] },
    { name: 'Moliya', permissions: ['PERIOD_CREATE', 'PERIOD_CLOSE', 'PERIOD_EXPENSE_CREATE'] },
];

export default function PermissionsPage() {
    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={itemVariants}>
                <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Key className="h-6 w-6" />
                    Ruxsatlar
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Tizim ruxsatlari ro'yxati</p>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4">
                {permissionGroups.map((group) => (
                    <div key={group.name} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{group.name}</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                            {group.permissions.map((perm) => (
                                <div key={perm} className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1.5 rounded flex items-center gap-1.5">
                                    <Check className="h-3 w-3 text-emerald-500" />
                                    {perm}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </motion.div>
        </motion.div>
    );
}
