import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserCog, ArrowLeft, Loader2, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUsers, useSections, useAssignWorkersToSection } from '@/hooks';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function AssignEmployeePage() {
    const navigate = useNavigate();
    const { data: users, isLoading: usersLoading, isError: usersError, refetch: refetchUsers } = useUsers();
    const { data: sections, isLoading: sectionsLoading } = useSections();
    const assignWorkers = useAssignWorkersToSection();

    const [selectedSection, setSelectedSection] = useState('');
    const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const toggleWorker = (id: string) => {
        setSelectedWorkers(prev =>
            prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
        );
        setError('');
        setSuccess(false);
    };

    const handleSubmit = async () => {
        if (!selectedSection) {
            setError('Sex tanlang');
            return;
        }
        if (selectedWorkers.length === 0) {
            setError('Kamida bitta ishchini tanlang');
            return;
        }

        try {
            await assignWorkers.mutateAsync({
                sectionId: selectedSection,
                workerIds: selectedWorkers,
            });
            setSuccess(true);
            setSelectedWorkers([]);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } } };
            setError(error?.response?.data?.error || 'Xatolik yuz berdi');
        }
    };

    // Error state for users loading
    if (usersError) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20"
            >
                <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Ishchilar yuklanmadi</p>
                <button
                    onClick={() => refetchUsers()}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg"
                >
                    <RefreshCw className="h-4 w-4" />
                    Qayta yuklash
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={itemVariants} className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/director/employees')}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <UserCog className="h-6 w-6" />
                        Sexga Biriktirish
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Ishchilarni sexlarga tayinlash</p>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Section Selection */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Sex tanlang</h3>
                    {sectionsLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-12 bg-slate-50 dark:bg-slate-800 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {sections?.filter(s => !s.isArchived).map((section) => (
                                <div
                                    key={section._id}
                                    onClick={() => setSelectedSection(section._id)}
                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedSection === section._id
                                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                                        : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${selectedSection === section._id
                                        ? 'border-white dark:border-slate-900'
                                        : 'border-slate-400'
                                        }`}>
                                        {selectedSection === section.id && (
                                            <div className="h-2 w-2 rounded-full bg-white dark:bg-slate-900" />
                                        )}
                                    </div>
                                    <span className="text-sm font-medium">{section.name}</span>
                                    <span className="text-xs opacity-60 ml-auto">{section.status}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Worker Selection */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        Ishchilar ({selectedWorkers.length} tanlandi)
                    </h3>
                    {usersLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-12 bg-slate-50 dark:bg-slate-800 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {users?.filter(u => u.isActive).map((user) => (
                                <div
                                    key={user._id}
                                    onClick={() => toggleWorker(user._id)}
                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedWorkers.includes(user._id)
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                                        : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <div className={`h-5 w-5 rounded border-2 flex items-center justify-center ${selectedWorkers.includes(user._id)
                                        ? 'bg-emerald-500 border-emerald-500'
                                        : 'border-slate-300 dark:border-slate-600'
                                        }`}>
                                        {selectedWorkers.includes(user._id) && (
                                            <Check className="h-3 w-3 text-white" />
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{user.fullName}</span>
                                        <span className="text-xs text-slate-400 ml-2">@{user.username}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Actions */}
            <motion.div variants={itemVariants}>
                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        Ishchilar muvaffaqiyatli biriktirildi
                    </div>
                )}
                <button
                    onClick={handleSubmit}
                    disabled={assignWorkers.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                    {assignWorkers.isPending ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Biriktirilmoqda...
                        </>
                    ) : (
                        'Biriktirish'
                    )}
                </button>
            </motion.div>
        </motion.div>
    );
}
