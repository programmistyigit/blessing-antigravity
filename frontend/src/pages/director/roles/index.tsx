import { motion } from 'framer-motion';
import { Shield, Plus, Edit2, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRoles } from '@/hooks';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

// Format salary as currency
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
}

export default function RolesPage() {
    const navigate = useNavigate();
    const { data: roles, isLoading, isError, error, refetch } = useRoles();

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
                    {error?.message || 'Backenddan javob kelmadi'}
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
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Shield className="h-6 w-6" />
                        Lavozimlar
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Jami: {roles?.length || 0} ta lavozim
                    </p>
                </div>
                <button
                    onClick={() => navigate('/director/roles/new')}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Yangi lavozim
                </button>
            </motion.div>

            {/* Table */}
            <motion.div
                variants={itemVariants}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
                {isLoading ? (
                    <div className="p-4 space-y-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-14 bg-slate-50 dark:bg-slate-800 rounded animate-pulse" />
                        ))}
                    </div>
                ) : roles && roles.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400">
                        Lavozimlar mavjud emas
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Nomi</th>
                                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Permissionlar</th>
                                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Asosiy Oylik</th>
                                <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Amal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {roles?.map((role) => (
                                <tr key={role.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                                {role.name}
                                            </span>
                                            {role.canCreateUsers && (
                                                <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
                                                    +Users
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">
                                            {role.permissions.length} ta
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(role.baseSalary)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => navigate(`/director/roles/${role.id}/edit`)}
                                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </motion.div>
        </motion.div>
    );
}
