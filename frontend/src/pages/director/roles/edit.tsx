import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ArrowLeft, Loader2, AlertCircle, RefreshCw, GripVertical, X, Check, Info, Key, Users, Building2, Package, Calendar, MapPin, DollarSign, Activity, BarChart3, Truck } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRoles, useUpdateRole } from '@/hooks';

// Permission descriptions for tooltips
const PERMISSION_DESCRIPTIONS: Record<string, string> = {
    SYSTEM_ALL: 'Barcha ruxsatlarga ega - Director uchun',
    ROLE_CREATE: 'Yangi lavozim yaratish',
    ROLE_UPDATE: 'Lavozimni tahrirlash',
    ROLE_VIEW: 'Lavozimlarni ko\'rish',
    USER_CREATE: 'Yangi foydalanuvchi yaratish',
    USER_UPDATE: 'Foydalanuvchi ma\'lumotlarini tahrirlash',
    USER_VIEW: 'Foydalanuvchilar ro\'yxatini ko\'rish',
    SECTION_CREATE: 'Yangi sex yaratish',
    SECTION_UPDATE: 'Sex ma\'lumotlarini tahrirlash',
    SECTION_VIEW: 'Sexlarni ko\'rish',
    SECTION_ASSIGN_WORKER: 'Ishchilarni sexga biriktirish',
    SECTION_CLOSE: 'Sexni yopish',
    SECTION_STATUS_UPDATE: 'Sex statusini o\'zgartirish',
    SECTION_DAILY_REPORT_CREATE: 'Kunlik hisobot yaratish',
    SECTION_DAILY_REPORT_UPDATE: 'Kunlik hisobotni tahrirlash',
    SECTION_DAILY_REPORT_VIEW: 'Kunlik hisobotlarni ko\'rish',
    BATCH_CREATE: 'Yangi partiya yaratish',
    BATCH_CLOSE: 'Partiyani yopish',
    CHICK_OUT_CREATE: 'Jo\'ja chiqarish ro\'yxatga olish',
    CHICKOUT_COMPLETE: 'Jo\'ja chiqarishni moliyaviy yakunlash',
    PERIOD_CREATE: 'Yangi davr yaratish',
    PERIOD_VIEW: 'Davrlarni ko\'rish',
    PERIOD_UPDATE: 'Davr ma\'lumotlarini tahrirlash',
    PERIOD_CLOSE: 'Davrni yopish',
    PERIOD_EXPENSE_CREATE: 'Davr xarajatini kiritish',
    WAREHOUSE_VIEW: 'Omborni ko\'rish',
    WAREHOUSE_IN: 'Omborga kirim qilish',
    WAREHOUSE_OUT: 'Ombordan chiqim qilish',
    WAREHOUSE_UPDATE: 'Ombor ma\'lumotlarini tahrirlash',
    INVENTORY_CREATE: 'Inventar yaratish',
    INVENTORY_READ: 'Inventarni ko\'rish',
    INVENTORY_UPDATE: 'Inventarni tahrirlash',
    INVENTORY_DELETE: 'Inventarni o\'chirish',
    ATTENDANCE_READ: 'Yo\'qlamani ko\'rish',
    ATTENDANCE_CREATE: 'Yo\'qlama belgilash',
    ATTENDANCE_UPDATE: 'Yo\'qlamani tahrirlash',
    REPORT_VIEW: 'Hisobotlarni ko\'rish',
    REPORT_EXPORT: 'Hisobotlarni eksport qilish',
    DASHBOARD_READ: 'Dashboardni ko\'rish',
    SALARY_VIEW: 'Ish haqini ko\'rish',
    SALARY_MANAGE: 'Ish haqini boshqarish',
    SALARY_ADVANCE_GIVE: 'Avans berish',
    SALARY_BONUS_GIVE: 'Bonus berish',
    DELEGATE_PERMISSIONS: 'Ruxsatlarni vaqtinchalik o\'tkazish',
    FEED_MANAGE: 'Yem boshqarish',
    PRICE_MANAGE: 'Narxlarni boshqarish',
};

// Permission groups with icons
const PERMISSION_GROUPS = [
    { name: 'Tizim', icon: Shield, color: 'text-red-500 bg-red-50 dark:bg-red-900/20', permissions: ['SYSTEM_ALL'] },
    { name: 'Rollar', icon: Key, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20', permissions: ['ROLE_CREATE', 'ROLE_UPDATE', 'ROLE_VIEW'] },
    { name: 'Foydalanuvchilar', icon: Users, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20', permissions: ['USER_CREATE', 'USER_UPDATE', 'USER_VIEW'] },
    { name: 'Sexlar', icon: Building2, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20', permissions: ['SECTION_CREATE', 'SECTION_UPDATE', 'SECTION_VIEW', 'SECTION_ASSIGN_WORKER', 'SECTION_CLOSE', 'SECTION_STATUS_UPDATE'] },
    { name: 'Kunlik Hisobot', icon: Activity, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20', permissions: ['SECTION_DAILY_REPORT_CREATE', 'SECTION_DAILY_REPORT_UPDATE', 'SECTION_DAILY_REPORT_VIEW'] },
    { name: 'Partiya', icon: Package, color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20', permissions: ['BATCH_CREATE', 'BATCH_CLOSE', 'CHICK_OUT_CREATE', 'CHICKOUT_COMPLETE'] },
    { name: 'Davr', icon: Calendar, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20', permissions: ['PERIOD_CREATE', 'PERIOD_VIEW', 'PERIOD_UPDATE', 'PERIOD_CLOSE', 'PERIOD_EXPENSE_CREATE'] },
    { name: 'Ombor', icon: Package, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20', permissions: ['WAREHOUSE_VIEW', 'WAREHOUSE_IN', 'WAREHOUSE_OUT', 'WAREHOUSE_UPDATE'] },
    { name: 'Inventar', icon: Package, color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20', permissions: ['INVENTORY_CREATE', 'INVENTORY_READ', 'INVENTORY_UPDATE', 'INVENTORY_DELETE'] },
    { name: "Yo'qlama", icon: MapPin, color: 'text-green-500 bg-green-50 dark:bg-green-900/20', permissions: ['ATTENDANCE_READ', 'ATTENDANCE_CREATE', 'ATTENDANCE_UPDATE'] },
    { name: 'Hisobotlar', icon: BarChart3, color: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20', permissions: ['REPORT_VIEW', 'REPORT_EXPORT', 'DASHBOARD_READ'] },
    { name: 'Ish Haqi', icon: DollarSign, color: 'text-lime-500 bg-lime-50 dark:bg-lime-900/20', permissions: ['SALARY_VIEW', 'SALARY_MANAGE', 'SALARY_ADVANCE_GIVE', 'SALARY_BONUS_GIVE'] },
    { name: 'Moliya', icon: DollarSign, color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20', permissions: ['DELEGATE_PERMISSIONS'] },
    { name: 'Yem & Kommunal', icon: Truck, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20', permissions: ['FEED_MANAGE', 'PRICE_MANAGE'] },
];

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

// Permission Item Component
function PermissionItem({ perm, isSelected, onDragStart, onRemove }: { perm: string; isSelected: boolean; onDragStart: (e: React.DragEvent, perm: string) => void; onRemove: (perm: string) => void }) {
    const [showTooltip, setShowTooltip] = useState(false);
    const [showRemove, setShowRemove] = useState(false);

    return (
        <div className="relative" onMouseEnter={() => isSelected ? setShowRemove(true) : setShowTooltip(true)} onMouseLeave={() => { setShowTooltip(false); setShowRemove(false); }}>
            <div
                draggable={!isSelected}
                onDragStart={(e) => onDragStart(e, perm)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all cursor-grab ${isSelected ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:cursor-grabbing'}`}
            >
                <GripVertical className={`h-3 w-3 ${isSelected ? 'opacity-30' : 'opacity-60'}`} />
                <span>{perm}</span>
            </div>
            <AnimatePresence>
                {showTooltip && !isSelected && PERMISSION_DESCRIPTIONS[perm] && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute z-50 left-0 top-full mt-1 px-2 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs rounded shadow-lg whitespace-nowrap max-w-xs">
                        <Info className="inline h-3 w-3 mr-1" />{PERMISSION_DESCRIPTIONS[perm]}
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showRemove && isSelected && (
                    <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={() => onRemove(perm)} className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white rounded-full flex items-center justify-center shadow">
                        <X className="h-2.5 w-2.5" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}

// Selected Permission Badge
function SelectedPermissionBadge({ perm, onRemove }: { perm: string; onRemove: (perm: string) => void }) {
    const [showRemove, setShowRemove] = useState(false);
    return (
        <motion.div layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onMouseEnter={() => setShowRemove(true)} onMouseLeave={() => setShowRemove(false)} className="relative inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded text-xs font-medium">
            <Check className="h-3 w-3" /><span>{perm}</span>
            <AnimatePresence>
                {showRemove && (
                    <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={() => onRemove(perm)} className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white rounded-full flex items-center justify-center shadow">
                        <X className="h-2.5 w-2.5" />
                    </motion.button>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function EditRolePage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { data: roles, isLoading, isError, refetch } = useRoles();
    const updateRole = useUpdateRole();
    const dropZoneRef = useRef<HTMLDivElement>(null);

    const role = roles?.find(r => r._id === id);

    const [form, setForm] = useState({ name: '', baseSalary: '', permissions: [] as string[], canCreateUsers: false, canCreateRoles: false });
    const [error, setError] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);

    useEffect(() => {
        if (role) {
            setForm({ name: role.name, baseSalary: String(role.baseSalary), permissions: role.permissions, canCreateUsers: role.canCreateUsers, canCreateRoles: role.canCreateRoles });
        }
    }, [role]);

    const handleDragStart = (e: React.DragEvent, perm: string) => { e.dataTransfer.setData('permission', perm); e.dataTransfer.effectAllowed = 'move'; };
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setIsDragOver(true); };
    const handleDragLeave = () => { setIsDragOver(false); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setIsDragOver(false);
        const perm = e.dataTransfer.getData('permission');
        if (perm && !form.permissions.includes(perm)) {
            setForm(prev => ({ ...prev, permissions: [...prev.permissions, perm] }));
            setError('');
        }
    };
    const removePermission = (perm: string) => { setForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== perm) })); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        if (!form.name.trim()) { setError("Lavozim nomini kiriting"); return; }
        if (!form.baseSalary || Number(form.baseSalary) < 0) { setError("Asosiy oylik miqdorini kiriting"); return; }
        if (form.permissions.length === 0) { setError("Kamida bitta permission tanlang"); return; }

        try {
            await updateRole.mutateAsync({ id, payload: { name: form.name.trim(), baseSalary: Number(form.baseSalary), permissions: form.permissions, canCreateUsers: form.canCreateUsers, canCreateRoles: form.canCreateRoles } });
            navigate('/director/roles');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } } };
            setError(error?.response?.data?.error || 'Xatolik yuz berdi');
        }
    };

    if (isLoading) { return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>; }
    if (isError || !role) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Lavozim topilmadi</p>
                <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg"><RefreshCw className="h-4 w-4" />Qayta yuklash</button>
            </motion.div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex gap-6">
            {/* Left Panel - Permissions */}
            <motion.div variants={itemVariants} className="w-80 flex-shrink-0">
                <div className="sticky top-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        <h3 className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"><Key className="h-4 w-4" />Ruxsatlar</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Chapdan o'ngga sudrab tashlang</p>
                    </div>
                    <div className="h-[calc(100vh-200px)] overflow-y-auto p-3 space-y-4">
                        {PERMISSION_GROUPS.map(group => {
                            const Icon = group.icon;
                            return (
                                <div key={group.name}>
                                    <div className={`flex items-center gap-2 px-2 py-1 rounded ${group.color}`}><Icon className="h-3.5 w-3.5" /><span className="text-xs font-medium">{group.name}</span></div>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {group.permissions.map(perm => <PermissionItem key={perm} perm={perm} isSelected={form.permissions.includes(perm)} onDragStart={handleDragStart} onRemove={removePermission} />)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </motion.div>

            {/* Right Panel - Form */}
            <motion.div variants={itemVariants} className="flex-1 max-w-xl">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate('/director/roles')} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><ArrowLeft className="h-5 w-5" /></button>
                    <div>
                        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Shield className="h-6 w-6" />Lavozimni Tahrirlash</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{role?.name}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Lavozim nomi *</label>
                            <input type="text" value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setError(''); }} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Asosiy oylik maosh (so'm) *</label>
                            <input type="number" value={form.baseSalary} onChange={(e) => { setForm({ ...form, baseSalary: e.target.value }); setError(''); }} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" min="0" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tanlangan ruxsatlar ({form.permissions.length} ta)</label>
                            <div ref={dropZoneRef} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`min-h-24 p-3 rounded-lg border-2 border-dashed transition-colors ${isDragOver ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'} ${form.permissions.length === 0 ? 'flex items-center justify-center' : ''}`}>
                                {form.permissions.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center">{isDragOver ? '🎯 Shu yerga tashlang!' : '📋 Chapdan ruxsatlarni shu yerga sudrab tashlang'}</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2"><AnimatePresence>{form.permissions.map(perm => <SelectedPermissionBadge key={perm} perm={perm} onRemove={removePermission} />)}</AnimatePresence></div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.canCreateUsers} onChange={(e) => setForm({ ...form, canCreateUsers: e.target.checked })} className="h-4 w-4 rounded border-slate-300" /><span className="text-sm text-slate-600 dark:text-slate-400">User yaratishi mumkin</span></label>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.canCreateRoles} onChange={(e) => setForm({ ...form, canCreateRoles: e.target.checked })} className="h-4 w-4 rounded border-slate-300" /><span className="text-sm text-slate-600 dark:text-slate-400">Role yaratishi mumkin</span></label>
                        </div>
                    </div>
                    {error && <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">{error}</div>}
                    <div className="mt-6 flex gap-3">
                        <button type="submit" disabled={updateRole.isPending} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-50">
                            {updateRole.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Saqlanmoqda...</> : 'Saqlash'}
                        </button>
                        <button type="button" onClick={() => navigate('/director/roles')} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Bekor</button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
