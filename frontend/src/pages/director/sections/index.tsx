import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Eye, RefreshCw, AlertCircle, Users as UsersIcon, Plus, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSections, useCreateSection } from '@/hooks';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

// Status badge colors
const statusColors: Record<string, string> = {
    EMPTY: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    PREPARING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
    ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    PARTIAL_OUT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
    CLEANING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
};

const statusLabels: Record<string, string> = {
    EMPTY: 'Bo\'sh',
    PREPARING: 'Tayyorlanmoqda',
    ACTIVE: 'Faol',
    PARTIAL_OUT: 'Qisman chiqarilgan',
    CLEANING: 'Tozalanmoqda',
};

export default function SectionsPage() {
    const navigate = useNavigate();
    const { data: sections, isLoading, isError, error, refetch } = useSections();
    const createSection = useCreateSection();

    const [showModal, setShowModal] = useState(false);
    const [sectionName, setSectionName] = useState('');
    const [createError, setCreateError] = useState('');

    // Filter out archived sections
    const activeSections = sections?.filter(s => !s.isArchived) || [];

    const handleCreate = async () => {
        if (!sectionName.trim() || createSection.isPending) return;
        setCreateError('');

        try {
            await createSection.mutateAsync({ name: sectionName.trim() });
            setShowModal(false);
            setSectionName('');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } } };
            setCreateError(error?.response?.data?.error || 'Xatolik yuz berdi');
        }
    };

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
                        <Building2 className="h-6 w-6" />
                        Sexlar
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Jami: {activeSections.length} ta sex
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Yangi sex
                </button>
            </motion.div>

            {/* Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : activeSections.length === 0 ? (
                <motion.div variants={itemVariants} className="text-center py-12">
                    <Building2 className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 mb-4">Hali sex yaratilmagan</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 mx-auto bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
                    >
                        <Plus className="h-4 w-4" />
                        Birinchi sexni yarating
                    </button>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeSections.map((section) => (
                        <motion.div
                            key={section._id}
                            variants={itemVariants}
                            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                                        {section.name}
                                    </h3>
                                    <span className={`text-xs px-2 py-0.5 rounded mt-1 inline-block ${statusColors[section.status] || statusColors.EMPTY}`}>
                                        {statusLabels[section.status] || section.status}
                                    </span>
                                </div>
                                <button
                                    onClick={() => navigate(`/director/sections/${section._id}`)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    <Eye className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                <UsersIcon className="h-4 w-4" />
                                <span>{section.assignedWorkers.length} ishchi</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create Section Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Yangi Sex
                            </h3>
                            <button
                                onClick={() => { setShowModal(false); setSectionName(''); setCreateError(''); }}
                                className="p-1 text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Sex nomi *
                                </label>
                                <input
                                    type="text"
                                    value={sectionName}
                                    onChange={(e) => setSectionName(e.target.value)}
                                    placeholder="Masalan: Sex 1"
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    autoFocus
                                />
                            </div>

                            {createError && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                                    {createError}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={handleCreate}
                                    disabled={createSection.isPending || !sectionName.trim()}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50"
                                >
                                    {createSection.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Plus className="h-4 w-4" />
                                    )}
                                    Yaratish
                                </button>
                                <button
                                    onClick={() => { setShowModal(false); setSectionName(''); setCreateError(''); }}
                                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                >
                                    Bekor
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}
