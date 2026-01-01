import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Search, Edit, Check, X, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '@/hooks';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export default function EmployeesPage() {
    const navigate = useNavigate();
    const { data: users, isLoading, isError, error, refetch } = useUsers();
    const [search, setSearch] = useState('');

    // Filter users by search
    const filteredUsers = users?.filter(user =>
        user.fullName.toLowerCase().includes(search.toLowerCase()) ||
        user.username.toLowerCase().includes(search.toLowerCase())
    ) || [];

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
                        <Users className="h-6 w-6" />
                        Ishchilar
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Jami: {users?.length || 0} ta xodim
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/director/employees/assign')}
                        className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        Sexga biriktirish
                    </button>
                    <button
                        onClick={() => navigate('/director/employees/new')}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Qo'shish
                    </button>
                </div>
            </motion.div>

            {/* Search */}
            <motion.div variants={itemVariants} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Qidirish..."
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600"
                />
            </motion.div>

            {/* Table */}
            <motion.div
                variants={itemVariants}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
                {isLoading ? (
                    <div className="p-4 space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-12 bg-slate-50 dark:bg-slate-800 rounded animate-pulse" />
                        ))}
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400">
                        {search ? 'Natija topilmadi' : 'Ishchilar mavjud emas'}
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Ism</th>
                                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Username</th>
                                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Lavozim</th>
                                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Holat</th>
                                <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Amal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredUsers.map((user) => (
                                <tr key={user._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-4 py-3">
                                        <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{user.fullName}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">{user.username}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
                                            {user.role?.name || '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {user.isActive ? (
                                            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                                <Check className="h-3 w-3" /> Faol
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs text-slate-400">
                                                <X className="h-3 w-3" /> Nofaol
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                            <Edit className="h-4 w-4" />
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
