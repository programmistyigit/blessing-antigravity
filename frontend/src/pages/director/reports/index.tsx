import { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Zap, Droplets, Flame, Bird, Loader2, Save, Calendar, X } from 'lucide-react';
import { useSections, usePeriods, useSectionReports, useCreateDailyReport, useRecordUtilityCost, useUtilityCostsByPeriod } from '@/hooks';
import type { CreateReportPayload } from '@/services/reports.service';
import type { RecordUtilityPayload, UtilityType } from '@/services/utility.service';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

type TabType = 'chick' | 'water' | 'electricity' | 'gas';

const tabs: { id: TabType; label: string; icon: typeof Bird; color: string; bgColor: string }[] = [
    { id: 'chick', label: 'Joja holati', icon: Bird, color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { id: 'water', label: 'Suv sarfi', icon: Droplets, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 'electricity', label: 'Elektr sarfi', icon: Zap, color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { id: 'gas', label: 'Gaz sarfi', icon: Flame, color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
];

export default function ReportsPage() {
    const { data: sections, isLoading: sectionsLoading } = useSections();
    const { data: periods, isLoading: periodsLoading } = usePeriods();
    const [activeTab, setActiveTab] = useState<TabType>('chick');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState('');

    const createChickReport = useCreateDailyReport();
    const recordUtility = useRecordUtilityCost();

    // Get reports based on active tab
    const { data: chickReports, isLoading: chickLoading, refetch: refetchChick } = useSectionReports(
        activeTab === 'chick' && selectedSection ? selectedSection : undefined
    );
    const { data: utilityReports, isLoading: utilityLoading, refetch: refetchUtility } = useUtilityCostsByPeriod(
        activeTab !== 'chick' && selectedPeriod ? selectedPeriod : undefined,
        activeTab !== 'chick' ? activeTab.toUpperCase() as UtilityType : undefined
    );

    const activeSections = sections?.filter(s => !s.isArchived) || [];
    const activePeriods = periods?.filter(p => p.status === 'ACTIVE') || [];

    // Form states
    const [chickForm, setChickForm] = useState({
        date: new Date().toISOString().split('T')[0],
        avgWeight: '',
        deaths: '',
    });

    const [utilityForm, setUtilityForm] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        quantity: '',
        notes: '',
    });

    const resetForms = () => {
        setChickForm({
            date: new Date().toISOString().split('T')[0],
            avgWeight: '',
            deaths: '',
        });
        setUtilityForm({
            date: new Date().toISOString().split('T')[0],
            amount: '',
            quantity: '',
            notes: '',
        });
        setError('');
    };

    const openForm = () => {
        resetForms();
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        resetForms();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            if (activeTab === 'chick') {
                if (!selectedSection) {
                    setError('Sex tanlang');
                    return;
                }
                if (!chickForm.avgWeight || !chickForm.deaths) {
                    setError("Barcha majburiy maydonlarni to'ldiring");
                    return;
                }
                const payload: CreateReportPayload = {
                    date: new Date(chickForm.date).toISOString(),
                    avgWeight: parseFloat(chickForm.avgWeight),
                    deaths: parseInt(chickForm.deaths),
                };
                await createChickReport.mutateAsync({ sectionId: selectedSection, payload });
                refetchChick();
            } else {
                if (!selectedPeriod) {
                    setError('Davr tanlang');
                    return;
                }
                if (!utilityForm.amount) {
                    setError('Summa majburiy');
                    return;
                }
                const payload: RecordUtilityPayload = {
                    type: activeTab.toUpperCase() as UtilityType,
                    periodId: selectedPeriod,
                    sectionId: selectedSection || undefined,
                    amount: parseFloat(utilityForm.amount),
                    quantity: utilityForm.quantity ? parseFloat(utilityForm.quantity) : undefined,
                    date: new Date(utilityForm.date).toISOString(),
                    notes: utilityForm.notes || undefined,
                };
                await recordUtility.mutateAsync(payload);
                refetchUtility();
            }
            closeForm();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } } };
            setError(error?.response?.data?.error || 'Xatolik yuz berdi');
        }
    };

    const isPending = createChickReport.isPending || recordUtility.isPending;
    const isLoading = activeTab === 'chick' ? chickLoading : utilityLoading;
    const reports = activeTab === 'chick' ? chickReports : utilityReports;

    const currentTab = tabs.find(t => t.id === activeTab)!;

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <ClipboardList className="h-6 w-6" />
                        Kunlik Hisobotlar
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Har bir hisobot turini alohida yuborish</p>
                </div>
            </motion.div>

            {/* Tabs */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab.id
                                ? `${tab.bgColor} ${tab.color}`
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </motion.div>

            {/* Filters */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
                {activeTab === 'chick' ? (
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sex</label>
                        <select
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                        >
                            <option value="">Tanlang...</option>
                            {sectionsLoading ? (
                                <option disabled>Yuklanmoqda...</option>
                            ) : (
                                activeSections.map(s => (
                                    <option key={s._id} value={s._id}>{s.name}</option>
                                ))
                            )}
                        </select>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Davr</label>
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            >
                                <option value="">Tanlang...</option>
                                {periodsLoading ? (
                                    <option disabled>Yuklanmoqda...</option>
                                ) : (
                                    activePeriods.map(p => (
                                        <option key={p._id} value={p._id}>{p.name}</option>
                                    ))
                                )}
                            </select>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sex (ixtiyoriy)</label>
                            <select
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            >
                                <option value="">Barcha sexlar</option>
                                {activeSections.map(s => (
                                    <option key={s._id} value={s._id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </>
                )}
                <div className="flex items-end">
                    <button
                        onClick={openForm}
                        disabled={(activeTab === 'chick' && !selectedSection) || (activeTab !== 'chick' && !selectedPeriod)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${currentTab.bgColor} ${currentTab.color}`}
                    >
                        <currentTab.icon className="h-4 w-4" />
                        Yangi hisobot
                    </button>
                </div>
            </motion.div>

            {/* Data Table */}
            <motion.div
                variants={itemVariants}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
                {(activeTab === 'chick' && !selectedSection) || (activeTab !== 'chick' && !selectedPeriod) ? (
                    <div className="p-8 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
                        <currentTab.icon className="h-10 w-10" />
                        {activeTab === 'chick' ? 'Sex tanlang' : 'Davr tanlang'}
                    </div>
                ) : isLoading ? (
                    <div className="p-4 space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-12 bg-slate-50 dark:bg-slate-800 rounded animate-pulse" />
                        ))}
                    </div>
                ) : !reports || reports.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400">
                        Hisobotlar topilmadi
                    </div>
                ) : activeTab === 'chick' ? (
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Sana</th>
                                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">O'rtacha vazn</th>
                                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">O'limlar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {(chickReports || []).map((r) => (
                                <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-4 py-3 text-sm flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                        {new Date(r.date).toLocaleDateString('uz-UZ')}
                                    </td>
                                    <td className="px-4 py-3 text-sm">{r.avgWeight} g</td>
                                    <td className="px-4 py-3 text-sm text-red-600">{r.deaths}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Sana</th>
                                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Summa</th>
                                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Miqdor</th>
                                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Izoh</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {(utilityReports || []).map((r) => (
                                <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-4 py-3 text-sm flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                        {new Date(r.date).toLocaleDateString('uz-UZ')}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium">{r.amount.toLocaleString()} so'm</td>
                                    <td className="px-4 py-3 text-sm">
                                        {r.quantity ? `${r.quantity} ${activeTab === 'water' ? 'L' : activeTab === 'electricity' ? 'kWh' : 'm³'}` : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-500">{r.notes || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </motion.div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`font-semibold text-lg flex items-center gap-2 ${currentTab.color}`}>
                                <currentTab.icon className="h-5 w-5" />
                                {currentTab.label} hisoboti
                            </h3>
                            <button onClick={closeForm} className="p-1 text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sana</label>
                                <input
                                    type="date"
                                    value={activeTab === 'chick' ? chickForm.date : utilityForm.date}
                                    onChange={(e) => activeTab === 'chick'
                                        ? setChickForm({ ...chickForm, date: e.target.value })
                                        : setUtilityForm({ ...utilityForm, date: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                />
                            </div>

                            {activeTab === 'chick' ? (
                                <>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <label className="block text-xs text-slate-600 mb-1">O'rtacha vazn (g) *</label>
                                            <input
                                                type="number"
                                                value={chickForm.avgWeight}
                                                onChange={(e) => setChickForm({ ...chickForm, avgWeight: e.target.value })}
                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <label className="block text-xs text-slate-600 mb-1">O'limlar *</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={chickForm.deaths}
                                                onChange={(e) => setChickForm({ ...chickForm, deaths: e.target.value })}
                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-xs text-slate-600 mb-1">Summa (so'm) *</label>
                                        <input
                                            type="number"
                                            value={utilityForm.amount}
                                            onChange={(e) => setUtilityForm({ ...utilityForm, amount: e.target.value })}
                                            placeholder="50000"
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-600 mb-1">
                                            Miqdor ({activeTab === 'water' ? 'litr' : activeTab === 'electricity' ? 'kWh' : 'm³'})
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={utilityForm.quantity}
                                            onChange={(e) => setUtilityForm({ ...utilityForm, quantity: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-600 mb-1">Izoh</label>
                                        <input
                                            type="text"
                                            value={utilityForm.notes}
                                            onChange={(e) => setUtilityForm({ ...utilityForm, notes: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                        />
                                    </div>
                                </>
                            )}

                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium disabled:opacity-50 ${currentTab.bgColor} ${currentTab.color}`}
                                >
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Saqlash
                                </button>
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                >
                                    Bekor
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}
