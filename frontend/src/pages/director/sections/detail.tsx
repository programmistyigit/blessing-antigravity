import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, ArrowLeft, Package, Users, Wrench, Plus, Loader2, AlertCircle, Calendar, Bird, Truck, X, CheckCircle2, DollarSign, TrendingUp, TrendingDown, LineChart } from 'lucide-react';
import { useSection, useSectionBatches, useCreateBatch, useUsers, useSectionChickOuts, useCreateChickOut, useSectionPL } from '@/hooks';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

type TabType = 'batches' | 'workers' | 'equipment';

const tabs: { id: TabType; label: string; icon: typeof Package }[] = [
    { id: 'batches', label: 'Partiyalar', icon: Package },
    { id: 'workers', label: 'Ishchilar', icon: Users },
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
    const { data: section, isLoading: sectionLoading, isError, refetch: refetchSection } = useSection(id);
    const { data: batches, isLoading: batchesLoading, refetch: refetchBatches } = useSectionBatches(id);
    const { data: users } = useUsers();
    const { data: chickOuts, refetch: refetchChickOuts } = useSectionChickOuts(id);
    const { data: plData, isLoading: plLoading } = useSectionPL(id);

    const createBatch = useCreateBatch();
    const createChickOut = useCreateChickOut();

    const [activeTab, setActiveTab] = useState<TabType>('batches');
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [batchForm, setBatchForm] = useState({ name: '', expectedEndAt: '', totalChicksIn: '' });

    // ChickOut Modal - STEP 1 ONLY
    const [showChickOutModal, setShowChickOutModal] = useState(false);
    const [chickOutForm, setChickOutForm] = useState({
        count: '',
        vehicleNumber: '',
        machineNumber: '',
        isFinal: false,
    });
    const [chickOutError, setChickOutError] = useState('');
    const [chickOutSuccess, setChickOutSuccess] = useState(false);



    // Filter workers assigned to this section
    const assignedWorkers = users?.filter(u => section?.assignedWorkers?.includes(u._id)) || [];

    // Check if section can create batch
    const canCreateBatch = section?.activePeriodId && !section?.activeBatchId;

    // Get active batch
    const activeBatch = batches?.find(b => b.status === 'ACTIVE' || b.status === 'PARTIAL_OUT');

    // Incomplete and completed chick-outs
    const incompleteChickOuts = chickOuts?.filter(c => c.status === 'INCOMPLETE') || [];
    const completedChickOuts = chickOuts?.filter(c => c.status === 'COMPLETE') || [];

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
            refetchBatches();
            refetchSection();
        } catch (err) {
            console.error('Create batch error:', err);
        }
    };

    // STEP 1: Create ChickOut (operatsion)
    const handleCreateChickOut = async () => {
        if (!id || createChickOut.isPending) return;
        setChickOutError('');
        setChickOutSuccess(false);

        if (!chickOutForm.count || !chickOutForm.vehicleNumber || !chickOutForm.machineNumber) {
            setChickOutError('Barcha majburiy maydonlarni to\'ldiring');
            return;
        }

        try {
            await createChickOut.mutateAsync({
                sectionId: id,
                payload: {
                    count: parseInt(chickOutForm.count),
                    vehicleNumber: chickOutForm.vehicleNumber,
                    machineNumber: chickOutForm.machineNumber,
                    isFinal: chickOutForm.isFinal,
                }
            });

            setChickOutSuccess(true);
            refetchChickOuts();
            refetchBatches();
            refetchSection();

            // Reset form after 2 seconds
            setTimeout(() => {
                setShowChickOutModal(false);
                setChickOutForm({ count: '', vehicleNumber: '', machineNumber: '', isFinal: false });
                setChickOutSuccess(false);
            }, 2000);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } } };
            setChickOutError(error?.response?.data?.error || 'Xatolik yuz berdi');
        }
    };

    const closeChickOutModal = () => {
        setShowChickOutModal(false);
        setChickOutForm({ count: '', vehicleNumber: '', machineNumber: '', isFinal: false });
        setChickOutError('');
        setChickOutSuccess(false);
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
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
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

            {/* P&L Metrics Dashboard */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jami Daromad</span>
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-bold text-slate-900 dark:text-slate-50">
                            {plLoading ? '...' : `${plData?.totalRevenue?.toLocaleString()} so'm`}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">Sotilgan jo'jalardan</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jami Xarajat</span>
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-bold text-slate-900 dark:text-slate-50">
                            {plLoading ? '...' : `${plData?.totalExpenses?.toLocaleString()} so'm`}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">Yem, suv, elektr va b.</span>
                    </div>
                </div>

                <div className={`bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm ${!plLoading && plData?.isProfitable ? 'ring-1 ring-emerald-500/20' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sof Foyda</span>
                        <div className={`p-2 rounded-lg ${!plLoading && plData?.isProfitable ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
                            {!plLoading && plData?.isProfitable ? (
                                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className={`text-xl font-bold ${!plLoading && plData?.isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {plLoading ? '...' : `${plData?.profit?.toLocaleString()} so'm`}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">Moliyaviy natija</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tannarx (1 jo'ja)</span>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <LineChart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-bold text-slate-900 dark:text-slate-50">
                            {plLoading ? '...' : (plData?.metrics?.costPerAliveChick ? `${plData.metrics.costPerAliveChick.toLocaleString()} so'm` : '-')}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">O'rtacha chiqim</span>
                    </div>
                </div>
            </motion.div>

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
                        {/* Action Buttons */}
                        <div className="flex gap-2 flex-wrap">
                            {canCreateBatch && (
                                <button
                                    onClick={() => setShowBatchModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
                                >
                                    <Plus className="h-4 w-4" />
                                    Yangi partiya
                                </button>
                            )}
                            {activeBatch && (
                                <button
                                    onClick={() => setShowChickOutModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                                >
                                    <Truck className="h-4 w-4" />
                                    Jo'ja chiqarish
                                </button>
                            )}
                        </div>

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
                                                        <Bird className="h-3 w-3" /> {batch.totalChicksIn.toLocaleString()} ta kiritilgan
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

                        {/* Incomplete ChickOuts - Waiting for financial completion */}
                        {incompleteChickOuts.length > 0 && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800 overflow-hidden">
                                <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
                                    <h3 className="font-medium text-amber-700 dark:text-amber-300">
                                        Yakunlanmagan Chiqarishlar ({incompleteChickOuts.length})
                                    </h3>
                                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                                        Moliyaviy ma'lumotlar kutilmoqda
                                    </p>
                                </div>
                                <div className="divide-y divide-amber-100 dark:divide-amber-900/20">
                                    {incompleteChickOuts.map(co => (
                                        <div key={co._id} className="p-4 flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-slate-700 dark:text-slate-300">
                                                    {co.count.toLocaleString()} ta jo'ja
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {new Date(co.date).toLocaleDateString('uz-UZ')} • {co.vehicleNumber}
                                                </p>
                                            </div>
                                            <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                Kutilmoqda
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Completed ChickOuts */}
                        {completedChickOuts.length > 0 && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <h3 className="font-medium text-slate-600 dark:text-slate-400">
                                        Yakunlangan Chiqarishlar ({completedChickOuts.length})
                                    </h3>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {completedChickOuts.slice(0, 5).map(co => (
                                        <div key={co._id} className="p-4 flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-slate-700 dark:text-slate-300">
                                                    {co.count.toLocaleString()} ta • {co.totalWeightKg?.toLocaleString()} kg
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {new Date(co.date).toLocaleDateString('uz-UZ')} • {co.totalRevenue?.toLocaleString()} so'm
                                                </p>
                                            </div>
                                            <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                Yakunlangan
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

                        {batchesLoading && (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                            </div>
                        )}

                        {!batchesLoading && batches?.length === 0 && (
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
                            <div className="p-8 text-center text-sm text-slate-400">Hali ishchi biriktirilmagan</div>
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



                {activeTab === 'equipment' && (
                    <div className="p-8 text-center text-sm text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        Uskunalar — keyingi bosqichda
                    </div>
                )}
            </motion.div>

            {/* Create Batch Modal */}
            {showBatchModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md p-6">
                        <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <Package className="h-5 w-5" /> Yangi Partiya
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Partiya nomi *</label>
                                <input type="text" value={batchForm.name} onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })} placeholder="Masalan: 2024-01 Partiya" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Jojalar soni *</label>
                                <input type="number" value={batchForm.totalChicksIn} onChange={(e) => setBatchForm({ ...batchForm, totalChicksIn: e.target.value })} placeholder="20000" min="1" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kutilgan tugash sanasi *</label>
                                <input type="date" value={batchForm.expectedEndAt} onChange={(e) => setBatchForm({ ...batchForm, expectedEndAt: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-6">
                            <button onClick={handleCreateBatch} disabled={createBatch.isPending || !batchForm.name || !batchForm.expectedEndAt || !batchForm.totalChicksIn} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50">
                                {createBatch.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                Yaratish
                            </button>
                            <button onClick={() => { setShowBatchModal(false); setBatchForm({ name: '', expectedEndAt: '', totalChicksIn: '' }); }} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                Bekor
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* ChickOut Modal - STEP 1 ONLY (Operatsion) */}
            {showChickOutModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Truck className="h-5 w-5" />
                                Jo'ja Chiqarish
                            </h3>
                            <button onClick={closeChickOutModal} className="p-1 text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Success State */}
                        {chickOutSuccess ? (
                            <div className="py-8 text-center">
                                <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                                <p className="text-lg font-medium text-slate-800 dark:text-slate-100">Muvaffaqiyatli!</p>
                                <p className="text-sm text-slate-500 mt-1">
                                    Jo'ja chiqarish ro'yxatga olindi. Moliyaviy yakunlash kutilmoqda.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Info */}
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300 mb-4">
                                    📋 Bu operatsion qayd. Moliyaviy ma'lumotlar (vazn, narx) keyinroq kiritiladi.
                                </div>

                                {/* Form */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Jo'ja soni *</label>
                                        <input type="number" value={chickOutForm.count} onChange={(e) => setChickOutForm({ ...chickOutForm, count: e.target.value })} placeholder="5000" min="1" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mashina raqami *</label>
                                        <input type="text" value={chickOutForm.vehicleNumber} onChange={(e) => setChickOutForm({ ...chickOutForm, vehicleNumber: e.target.value })} placeholder="01A123BC" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mashina turi *</label>
                                        <input type="text" value={chickOutForm.machineNumber} onChange={(e) => setChickOutForm({ ...chickOutForm, machineNumber: e.target.value })} placeholder="Isuzu NQR" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="isFinal" checked={chickOutForm.isFinal} onChange={(e) => setChickOutForm({ ...chickOutForm, isFinal: e.target.checked })} className="w-4 h-4 rounded border-slate-300" />
                                        <label htmlFor="isFinal" className="text-sm text-slate-700 dark:text-slate-300">
                                            Oxirgi chiqarish (partiya yopiladi)
                                        </label>
                                    </div>
                                    {chickOutForm.isFinal && (
                                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-400">
                                            ⚠️ Oxirgi chiqarish — partiya avtomatik yopiladi, sex CLEANING holatga o'tadi
                                        </div>
                                    )}
                                </div>

                                {/* Error */}
                                {chickOutError && (
                                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                                        {chickOutError}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2 mt-6">
                                    <button onClick={handleCreateChickOut} disabled={createChickOut.isPending || !chickOutForm.count || !chickOutForm.vehicleNumber || !chickOutForm.machineNumber} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
                                        {createChickOut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                                        Ro'yxatga olish
                                    </button>
                                    <button onClick={closeChickOutModal} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                        Bekor
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            )}


        </motion.div >
    );
}
