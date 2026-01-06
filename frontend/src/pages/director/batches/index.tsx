import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, Calendar, XCircle, Loader2, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSections, useAllBatches, useCloseBatch } from '@/hooks';
import type { BatchStatus } from '@/services/batches.service';

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
    OPEN: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    CLOSED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

type StatusFilter = 'ACTIVE' | 'ALL';

export default function BatchesPage() {
    const navigate = useNavigate();
    const { data: sections } = useSections();
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVE');
    const [sectionFilter, setSectionFilter] = useState('');
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [closingBatchId, setClosingBatchId] = useState<string | null>(null);

    // Fetch all batches - ACTIVE by default, or all
    const batchStatus: BatchStatus | undefined = statusFilter === 'ACTIVE' ? 'ACTIVE' : undefined;
    const { data: batches, isLoading, isError, refetch } = useAllBatches(batchStatus);
    const closeBatch = useCloseBatch();

    const activeSections = sections?.filter(s => !s.isArchived) || [];

    // Filter by section if selected
    const filteredBatches = batches?.filter(batch => {
        if (!sectionFilter) return true;
        const sectionId = typeof batch.sectionId === 'string' ? batch.sectionId : batch.sectionId._id;
        return sectionId === sectionFilter;
    }) || [];

    // Helper to get section name
    const getSectionName = (batch: (typeof filteredBatches)[number]) => {
        if (typeof batch.sectionId === 'object' && batch.sectionId?.name) {
            return batch.sectionId.name;
        }
        const section = sections?.find(s => s._id === batch.sectionId);
        return section?.name || '—';
    };

    const handleCloseBatch = async () => {
        if (!closingBatchId) return;
        try {
            await closeBatch.mutateAsync({ id: closingBatchId });
            setShowCloseModal(false);
            setClosingBatchId(null);
            refetch();
        } catch (err) {
            console.error('Close batch error:', err);
        }
    };

    const openCloseModal = (batchId: string) => {
        setClosingBatchId(batchId);
        setShowCloseModal(true);
    };

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Package className="h-6 w-6" />
                        Partiyalar
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Ishlab chiqarish sikllari</p>
                </div>
                <button
                    onClick={() => navigate('/director/batches/new')}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Yangi partiya
                </button>
            </motion.div>

            {/* Filters */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
                {/* Status Filter */}
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-400" />
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        <button
                            onClick={() => setStatusFilter('ACTIVE')}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${statusFilter === 'ACTIVE'
                                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                                : 'text-slate-500 dark:text-slate-400'
                                }`}
                        >
                            Faol
                        </button>
                        <button
                            onClick={() => setStatusFilter('ALL')}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${statusFilter === 'ALL'
                                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                                : 'text-slate-500 dark:text-slate-400'
                                }`}
                        >
                            Hammasi
                        </button>
                    </div>
                </div>

                {/* Section Filter */}
                <div className="flex-1 max-w-xs">
                    <select
                        value={sectionFilter}
                        onChange={(e) => setSectionFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    >
                        <option value="">Barcha sexlar</option>
                        {activeSections.map(section => (
                            <option key={section._id} value={section._id}>{section.name}</option>
                        ))}
                    </select>
                </div>
            </motion.div>

            {/* Batches Table */}
            <motion.div
                variants={itemVariants}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
                {isError ? (
                    <div className="p-8 text-center">
                        <p className="text-sm text-red-500 mb-3">Ma'lumot yuklanmadi</p>
                        <button onClick={() => refetch()} className="text-sm text-blue-600 hover:underline">
                            Qayta yuklash
                        </button>
                    </div>
                ) : isLoading ? (
                    <div className="p-4 space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-12 bg-slate-50 dark:bg-slate-800 rounded animate-pulse" />
                        ))}
                    </div>
                ) : filteredBatches.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400">
                        {statusFilter === 'ACTIVE' ? 'Faol partiyalar mavjud emas' : 'Partiyalar topilmadi'}
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Sex</th>
                                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Boshlanish</th>
                                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Tugash</th>
                                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Jojalar</th>
                                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Status</th>
                                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Amal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredBatches.map((batch) => (
                                <tr key={batch._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100">
                                        {getSectionName(batch)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                        {new Date(batch.startedAt).toLocaleDateString('uz-UZ')}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                                        {batch.endedAt
                                            ? new Date(batch.endedAt).toLocaleDateString('uz-UZ')
                                            : new Date(batch.expectedEndAt).toLocaleDateString('uz-UZ') + ' (kutilmoqda)'
                                        }
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                                        {batch.totalChicksIn.toLocaleString()} ta
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-0.5 rounded ${statusColors[batch.status] || statusColors.ACTIVE}`}>
                                            {batch.status === 'ACTIVE' || batch.status === 'PARTIAL_OUT' ? 'Faol' : 'Yopilgan'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 flex items-center gap-2">
                                        <button
                                            onClick={() => navigate(`/director/batches/${batch._id}`)}
                                            className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                        >
                                            Ko'rish
                                        </button>
                                        {batch.status === 'ACTIVE' && (
                                            <button
                                                onClick={() => openCloseModal(batch._id)}
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
                )}
            </motion.div>

            {/* Close Confirmation Modal */}
            {showCloseModal && (
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
                                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Partiyani yopish</h3>
                                <p className="text-sm text-slate-500">Bu amalni bekor qilib bo'lmaydi</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleCloseBatch}
                                disabled={closeBatch.isPending}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
                            >
                                {closeBatch.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                Yopish
                            </button>
                            <button
                                onClick={() => { setShowCloseModal(false); setClosingBatchId(null); }}
                                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                            >
                                Bekor
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}
