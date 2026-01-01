import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRole, useUpdateRole } from '@/hooks';

// All available permissions (from backend)
const ALL_PERMISSIONS = [
    'SYSTEM_ALL',
    'USER_CREATE', 'USER_VIEW', 'USER_UPDATE', 'USER_DELETE',
    'ROLE_CREATE', 'ROLE_VIEW', 'ROLE_UPDATE', 'ROLE_DELETE',
    'SECTION_CREATE', 'SECTION_VIEW', 'SECTION_UPDATE', 'SECTION_DELETE', 'SECTION_STATUS_UPDATE', 'SECTION_ASSIGN_WORKER', 'SECTION_CLOSE',
    'BATCH_CREATE', 'BATCH_VIEW', 'BATCH_UPDATE', 'BATCH_CLOSE',
    'SECTION_DAILY_REPORT_CREATE', 'SECTION_DAILY_REPORT_VIEW', 'SECTION_DAILY_REPORT_APPROVE',
    'ATTENDANCE_CREATE', 'ATTENDANCE_VIEW', 'ATTENDANCE_UPDATE',
    'INVENTORY_CREATE', 'INVENTORY_VIEW', 'INVENTORY_UPDATE', 'INVENTORY_DELETE',
    'EXPENSE_CREATE', 'EXPENSE_VIEW', 'EXPENSE_UPDATE', 'EXPENSE_DELETE',
    'SALARY_MANAGE', 'SALARY_VIEW', 'SALARY_ADVANCE_GIVE', 'SALARY_BONUS_GIVE',
    'PRICE_UPDATE', 'PRICE_VIEW',
    'DASHBOARD_READ', 'REPORT_VIEW', 'DELEGATE_PERMISSIONS',
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function EditRolePage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { data: role, isLoading, isError, refetch } = useRole(id);
    const updateRole = useUpdateRole();

    const [form, setForm] = useState({
        name: '',
        baseSalary: '',
        permissions: [] as string[],
        canCreateUsers: false,
        canCreateRoles: false,
    });
    const [error, setError] = useState('');

    // Load role data into form
    useEffect(() => {
        if (role) {
            setForm({
                name: role.name,
                baseSalary: String(role.baseSalary),
                permissions: role.permissions,
                canCreateUsers: role.canCreateUsers,
                canCreateRoles: role.canCreateRoles,
            });
        }
    }, [role]);

    const togglePermission = (perm: string) => {
        setForm(prev => ({
            ...prev,
            permissions: prev.permissions.includes(perm)
                ? prev.permissions.filter(p => p !== perm)
                : [...prev.permissions, perm]
        }));
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!id) return;

        // Validation
        if (!form.name.trim()) {
            setError("Lavozim nomini kiriting");
            return;
        }
        if (!form.baseSalary || Number(form.baseSalary) < 0) {
            setError("Asosiy oylik miqdorini kiriting");
            return;
        }
        if (form.permissions.length === 0) {
            setError("Kamida bitta permission tanlang");
            return;
        }

        try {
            await updateRole.mutateAsync({
                id,
                payload: {
                    name: form.name.trim(),
                    baseSalary: Number(form.baseSalary),
                    permissions: form.permissions,
                    canCreateUsers: form.canCreateUsers,
                    canCreateRoles: form.canCreateRoles,
                },
            });
            navigate('/director/roles');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } } };
            setError(error?.response?.data?.error || 'Xatolik yuz berdi');
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    // Error state
    if (isError) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20"
            >
                <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Lavozim topilmadi</p>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg"
                >
                    <RefreshCw className="h-4 w-4" />
                    Qayta yuklash
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-2xl">
            <motion.div variants={itemVariants} className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/director/roles')}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Shield className="h-6 w-6" />
                        Lavozimni Tahrirlash
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{role?.name}</p>
                </div>
            </motion.div>

            <motion.form
                variants={itemVariants}
                onSubmit={handleSubmit}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6"
            >
                <div className="space-y-5">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Lavozim nomi *
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => { setForm({ ...form, name: e.target.value }); setError(''); }}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                    </div>

                    {/* Base Salary */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Asosiy oylik maosh (so'm) *
                        </label>
                        <input
                            type="number"
                            value={form.baseSalary}
                            onChange={(e) => { setForm({ ...form, baseSalary: e.target.value }); setError(''); }}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            min="0"
                        />
                    </div>

                    {/* Permissions */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Permissionlar ({form.permissions.length} ta tanlandi)
                        </label>
                        <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-1">
                            {ALL_PERMISSIONS.map(perm => (
                                <label
                                    key={perm}
                                    className="flex items-center gap-2 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={form.permissions.includes(perm)}
                                        onChange={() => togglePermission(perm)}
                                        className="h-4 w-4 rounded border-slate-300"
                                    />
                                    <span className="text-xs text-slate-600 dark:text-slate-400">{perm}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Options */}
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.canCreateUsers}
                                onChange={(e) => setForm({ ...form, canCreateUsers: e.target.checked })}
                                className="h-4 w-4 rounded border-slate-300"
                            />
                            <span className="text-sm text-slate-600 dark:text-slate-400">User yaratishi mumkin</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.canCreateRoles}
                                onChange={(e) => setForm({ ...form, canCreateRoles: e.target.checked })}
                                className="h-4 w-4 rounded border-slate-300"
                            />
                            <span className="text-sm text-slate-600 dark:text-slate-400">Role yaratishi mumkin</span>
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
                        disabled={updateRole.isPending}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                        {updateRole.isPending ? (
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
                        onClick={() => navigate('/director/roles')}
                        className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        Bekor
                    </button>
                </div>
            </motion.form>
        </motion.div>
    );
}
