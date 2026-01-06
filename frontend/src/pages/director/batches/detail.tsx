import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Package, ArrowLeft, Loader2, AlertCircle, Bird, Calendar,
    Truck, Check, X, LayoutGrid, List, CheckCircle2, Plus,
    ClipboardList, Utensils, Droplets, Zap, Flame, History, TrendingUp
} from 'lucide-react';
import {
    useBatch, useSectionChickOuts, useCompleteChickOut,
    useCreateChickOut, useViewMode, useBatchReports,
    useCreateDailyReport, useRecordFeedDelivery, useFeedDeliveriesByBatch,
    useRecordUtilityCost, useUtilityCostsByBatch
} from '@/hooks';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

const batchStatusColors: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    PARTIAL_OUT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    CLOSED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const batchStatusLabels: Record<string, string> = {
    ACTIVE: 'Faol',
    PARTIAL_OUT: 'Qisman chiqarilgan',
    CLOSED: 'Yopilgan',
};

export default function BatchDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: batch, isLoading, isError, refetch } = useBatch(id);
    // Get sectionId - may be string or populated object
    const sectionId = typeof batch?.sectionId === 'object' ? (batch?.sectionId as { _id: string })?._id : batch?.sectionId;
    const { data: chickOuts, refetch: refetchChickOuts } = useSectionChickOuts(sectionId);
    const completeChickOut = useCompleteChickOut();
    const createChickOut = useCreateChickOut();

    const [viewMode, setViewMode] = useViewMode('batch-detail', 'card');
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Create Form State
    const [createForm, setCreateForm] = useState({
        count: '',
        vehicleNumber: '',
        machineNumber: '',
        isFinal: false,
    });
    const [createError, setCreateError] = useState('');

    // Complete Form State
    const [selectedChickOut, setSelectedChickOut] = useState<string | null>(null);
    const [completeForm, setCompleteForm] = useState({
        totalWeightKg: '',
        wastePercent: '',
        pricePerKg: '',
    });
    const [completeError, setCompleteError] = useState('');
    const [completeSuccess, setCompleteSuccess] = useState(false);

    // Tab State
    const [activeTab, setActiveTab] = useState<'chick-out' | 'chick-status' | 'feed' | 'utilities'>('chick-out');

    // --- Reports State ---
    const { data: reports, refetch: refetchReports } = useBatchReports(id);
    const createReport = useCreateDailyReport();
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportForm, setReportForm] = useState({
        date: new Date().toISOString().split('T')[0],
        deaths: '',
        avgWeight: '',
        notes: '',
    });

    // --- Feed State ---
    const { data: feedDeliveries, refetch: refetchFeed } = useFeedDeliveriesByBatch(id);
    const recordFeed = useRecordFeedDelivery();
    const [showFeedModal, setShowFeedModal] = useState(false);
    const [feedForm, setFeedForm] = useState({
        quantityKg: '',
        pricePerKg: '',
        deliveredAt: new Date().toISOString().split('T')[0],
        notes: '',
    });

    // --- Utility State ---
    const { data: utilities, refetch: refetchUtilities } = useUtilityCostsByBatch(id);
    const recordUtility = useRecordUtilityCost();
    const [showUtilityModal, setShowUtilityModal] = useState(false);
    const [utilityForm, setUtilityForm] = useState({
        type: 'WATER' as 'WATER' | 'ELECTRICITY' | 'GAS',
        amount: '',
        quantity: '',
        unitCost: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const [modalError, setModalError] = useState('');
    const [modalSuccess, setModalSuccess] = useState(false);

    // Filter chick-outs for this batch
    const batchChickOuts = chickOuts?.filter(c => c.batchId === id) || [];
    const incompleteChickOuts = batchChickOuts.filter(c => c.status === 'INCOMPLETE');
    const completedChickOuts = batchChickOuts.filter(c => c.status === 'COMPLETE');

    const handleCreate = async () => {
        if (!sectionId || createChickOut.isPending) return;
        setCreateError('');

        if (!createForm.count || !createForm.vehicleNumber || !createForm.machineNumber) {
            setCreateError('Barcha maydonlarni to\'ldiring');
            return;
        }

        try {
            await createChickOut.mutateAsync({
                sectionId: sectionId as string,
                payload: {
                    count: parseInt(createForm.count),
                    vehicleNumber: createForm.vehicleNumber,
                    machineNumber: createForm.machineNumber,
                    isFinal: createForm.isFinal,
                }
            });

            refetchChickOuts();
            refetch();
            setShowCreateModal(false);
            setCreateForm({ count: '', vehicleNumber: '', machineNumber: '', isFinal: false });
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } } };
            setCreateError(error?.response?.data?.error || 'Xatolik yuz berdi');
        }
    };

    const handleOpenComplete = (chickOutId: string) => {
        setSelectedChickOut(chickOutId);
        setShowCompleteModal(true);
        setCompleteError('');
        setCompleteSuccess(false);
        setCompleteForm({ totalWeightKg: '', wastePercent: '', pricePerKg: '' });
    };

    const handleComplete = async () => {
        if (!selectedChickOut || completeChickOut.isPending) return;
        setCompleteError('');

        if (!completeForm.totalWeightKg || !completeForm.wastePercent || !completeForm.pricePerKg) {
            setCompleteError('Barcha maydonlarni to\'ldiring');
            return;
        }

        try {
            await completeChickOut.mutateAsync({
                chickOutId: selectedChickOut,
                payload: {
                    totalWeightKg: parseFloat(completeForm.totalWeightKg),
                    wastePercent: parseFloat(completeForm.wastePercent),
                    pricePerKg: parseFloat(completeForm.pricePerKg),
                }
            });

            setCompleteSuccess(true);
            refetchChickOuts();
            refetch();

            setTimeout(() => {
                setShowCompleteModal(false);
                setSelectedChickOut(null);
                setCompleteSuccess(false);
            }, 2000);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } } };
            setCompleteError(error?.response?.data?.error || 'Xatolik yuz berdi');
        }
    };

    // --- Report Handlers ---
    const handleSubmitReport = async () => {
        if (createReport.isPending) return;
        setModalError('');

        if (!reportForm.date || !reportForm.deaths || !reportForm.avgWeight) {
            setModalError('Sana, o\'lim va o\'rtacha vazn majburiy');
            return;
        }

        try {
            await createReport.mutateAsync({
                sectionId: sectionId as string,
                payload: {
                    date: new Date(reportForm.date).toISOString(),
                    deaths: parseInt(reportForm.deaths),
                    avgWeight: parseFloat(reportForm.avgWeight),
                    note: reportForm.notes,
                }
            });

            setModalSuccess(true);
            refetchReports();
            setTimeout(() => {
                setShowReportModal(false);
                setModalSuccess(false);
                setReportForm(prev => ({ ...prev, deaths: '', avgWeight: '', notes: '' }));
            }, 1500);
        } catch (err: any) {
            setModalError(err?.response?.data?.error || 'Xatolik yuz berdi');
        }
    };

    // --- Feed Handlers ---
    const handleSubmitFeed = async () => {
        if (recordFeed.isPending) return;
        setModalError('');

        if (!feedForm.quantityKg || !feedForm.pricePerKg) {
            setModalError('Miqdor va narx majburiy');
            return;
        }

        try {
            await recordFeed.mutateAsync({
                batchId: id!,
                quantityKg: parseFloat(feedForm.quantityKg),
                pricePerKg: parseFloat(feedForm.pricePerKg),
                deliveredAt: new Date(feedForm.deliveredAt).toISOString(),
                notes: feedForm.notes,
            });

            setModalSuccess(true);
            refetchFeed();
            refetch(); // For any totals
            setTimeout(() => {
                setShowFeedModal(false);
                setModalSuccess(false);
                setFeedForm(prev => ({ ...prev, quantityKg: '', pricePerKg: '', notes: '' }));
            }, 1500);
        } catch (err: any) {
            setModalError(err?.response?.data?.error || 'Xatolik yuz berdi');
        }
    };

    // --- Utility Handlers ---
    const handleSubmitUtility = async () => {
        if (recordUtility.isPending || !batch) return;
        setModalError('');

        if (!utilityForm.amount) {
            setModalError('Summa majburiy');
            return;
        }

        try {
            await recordUtility.mutateAsync({
                type: utilityForm.type,
                batchId: id!,
                sectionId: sectionId as string,
                periodId: (batch as any).activePeriodId || '', // Need to ensure batch has this or get from section
                amount: parseFloat(utilityForm.amount),
                quantity: utilityForm.quantity ? parseFloat(utilityForm.quantity) : undefined,
                unitCost: utilityForm.unitCost ? parseFloat(utilityForm.unitCost) : undefined,
                date: new Date(utilityForm.date).toISOString(),
                notes: utilityForm.notes,
            });

            setModalSuccess(true);
            refetchUtilities();
            setTimeout(() => {
                setShowUtilityModal(false);
                setModalSuccess(false);
                setUtilityForm(prev => ({ ...prev, amount: '', quantity: '', unitCost: '', notes: '' }));
            }, 1500);
        } catch (err: any) {
            setModalError(err?.response?.data?.error || 'Xatolik yuz berdi');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (isError || !batch) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                <p className="text-sm text-slate-500">Partiya topilmadi</p>
            </div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-3">
                            <Package className="h-7 w-7 text-blue-500" />
                            {batch.name || `Partiya #${batch._id.slice(-6)}`}
                        </h1>
                        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                <Bird className="h-4 w-4 text-emerald-500" />
                                <span className="font-medium text-slate-700 dark:text-slate-300">{batch.totalChicksIn.toLocaleString()} ta</span>
                            </span>
                            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                <Calendar className="h-4 w-4 text-blue-500" />
                                <span>{new Date(batch.startedAt).toLocaleDateString('uz-UZ')}</span>
                            </span>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${batchStatusColors[batch.status]}`}>
                                {batchStatusLabels[batch.status]}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Context-sensitive Add Button */}
                        {batch.status === 'ACTIVE' && (
                            <>
                                {activeTab === 'chick-out' && (
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 shadow-lg shadow-slate-200 dark:shadow-none transition-all active:scale-95"
                                    >
                                        <Plus className="h-5 w-5" />
                                        <span>Chiqarish</span>
                                    </button>
                                )}
                                {activeTab === 'chick-status' && (
                                    <button
                                        onClick={() => setShowReportModal(true)}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-100 dark:shadow-none transition-all active:scale-95"
                                    >
                                        <ClipboardList className="h-5 w-5" />
                                        <span>Hisobot qo'shish</span>
                                    </button>
                                )}
                                {activeTab === 'feed' && (
                                    <button
                                        onClick={() => setShowFeedModal(true)}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 shadow-lg shadow-amber-100 dark:shadow-none transition-all active:scale-95"
                                    >
                                        <Utensils className="h-5 w-5" />
                                        <span>Yem kiritish</span>
                                    </button>
                                )}
                                {activeTab === 'utilities' && (
                                    <button
                                        onClick={() => setShowUtilityModal(true)}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-100 dark:shadow-none transition-all active:scale-95"
                                    >
                                        <Plus className="h-5 w-5" />
                                        <span>Xarajat qo'shish</span>
                                    </button>
                                )}
                            </>
                        )}

                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

                        {/* View Toggle (Only for ChickOut) */}
                        {activeTab === 'chick-out' && (
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1.5">
                                <button
                                    onClick={() => setViewMode('card')}
                                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'card' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                >
                                    <LayoutGrid className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                >
                                    <List className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tab Bar */}
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
                    {[
                        { id: 'chick-out', label: 'Chiqarish (ChickOut)', icon: Truck },
                        { id: 'chick-status', label: 'Jo\'ja holati', icon: Bird },
                        { id: 'feed', label: 'Yem sarfi', icon: Utensils },
                        { id: 'utilities', label: 'Kommunal (W/E/G)', icon: Zap },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-all ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-300'
                                }`}
                        >
                            <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {/* --- CHICK OUT TAB --- */}
                {activeTab === 'chick-out' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        {incompleteChickOuts.length > 0 && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-amber-300 dark:border-amber-600 overflow-hidden shadow-sm">
                                <div className="px-5 py-4 bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                                            <span className="relative flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                            </span>
                                            Yakunlanmagan Chiqarishlar ({incompleteChickOuts.length})
                                        </h3>
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
                                            Vazn va narx ma'lumotlarini kiritish lozim
                                        </p>
                                    </div>
                                </div>

                                <div className={`p-4 ${viewMode === 'card' ? 'grid gap-4' : 'overflow-x-auto'}`}>
                                    {viewMode === 'card' ? (
                                        incompleteChickOuts.map(co => (
                                            <div key={co._id} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-amber-700 flex items-center justify-between shadow-sm">
                                                <div>
                                                    <p className="text-lg font-bold text-slate-900 dark:text-slate-50">{co.count.toLocaleString()} ta jo'ja</p>
                                                    <div className="flex items-center gap-4 mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                                                        <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> {co.vehicleNumber}</span>
                                                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(co.date).toLocaleDateString('uz-UZ')}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleOpenComplete(co._id)}
                                                    className="px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors shadow-md shadow-amber-100 dark:shadow-none"
                                                >
                                                    Ma'lumotlarni to'ldirish
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50 dark:bg-slate-800/80">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Sana</th>
                                                    <th className="px-4 py-3 text-left font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Soni</th>
                                                    <th className="px-4 py-3 text-left font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Mashina/Mashinalar</th>
                                                    <th className="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Amal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {incompleteChickOuts.map(co => (
                                                    <tr key={co._id} className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors">
                                                        <td className="px-4 py-4 dark:text-slate-300">{new Date(co.date).toLocaleDateString('uz-UZ')}</td>
                                                        <td className="px-4 py-4 font-bold text-slate-800 dark:text-slate-100">{co.count.toLocaleString()}</td>
                                                        <td className="px-4 py-4 font-medium text-slate-600 dark:text-slate-400">{co.vehicleNumber}</td>
                                                        <td className="px-4 py-4 text-right">
                                                            <button onClick={() => handleOpenComplete(co._id)} className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-md hover:bg-amber-700">
                                                                To'ldirish
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        )}

                        {completedChickOuts.length > 0 ? (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                        Muvaffaqiyatli Chiqarilganlar ({completedChickOuts.length})
                                    </h3>
                                </div>

                                {viewMode === 'card' ? (
                                    <div className="p-5 grid gap-4 grid-cols-1 md:grid-cols-2">
                                        {completedChickOuts.map(co => (
                                            <div key={co._id} className="p-5 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 group hover:border-blue-200 dark:hover:border-blue-900 transition-all">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="text-xl font-black text-slate-900 dark:text-slate-50">
                                                            {co.count.toLocaleString()} <span className="text-sm font-medium text-slate-400">ta</span>
                                                        </p>
                                                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                                                            {co.totalWeightKg?.toLocaleString()} kg <span className="text-xs opacity-75">(Brutto)</span>
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-black text-slate-900 dark:text-slate-50 leading-none">
                                                            {co.totalRevenue?.toLocaleString()}
                                                        </p>
                                                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mt-1">so'm daromad</p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                    <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-blue-500" /> {new Date(co.date).toLocaleDateString('uz-UZ')}</span>
                                                    <span className="flex items-center gap-1.5"><History className="h-3.5 w-3.5 text-amber-500" /> {co.wastePercent}% chiqindi</span>
                                                    <span className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> {co.pricePerKg?.toLocaleString()} so'm/kg</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50 dark:bg-slate-800/80">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Sana</th>
                                                    <th className="px-4 py-3 text-left font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Soni</th>
                                                    <th className="px-4 py-3 text-left font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Vazn (kg)</th>
                                                    <th className="px-4 py-3 text-left font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Chiqindi %</th>
                                                    <th className="px-4 py-3 text-left font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Narx/kg</th>
                                                    <th className="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Jami Summa</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {completedChickOuts.map(co => (
                                                    <tr key={co._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors font-medium">
                                                        <td className="px-4 py-4 dark:text-slate-400">{new Date(co.date).toLocaleDateString('uz-UZ')}</td>
                                                        <td className="px-4 py-4 font-bold text-slate-800 dark:text-slate-100">{co.count.toLocaleString()}</td>
                                                        <td className="px-4 py-4 text-emerald-600 dark:text-emerald-400">{co.totalWeightKg?.toLocaleString()}</td>
                                                        <td className="px-4 py-4 text-amber-600 font-bold">{co.wastePercent}%</td>
                                                        <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{co.pricePerKg?.toLocaleString()}</td>
                                                        <td className="px-4 py-4 text-right font-black text-slate-900 dark:text-slate-50 text-base">{co.totalRevenue?.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ) : incompleteChickOuts.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                                <Truck className="h-12 w-12 text-slate-200 mb-4" />
                                <p className="text-slate-400 font-medium italic">Hali chiqarishlar (chick-out) ro'yxatga olinmagan</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* --- CHICK STATUS TAB --- */}
                {activeTab === 'chick-status' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Bird className="h-5 w-5 text-blue-500" />
                                Kunlik Jo'ja Holati Hisoboti
                            </h3>
                        </div>

                        {reports && reports.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/80">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Sana</th>
                                            <th className="px-4 py-3 text-left font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">O'lim (dona)</th>
                                            <th className="px-4 py-3 text-left font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Ortacha Vazn (gr)</th>
                                            <th className="px-4 py-3 text-left font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Izoh / Dorilar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {reports.map((report) => (
                                            <tr key={report._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-4 py-4 font-bold text-slate-800 dark:text-slate-200">{new Date(report.date).toLocaleDateString('uz-UZ')}</td>
                                                <td className="px-4 py-4 text-red-600 dark:text-red-400 font-bold">{report.deaths} ta</td>
                                                <td className="px-4 py-4 text-blue-600 dark:text-blue-400 font-bold">{report.avgWeight} gr</td>
                                                <td className="px-4 py-4">
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">{report.notes || '-'}</p>
                                                    {report.medicines && report.medicines.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {report.medicines.map((m, i) => (
                                                                <span key={i} className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded italic">
                                                                    {m.name} ({m.dose})
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20">
                                <ClipboardList className="h-12 w-12 text-slate-200 mb-4" />
                                <p className="text-slate-400 font-medium italic">Bugun uchun hisobot kiritilmagan</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* --- FEED TAB --- */}
                {activeTab === 'feed' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Utensils className="h-5 w-5 text-amber-500" />
                                Yem Yetkazib Berish Tarixi
                            </h3>
                        </div>

                        {feedDeliveries && feedDeliveries.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/80">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Sana</th>
                                            <th className="px-4 py-3 text-left font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Miqdor (kg)</th>
                                            <th className="px-4 py-3 text-left font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Narx/kg</th>
                                            <th className="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Jami Summa</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {feedDeliveries.map((feed) => (
                                            <tr key={feed._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{new Date(feed.deliveredAt).toLocaleDateString('uz-UZ')}</td>
                                                <td className="px-4 py-4 font-bold text-slate-800 dark:text-slate-100">{feed.quantityKg.toLocaleString()} kg</td>
                                                <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{feed.pricePerKg.toLocaleString()}</td>
                                                <td className="px-4 py-4 text-right font-black text-amber-600 dark:text-amber-400">{feed.totalCost.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Utensils className="h-12 w-12 text-slate-200 mb-4" />
                                <p className="text-slate-400 font-medium italic">Yem keltirilmagan</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* --- UTILITIES TAB --- */}
                {activeTab === 'utilities' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Zap className="h-5 w-5 text-blue-500" />
                                Kommunal va Boshqa Xarajatlar
                            </h3>
                        </div>

                        {utilities && utilities.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/80">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Sana</th>
                                            <th className="px-4 py-3 text-left font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Turi</th>
                                            <th className="px-4 py-3 text-left font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Miqdor</th>
                                            <th className="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Summa</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {utilities.map((util) => (
                                            <tr key={util._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{new Date(util.date).toLocaleDateString('uz-UZ')}</td>
                                                <td className="px-4 py-4 font-bold">
                                                    <span className={`flex items-center gap-1.5 ${util.type === 'WATER' ? 'text-blue-500' :
                                                        util.type === 'ELECTRICITY' ? 'text-amber-500' : 'text-emerald-500'
                                                        }`}>
                                                        {util.type === 'WATER' ? <Droplets className="h-4 w-4" /> :
                                                            util.type === 'ELECTRICITY' ? <Zap className="h-4 w-4" /> : <Flame className="h-4 w-4" />}
                                                        {util.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-slate-600 dark:text-slate-400">
                                                    {util.quantity ? `${util.quantity.toLocaleString()} ${util.type === 'WATER' ? 'litr' : 'kWh'}` : '-'}
                                                </td>
                                                <td className="px-4 py-4 text-right font-black text-slate-800 dark:text-slate-100">{util.amount.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Zap className="h-12 w-12 text-slate-200 mb-4" />
                                <p className="text-slate-400 font-medium italic">Xarajatlar mavjud emas</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Complete Modal (Step 2) */}
            {showCompleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Check className="h-5 w-5" />
                                ChickOut Yakunlash
                            </h3>
                            <button onClick={() => setShowCompleteModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {completeSuccess ? (
                            <div className="py-8 text-center">
                                <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                                <p className="text-lg font-medium text-slate-800 dark:text-slate-100">Muvaffaqiyatli yakunlandi!</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Umumiy vazn (kg) *
                                        </label>
                                        <input
                                            type="number"
                                            value={completeForm.totalWeightKg}
                                            onChange={(e) => setCompleteForm({ ...completeForm, totalWeightKg: e.target.value })}
                                            placeholder="12500"
                                            step="0.1"
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Chiqindi foizi (%) *
                                        </label>
                                        <input
                                            type="number"
                                            value={completeForm.wastePercent}
                                            onChange={(e) => setCompleteForm({ ...completeForm, wastePercent: e.target.value })}
                                            placeholder="2"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                        />
                                        <p className="text-xs text-slate-400 mt-1">0 dan 100 gacha</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Narx (so'm/kg) *
                                        </label>
                                        <input
                                            type="number"
                                            value={completeForm.pricePerKg}
                                            onChange={(e) => setCompleteForm({ ...completeForm, pricePerKg: e.target.value })}
                                            placeholder="30000"
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                        />
                                    </div>

                                    {/* Revenue Preview */}
                                    {completeForm.totalWeightKg && completeForm.wastePercent && completeForm.pricePerKg && (
                                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                            <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                                Taxminiy daromad:
                                                <span className="font-bold ml-1">
                                                    {(
                                                        parseFloat(completeForm.totalWeightKg) *
                                                        (1 - parseFloat(completeForm.wastePercent) / 100) *
                                                        parseFloat(completeForm.pricePerKg)
                                                    ).toLocaleString()} so'm
                                                </span>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {completeError && (
                                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                                        {completeError}
                                    </div>
                                )}

                                <div className="flex gap-2 mt-6">
                                    <button
                                        onClick={handleComplete}
                                        disabled={completeChickOut.isPending || !completeForm.totalWeightKg || !completeForm.wastePercent || !completeForm.pricePerKg}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50"
                                    >
                                        {completeChickOut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                        Yakunlash
                                    </button>
                                    <button
                                        onClick={() => setShowCompleteModal(false)}
                                        className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                    >
                                        Bekor
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
            {/* Create ChickOut Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                                Yangi Chiqarish (Sotish)
                            </h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                            >
                                <X className="h-5 w-5 text-slate-500" />
                            </button>
                        </div>

                        {createError && (
                            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                {createError}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Jo'ja Soni
                                </label>
                                <input
                                    type="number"
                                    value={createForm.count}
                                    onChange={e => setCreateForm({ ...createForm, count: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Masalan: 1000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Mashina Raqami
                                </label>
                                <input
                                    type="text"
                                    value={createForm.vehicleNumber}
                                    onChange={e => setCreateForm({ ...createForm, vehicleNumber: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="01 A 000 AA"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Uskuna / Qo'shimcha
                                </label>
                                <input
                                    type="text"
                                    value={createForm.machineNumber}
                                    onChange={e => setCreateForm({ ...createForm, machineNumber: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="M-1 yoki Mijoz nomi"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isFinal"
                                    checked={createForm.isFinal}
                                    onChange={e => setCreateForm({ ...createForm, isFinal: e.target.checked })}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="isFinal" className="text-sm text-slate-700 dark:text-slate-300 select-none cursor-pointer">
                                    Partiyani yopish uchun oxirgi chiqim
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                Bekor qilish
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={createChickOut.isPending}
                                className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {createChickOut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                Yaratish
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Daily Report Modal (Chick Status) */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                    <ClipboardList className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                Jo'ja holati
                            </h3>
                            <button onClick={() => setShowReportModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {modalError && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                {modalError}
                            </div>
                        )}

                        {modalSuccess ? (
                            <div className="py-12 flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
                                    <Check className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">Muvaffaqiyatli!</h4>
                                <p className="text-slate-500 dark:text-slate-400 mt-2">Hisobot saqlandi</p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Sana *</label>
                                    <input
                                        type="date"
                                        value={reportForm.date}
                                        onChange={(e) => setReportForm({ ...reportForm, date: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl focus:border-emerald-500 transition-colors font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">O'lim (ta) *</label>
                                        <input
                                            type="number"
                                            value={reportForm.deaths}
                                            onChange={(e) => setReportForm({ ...reportForm, deaths: e.target.value })}
                                            placeholder="0"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl focus:border-emerald-500 transition-colors font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Orta Vazn (gr) *</label>
                                        <input
                                            type="number"
                                            value={reportForm.avgWeight}
                                            onChange={(e) => setReportForm({ ...reportForm, avgWeight: e.target.value })}
                                            placeholder="450"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl focus:border-emerald-500 transition-colors font-medium"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Izoh / Dorilar</label>
                                    <textarea
                                        value={reportForm.notes}
                                        onChange={(e) => setReportForm({ ...reportForm, notes: e.target.value })}
                                        placeholder="Dorilar yoki boshqa qaydlar..."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl focus:border-emerald-500 transition-colors font-medium resize-none"
                                    />
                                </div>

                                <button
                                    onClick={handleSubmitReport}
                                    disabled={createReport.isPending}
                                    className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 dark:shadow-none active:scale-[0.98] disabled:opacity-50"
                                >
                                    {createReport.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                                    Saqlash
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {/* Feed Delivery Modal */}
            {showFeedModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 flex items-center gap-3">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                    <Utensils className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                </div>
                                Yem keltirish
                            </h3>
                            <button onClick={() => setShowFeedModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {modalError && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                {modalError}
                            </div>
                        )}

                        {modalSuccess ? (
                            <div className="py-12 flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-6">
                                    <Check className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">Muvaffaqiyatli!</h4>
                                <p className="text-slate-500 dark:text-slate-400 mt-2">Yem kelishi ro'yxatga olindi</p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Miqdor (kg) *</label>
                                        <input
                                            type="number"
                                            value={feedForm.quantityKg}
                                            onChange={(e) => setFeedForm({ ...feedForm, quantityKg: e.target.value })}
                                            placeholder="1000"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl focus:border-amber-500 transition-colors font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Narx (so'm/kg) *</label>
                                        <input
                                            type="number"
                                            value={feedForm.pricePerKg}
                                            onChange={(e) => setFeedForm({ ...feedForm, pricePerKg: e.target.value })}
                                            placeholder="4500"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl focus:border-amber-500 transition-colors font-medium"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Keltirilgan sana *</label>
                                    <input
                                        type="date"
                                        value={feedForm.deliveredAt}
                                        onChange={(e) => setFeedForm({ ...feedForm, deliveredAt: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl focus:border-amber-500 transition-colors font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Izoh</label>
                                    <textarea
                                        value={feedForm.notes}
                                        onChange={(e) => setFeedForm({ ...feedForm, notes: e.target.value })}
                                        placeholder="Yem turi yoki yetkazib beruvchi..."
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl focus:border-amber-500 transition-colors font-medium resize-none"
                                    />
                                </div>

                                <button
                                    onClick={handleSubmitFeed}
                                    disabled={recordFeed.isPending}
                                    className="w-full py-4 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-200 dark:shadow-none active:scale-[0.98] disabled:opacity-50"
                                >
                                    {recordFeed.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <History className="h-5 w-5" />}
                                    Saqlash
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {/* Utility Cost Modal */}
            {showUtilityModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                Xarajat kiritish
                            </h3>
                            <button onClick={() => setShowUtilityModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {modalError && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                {modalError}
                            </div>
                        )}

                        {modalSuccess ? (
                            <div className="py-12 flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
                                    <Check className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">Muvaffaqiyatli!</h4>
                                <p className="text-slate-500 dark:text-slate-400 mt-2">Xarajat saqlandi</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Xarajat turi *</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'WATER', label: 'Suv', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50' },
                                            { id: 'ELECTRICITY', label: 'Tok', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
                                            { id: 'GAS', label: 'Gaz', icon: Flame, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                        ].map((type) => (
                                            <button
                                                key={type.id}
                                                onClick={() => setUtilityForm({ ...utilityForm, type: type.id as any })}
                                                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${utilityForm.type === type.id
                                                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                                                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                                                    }`}
                                            >
                                                <type.icon className={`h-5 w-5 ${type.color}`} />
                                                <span className="text-[10px] font-bold uppercase">{type.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Summa (so'm) *</label>
                                    <input
                                        type="number"
                                        value={utilityForm.amount}
                                        onChange={(e) => setUtilityForm({ ...utilityForm, amount: e.target.value })}
                                        placeholder="150000"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl focus:border-blue-500 transition-colors font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Miqdor</label>
                                        <input
                                            type="number"
                                            value={utilityForm.quantity}
                                            onChange={(e) => setUtilityForm({ ...utilityForm, quantity: e.target.value })}
                                            placeholder="kWh / litr"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl focus:border-blue-500 transition-colors font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tarif</label>
                                        <input
                                            type="number"
                                            value={utilityForm.unitCost}
                                            onChange={(e) => setUtilityForm({ ...utilityForm, unitCost: e.target.value })}
                                            placeholder="so'm"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl focus:border-blue-500 transition-colors font-medium"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Sana *</label>
                                    <input
                                        type="date"
                                        value={utilityForm.date}
                                        onChange={(e) => setUtilityForm({ ...utilityForm, date: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl focus:border-blue-500 transition-colors font-medium"
                                    />
                                </div>

                                <button
                                    onClick={handleSubmitUtility}
                                    disabled={recordUtility.isPending}
                                    className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none active:scale-[0.98] disabled:opacity-50"
                                >
                                    {recordUtility.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
                                    Saqlash
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}
