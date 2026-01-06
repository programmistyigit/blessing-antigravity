import { motion } from 'framer-motion';
import { Users, Plus, Search, Edit, Check, X, RefreshCw, AlertCircle, LayoutGrid, Table2, DollarSign, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUsers, useViewMode } from '@/hooks';
import { useState } from 'react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
}

export default function EmployeesPage() {
    const navigate = useNavigate();
    const { data: users, isLoading, isError, error, refetch } = useUsers();
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useViewMode('employees', 'table');

    // Filter users by search
    const filteredUsers = users?.filter(user =>
        user.fullName.toLowerCase().includes(search.toLowerCase()) ||
        user.username.toLowerCase().includes(search.toLowerCase())
    ) || [];

    if (isError) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Ma'lumot yuklanmadi</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 text-center max-w-md">{error?.message || 'Backenddan javob kelmadi'}</p>
                <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors">
                    <RefreshCw className="h-4 w-4" />Qayta yuklash
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
                <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-400'}`}
                        >
                            <Table2 className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('card')}
                            className={`p-1.5 rounded ${viewMode === 'card' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-400'}`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                    </div>
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

            {/* Loading */}
            {isLoading ? (
                <motion.div variants={itemVariants} className={viewMode === 'card' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3'}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`${viewMode === 'card' ? 'h-36' : 'h-12'} bg-slate-50 dark:bg-slate-800 rounded-xl animate-pulse`} />
                    ))}
                </motion.div>
            ) : filteredUsers.length === 0 ? (
                <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-400">
                    {search ? 'Natija topilmadi' : 'Ishchilar mavjud emas'}
                </motion.div>
            ) : viewMode === 'card' ? (
                /* Card View */
                <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredUsers.map((user) => (
                        <motion.div
                            key={user._id}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => navigate(`/director/employees/${user._id}/edit`)}
                            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 cursor-pointer hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                                    {user.fullName.charAt(0).toUpperCase()}
                                </div>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${user.isActive ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                    {user.isActive ? 'Faol' : 'Nofaol'}
                                </span>
                            </div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-0.5">{user.fullName}</h3>
                            <p className="text-xs text-slate-400 mb-2">@{user.username}</p>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded">
                                    <Shield className="h-3 w-3" />
                                    {user.role?.name || '-'}
                                </span>
                            </div>
                            {user.role?.baseSalary && (
                                <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                    <DollarSign className="h-3 w-3" />
                                    {formatCurrency(user.role.baseSalary)}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                /* Table View */
                <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Ism</th>
                                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Username</th>
                                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Lavozim</th>
                                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Oylik</th>
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
                                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                            {user.role?.baseSalary ? formatCurrency(user.role.baseSalary) : '-'}
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
                                        <button
                                            onClick={() => navigate(`/director/employees/${user._id}/edit`)}
                                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>
            )}
        </motion.div>
    );
}
