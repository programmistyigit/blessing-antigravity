import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, ArrowLeft, Package, Users, ClipboardList, Wrench, Plus, Loader2, AlertCircle, Calendar, Bird } from 'lucide-react';
import { useSection, useSectionBatches, useCreateBatch, useUsers } from '@/hooks';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

type TabType = 'batches' | 'workers' | 'reports' | 'equipment';

const tabs: { id: TabType; label: string; icon: typeof Package }[] = [
    { id: 'batches', label: 'Partiyalar', icon: Package },
    { id: 'workers', label: 'Ishchilar', icon: Users },
    { id: 'reports', label: 'Kunlik holat', icon: ClipboardList },
    { id: 'equipment', label: 'Uskunalar', icon: Wrench },
];

const batchStatusColors: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    PARTIAL_OUT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    CLOSED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export default function SectionDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: section, isLoading: sectionLoading, isError } = useSection(id);
    const { data: batches, isLoading: batchesLoading } = useSectionBatches(id);
    const { data: users } = useUsers();
    const createBatch = useCreateBatch();

    const [activeTab, setActiveTab] = useState<TabType>('batches');
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [batchForm, setBatchForm] = useState({
        name: '',
        expectedEndAt: '',
        totalChicksIn: '',
    });

    // Filter workers assigned to this section
    const assignedWorkers = users?.filter(u => section?.assignedWorkers?.includes(u._id)) || [];

    // Check if section can create batch
    const canCreateBatch = section?.activePeriodId && !section?.activeBatchId;

    const handleCreateBatch = async () => {
        if (!id || createBatch.isPending) return;
        if (!batchForm.name || !batchForm.expectedEndAt || !batchForm.totalChicksIn) return;

        try {
            await createBatch.mutateAsync({
                name: batchForm.name,
                sectionId: id,
                expectedEndAt: new Date(batchForm.expectedEndAt).toISOString(),
                totalChicksIn: parseInt(batchForm.totalChicksIn),
            });
            setShowBatchModal(false);
            setBatchForm({ name: '', expectedEndAt: '', totalChicksIn: '' });
        } catch (err) {
            console.error('Create batch error:', err);
        }
    };

    if (sectionLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (isError || !section) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                <p className="text-sm text-slate-500">Sex topilmadi</p>
            </div>
        );
    }

    const activeBatches = batches?.filter(b => b.status === 'ACTIVE' || b.status === 'PARTIAL_OUT') || [];
    const closedBatches = batches?.filter(b => b.status === 'CLOSED') || [];

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                    <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Building2 className="h-6 w-6" />
                        {section.name}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Status: <span className="font-medium">{section.status}</span>
                        {section.activePeriodId ? ' • Davr biriktirilgan' : ' • Davr biriktirilmagan'}
                    </p>
                </div>
            </motion.div>

            {/* No Period Warning */}
            {!section.activePeriodId && (
                <motion.div variants={itemVariants} className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-400">
                    ⚠️ Bu sex hech qanday davrga biriktirilmagan. Partiya yaratish uchun avval sexni davrga biriktiring.
                </motion.div>
            )}

            {/* Tabs */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab.id
                                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </motion.div>

            {/* Tab Content */}
            <motion.div variants={itemVariants}>
                {activeTab === 'batches' && (
                    <div className="space-y-4">
                        {/* Create Batch Button */}
                        {canCreateBatch && (
                            <button
                                onClick={() => setShowBatchModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
                            >
                                <Plus className="h-4 w-4" />
                                Yangi partiya yaratish
                            </button>
                        )}

                        {/* Active Batches */}
                        {activeBatches.length > 0 && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800">
                                    <h3 className="font-medium text-emerald-700 dark:text-emerald-300">Faol Partiyalar</h3>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {activeBatches.map(batch => (
                                        <div key={batch._id} className="p-4 flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-slate-800 dark:text-slate-100">{batch.name || `Partiya #${batch._id.slice(-6)}`}</p>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <Bird className="h-3 w-3" /> {batch.totalChicksIn.toLocaleString()} ta
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" /> {new Date(batch.startedAt).toLocaleDateString('uz-UZ')}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded ${batchStatusColors[batch.status]}`}>
                                                {batch.status === 'ACTIVE' ? 'Faol' : 'Qisman chiqarilgan'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Closed Batches */}
                        {closedBatches.length > 0 && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <h3 className="font-medium text-slate-600 dark:text-slate-400">Yopilgan Partiyalar ({closedBatches.length})</h3>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {closedBatches.slice(0, 5).map(batch => (
                                        <div key={batch._id} className="p-4 flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-slate-700 dark:text-slate-300">{batch.name || `Partiya #${batch._id.slice(-6)}`}</p>
                                                <p className="text-xs text-slate-400">{new Date(batch.startedAt).toLocaleDateString('uz-UZ')}</p>
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded ${batchStatusColors.CLOSED}`}>Yopilgan</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {batchesLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                            </div>
                        ) : batches?.length === 0 && (
                            <div className="p-8 text-center text-sm text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                                Hali partiya yaratilmagan
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'workers' && (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="font-medium text-slate-700 dark:text-slate-300">Biriktirilgan Ishchilar ({assignedWorkers.length})</h3>
                        </div>
                        {assignedWorkers.length === 0 ? (
                            <div className="p-8 text-center text-sm text-slate-400">
                                Hali ishchi biriktirilmagan
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {assignedWorkers.map(worker => (
                                    <div key={worker._id} className="p-4 flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-medium">
                                            {worker.fullName?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-700 dark:text-slate-300">{worker.fullName}</p>
                                            <p className="text-xs text-slate-400">{worker.username}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className="p-8 text-center text-sm text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        Kunlik hisobotlar — keyingi bosqichda
                    </div>
                )}

                {activeTab === 'equipment' && (
                    <div className="p-8 text-center text-sm text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        Uskunalar — keyingi bosqichda
                    </div>
                )}
            </motion.div>

            {/* Create Batch Modal */}
            {showBatchModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md p-6"
                    >
                        <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Yangi Partiya
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Partiya nomi *</label>
                                <input
                                    type="text"
                                    value={batchForm.name}
                                    onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                                    placeholder="Masalan: 2024-01 Partiya"
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Jojalar soni *</label>
                                <input
                                    type="number"
                                    value={batchForm.totalChicksIn}
                                    onChange={(e) => setBatchForm({ ...batchForm, totalChicksIn: e.target.value })}
                                    placeholder="20000"
                                    min="1"
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kutilgan tugash sanasi *</label>
                                <input
                                    type="date"
                                    value={batchForm.expectedEndAt}
                                    onChange={(e) => setBatchForm({ ...batchForm, expectedEndAt: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={handleCreateBatch}
                                disabled={createBatch.isPending || !batchForm.name || !batchForm.expectedEndAt || !batchForm.totalChicksIn}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50"
                            >
                                {createBatch.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                Yaratish
                            </button>
                            <button
                                onClick={() => { setShowBatchModal(false); setBatchForm({ name: '', expectedEndAt: '', totalChicksIn: '' }); }}
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
