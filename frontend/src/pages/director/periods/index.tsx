import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, RefreshCw, AlertCircle, Calendar, XCircle, Loader2, LayoutGrid, List, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePeriods, useClosePeriod, useViewMode } from '@/hooks';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

const statusColors: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    CLOSED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export default function PeriodsPage() {
    const navigate = useNavigate();
    const { data: periods, isLoading, isError, refetch } = usePeriods();
    const closePeriod = useClosePeriod();

    const [viewMode, setViewMode] = useViewMode('periods', 'table');
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [closingPeriodId, setClosingPeriodId] = useState<string | null>(null);
    const [closingPeriodName, setClosingPeriodName] = useState('');

    const handleClosePeriod = async () => {
        if (!closingPeriodId || closePeriod.isPending) return;
        try {
            await closePeriod.mutateAsync(closingPeriodId);
            setShowCloseModal(false);
            setClosingPeriodId(null);
            setClosingPeriodName('');
        } catch (err) {
            console.error('Close period error:', err);
        }
    };

    const openCloseModal = (periodId: string, name: string) => {
        setClosingPeriodId(periodId);
        setClosingPeriodName(name);
        setShowCloseModal(true);
    };

    // Sort periods: ACTIVE first, then by startDate descending
    const sortedPeriods = periods?.slice().sort((a, b) => {
        if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
        if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });

    if (isError) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Ma'lumot yuklanmadi</p>
                <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg">
                    <RefreshCw className="h-4 w-4" /> Qayta yuklash
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
                        <Clock className="h-6 w-6" />
                        Davrlar
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Hisob-kitob davrlari</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`}
                        >
                            <List className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('card')}
                            className={`p-2 rounded transition-colors ${viewMode === 'card' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/director/periods/new')}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Yangi davr
                </button>

            </motion.div>

            {/* Info Banner */}
            <motion.div variants={itemVariants} className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-400">
                ℹ️ Davrlar faqat Director tomonidan qo'lda yopiladi. Davr ichiga kirib sexlarni biriktiring.
            </motion.div>

            {/* Content */}
            {
                isLoading ? (
                    <div className="p-4 space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-slate-50 dark:bg-slate-800 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : sortedPeriods?.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400">
                        Hali davr yaratilmagan
                    </div>
                ) : viewMode === 'table' ? (
                    /* TABLE VIEW */
                    <motion.div
                        variants={itemVariants}
                        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                    >
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Nomi</th>
                                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Boshlanish</th>
                                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Tugash</th>
                                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Sexlar</th>
                                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Status</th>
                                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Amal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {sortedPeriods?.map((period) => (
                                    <tr key={period._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100">
                                            {period.name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-slate-400" />
                                            {new Date(period.startDate).toLocaleDateString('uz-UZ')}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                                            {period.endDate ? new Date(period.endDate).toLocaleDateString('uz-UZ') : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                            {period.sections?.length || 0} ta
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-0.5 rounded ${statusColors[period.status] || statusColors.ACTIVE}`}>
                                                {period.status === 'ACTIVE' ? 'Faol' : 'Yopilgan'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 flex items-center gap-2">
                                            <button
                                                onClick={() => navigate(`/director/periods/${period._id}`)}
                                                className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded flex items-center gap-1"
                                            >
                                                <Eye className="h-3 w-3" /> Ko'rish
                                            </button>
                                            {period.status === 'ACTIVE' && (
                                                <button
                                                    onClick={() => openCloseModal(period._id, period.name)}
                                                    className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                >
                                                    Yopish
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                ) : (
                    /* CARDS VIEW */
                    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedPeriods?.map((period) => (
                            <motion.div
                                key={period._id}
                                whileHover={{ scale: 1.02 }}
                                className={`p-4 rounded-xl border cursor-pointer transition-all ${period.status === 'ACTIVE'
                                    ? 'bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-900 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                    }`}
                                onClick={() => navigate(`/director/periods/${period._id}`)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-semibold text-slate-800 dark:text-slate-100">{period.name}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            {new Date(period.startDate).toLocaleDateString('uz-UZ')}
                                            {period.endDate ? ` — ${new Date(period.endDate).toLocaleDateString('uz-UZ')}` : ''}
                                        </p>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded ${statusColors[period.status]}`}>
                                        {period.status === 'ACTIVE' ? 'Faol' : 'Yopilgan'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-slate-600 dark:text-slate-400">
                                        <span className="font-medium">{period.sections?.length || 0}</span> ta sex
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/director/periods/${period._id}`); }}
                                            className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded flex items-center gap-1"
                                        >
                                            <Eye className="h-3 w-3" /> Ko'rish
                                        </button>
                                        {period.status === 'ACTIVE' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openCloseModal(period._id, period.name); }}
                                                className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                            >
                                                Yopish
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )
            }

            {/* Close Confirmation Modal */}
            {
                showCloseModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-sm p-4"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                                    <XCircle className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">Davrni yopish</h3>
                                    <p className="text-sm text-slate-500">"{closingPeriodName}" davrini yopmoqchimisiz?</p>
                                </div>
                            </div>

                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-400 mb-4">
                                ⚠️ Bu amalni bekor qilib bo'lmaydi. Davr yopilgandan keyin unga yangi ma'lumot qo'shib bo'lmaydi.
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleClosePeriod}
                                    disabled={closePeriod.isPending}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
                                >
                                    {closePeriod.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                    Yopish
                                </button>
                                <button
                                    onClick={() => { setShowCloseModal(false); setClosingPeriodId(null); setClosingPeriodName(''); }}
                                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                >
                                    Bekor
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )
            }
        </motion.div >
    );
}
