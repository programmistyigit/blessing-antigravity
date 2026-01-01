import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCreateUser } from '@/hooks';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function NewEmployeePage() {
    const navigate = useNavigate();
    const createUser = useCreateUser();

    const [form, setForm] = useState({
        fullName: '',
        username: '',
        password: '',
        roleId: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!form.fullName || !form.username || !form.password) {
            setError('Barcha maydonlarni to\'ldiring');
            return;
        }
        if (form.password.length < 6) {
            setError('Parol kamida 6 ta belgi bo\'lishi kerak');
            return;
        }

        try {
            await createUser.mutateAsync({
                fullName: form.fullName,
                username: form.username,
                password: form.password,
                roleId: form.roleId || undefined as unknown as string, // Will use default if empty
                isActive: true,
            });
            navigate('/director/employees');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } } };
            setError(error?.response?.data?.error || 'Xatolik yuz berdi');
        }
    };

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-lg">
            <motion.div variants={itemVariants} className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/director/employees')}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <UserPlus className="h-6 w-6" />
                        Yangi Ishchi
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Yangi xodim qo'shish</p>
                </div>
            </motion.div>

            <motion.form
                variants={itemVariants}
                onSubmit={handleSubmit}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            To'liq ism *
                        </label>
                        <input
                            type="text"
                            name="fullName"
                            value={form.fullName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            placeholder="Ism Familiya"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Username *
                        </label>
                        <input
                            type="text"
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            placeholder="username"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Parol *
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            placeholder="Kamida 6 ta belgi"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Role ID (ixtiyoriy)
                        </label>
                        <input
                            type="text"
                            name="roleId"
                            value={form.roleId}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            placeholder="MongoDB ObjectId"
                        />
                        <p className="text-xs text-slate-400 mt-1">Keyinchalik Rollar integratsiyasida dropdown bo'ladi</p>
                    </div>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                <div className="mt-6 flex gap-3">
                    <button
                        type="submit"
                        disabled={createUser.isPending}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                        {createUser.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saqlanmoqda...
                            </>
                        ) : (
                            'Saqlash'
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/director/employees')}
                        className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        Bekor
                    </button>
                </div>
            </motion.form>
        </motion.div>
    );
}
