import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, ArrowLeft, Loader2, Save, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSections, useCreateBatch } from '@/hooks';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function NewBatchPage() {
    const navigate = useNavigate();
    const { data: sections, isLoading: sectionsLoading } = useSections();
    const createBatch = useCreateBatch();

    const [form, setForm] = useState({
        name: '',
        sectionId: '',
        startedAt: new Date().toISOString().split('T')[0],
        expectedEndAt: '',
        totalChicksIn: '',
    });
    const [error, setError] = useState('');

    const activeSections = sections?.filter(s => !s.isArchived && s.status !== 'ACTIVE') || [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!form.name.trim()) {
            setError('Partiya nomi majburiy');
            return;
        }
        if (!form.sectionId) {
            setError('Sex tanlash majburiy');
            return;
        }
        if (!form.expectedEndAt) {
            setError('Kutilayotgan tugash sanasi majburiy');
            return;
        }
        if (!form.totalChicksIn || parseInt(form.totalChicksIn) < 1) {
            setError('Jojalar soni kamida 1 bo\'lishi kerak');
            return;
        }

        try {
            await createBatch.mutateAsync({
                name: form.name.trim(),
                sectionId: form.sectionId,
                startedAt: new Date(form.startedAt).toISOString(),
                expectedEndAt: new Date(form.expectedEndAt).toISOString(),
                totalChicksIn: parseInt(form.totalChicksIn),
            });
            navigate('/director/batches');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } } };
            setError(error?.response?.data?.error || 'Xatolik yuz berdi');
        }
    };

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-lg">
            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/director/batches')}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Package className="h-6 w-6" />
                        Yangi Partiya
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Ishlab chiqarish siklini boshlash</p>
                </div>
            </motion.div>

            {/* Form */}
            <motion.form
                variants={itemVariants}
                onSubmit={handleSubmit}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            >
                {/* Section Select */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sex *</label>
                    <select
                        value={form.sectionId}
                        onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    >
                        <option value="">Tanlang...</option>
                        {sectionsLoading ? (
                            <option disabled>Yuklanmoqda...</option>
                        ) : activeSections.length === 0 ? (
                            <option disabled>Bo'sh sexlar mavjud emas</option>
                        ) : (
                            activeSections.map(section => (
                                <option key={section._id} value={section._id}>{section.name}</option>
                            ))
                        )}
                    </select>
                    <p className="text-xs text-slate-400 mt-1">Faqat faol partiyasi yo'q sexlar ko'rsatiladi</p>
                </div>

                {/* Batch Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Partiya nomi *</label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Masalan: 2024-01 Partiya"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    />
                </div>

                {/* Start Date */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Boshlanish sanasi</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="date"
                            value={form.startedAt}
                            onChange={(e) => setForm({ ...form, startedAt: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                        />
                    </div>
                </div>

                {/* Expected End Date */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kutilayotgan tugash sanasi *</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="date"
                            value={form.expectedEndAt}
                            onChange={(e) => setForm({ ...form, expectedEndAt: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                        />
                    </div>
                </div>

                {/* Total Chicks */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Jojalar soni *</label>
                    <input
                        type="number"
                        min="1"
                        value={form.totalChicksIn}
                        onChange={(e) => setForm({ ...form, totalChicksIn: e.target.value })}
                        placeholder="5000"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    />
                </div>

                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={createBatch.isPending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-medium disabled:opacity-50"
                >
                    {createBatch.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Yaratish
                </button>
            </motion.form>
        </motion.div>
    );
}
