import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCog, ArrowLeft, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUsers, useUpdateUser, useRoles } from '@/hooks';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function EditEmployeePage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { data: users, isLoading, isError, refetch } = useUsers();
    const { data: roles, isLoading: rolesLoading } = useRoles();
    const updateUser = useUpdateUser();

    const user = users?.find(u => u._id === id);

    const [form, setForm] = useState({
        fullName: '',
        username: '',
        roleId: '',
        isActive: true,
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setForm({
                fullName: user.fullName,
                username: user.username,
                roleId: user.role?._id || '',
                isActive: user.isActive,
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setForm({ ...form, [name]: (e.target as HTMLInputElement).checked });
        } else {
            setForm({ ...form, [name]: value });
        }
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!id) return;

        if (!form.fullName) {
            setError('Ism kiritilishi shart');
            return;
        }

        try {
            await updateUser.mutateAsync({
                id,
                payload: {
                    fullName: form.fullName,
                    roleId: form.roleId || undefined,
                    isActive: form.isActive,
                },
            });
            navigate('/director/employees');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } } };
            setError(error?.response?.data?.error || 'Xatolik yuz berdi');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (isError || !user) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Xodim topilmadi</p>
                <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg">
                    <RefreshCw className="h-4 w-4" />Qayta yuklash
                </button>
            </motion.div>
        );
    }

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
                        <UserCog className="h-6 w-6" />
                        Xodimni Tahrirlash
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{user?.fullName}</p>
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
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Username
                        </label>
                        <input
                            type="text"
                            name="username"
                            value={form.username}
                            disabled
                            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-400 cursor-not-allowed"
                        />
                        <p className="text-xs text-slate-400 mt-1">Username o'zgartirib bo'lmaydi</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Lavozim *
                        </label>
                        <select
                            name="roleId"
                            value={form.roleId}
                            onChange={handleChange}
                            disabled={rolesLoading}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
                        >
                            <option value="">
                                {rolesLoading ? 'Yuklanmoqda...' : 'Lavozimni tanlang'}
                            </option>
                            {roles?.map(role => (
                                <option key={role._id} value={role._id}>
                                    {role.name} — {role.baseSalary?.toLocaleString()} so'm
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="isActive"
                            id="isActive"
                            checked={form.isActive}
                            onChange={handleChange}
                            className="h-4 w-4 rounded border-slate-300"
                        />
                        <label htmlFor="isActive" className="text-sm text-slate-600 dark:text-slate-400">
                            Faol holat
                        </label>
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
                        disabled={updateUser.isPending}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                        {updateUser.isPending ? (
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
