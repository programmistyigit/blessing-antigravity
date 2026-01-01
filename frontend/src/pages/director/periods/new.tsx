import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowLeft, Loader2, Save, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCreatePeriod } from '@/hooks';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function NewPeriodPage() {
    const navigate = useNavigate();
    const createPeriod = useCreatePeriod();

    const [form, setForm] = useState({
        name: '',
        startDate: new Date().toISOString().split('T')[0],
        notes: '',
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!form.name.trim()) {
            setError('Davr nomi majburiy');
            return;
        }
        if (!form.startDate) {
            setError('Boshlanish sanasi majburiy');
            return;
        }

        try {
            await createPeriod.mutateAsync({
                name: form.name.trim(),
                startDate: new Date(form.startDate).toISOString(),
                notes: form.notes.trim() || undefined,
            });
            navigate('/director/periods');
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
                    onClick={() => navigate('/director/periods')}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Clock className="h-6 w-6" />
                        Yangi Davr
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Hisob-kitob davrini boshlash</p>
                </div>
            </motion.div>

            {/* Info */}
            <motion.div variants={itemVariants} className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-400">
                ℹ️ Davr faqat Director tomonidan qo'lda yopiladi. Batch yoki boshqa modul bu jarayonga ta'sir qilmaydi.
            </motion.div>

            {/* Form */}
            <motion.form
                variants={itemVariants}
                onSubmit={handleSubmit}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            >
                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Davr nomi *</label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Yanvar 2024"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    />
                </div>

                {/* Start Date */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Boshlanish sanasi *</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="date"
                            value={form.startDate}
                            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                        />
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Izoh (ixtiyoriy)</label>
                    <textarea
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        placeholder="Qo'shimcha ma'lumot..."
                        rows={3}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm resize-none"
                    />
                </div>

                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={createPeriod.isPending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-medium disabled:opacity-50"
                >
                    {createPeriod.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Yaratish
                </button>
            </motion.form>
        </motion.div>
    );
}
