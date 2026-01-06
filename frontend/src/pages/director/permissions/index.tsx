import { motion } from 'framer-motion';
import { Key, Check, Shield, Users, Building2, ClipboardList, Package, Truck, DollarSign, Calendar, MapPin, Activity, Wrench, BarChart3 } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

// All permissions from backend permission.enum.ts
const permissionGroups = [
    {
        name: 'Tizim',
        icon: Shield,
        color: 'text-red-500',
        permissions: ['SYSTEM_ALL'],
        description: 'Barcha ruxsatlar'
    },
    {
        name: 'Rollar',
        icon: Key,
        color: 'text-purple-500',
        permissions: ['ROLE_CREATE', 'ROLE_UPDATE', 'ROLE_VIEW'],
    },
    {
        name: 'Foydalanuvchilar',
        icon: Users,
        color: 'text-blue-500',
        permissions: ['USER_CREATE', 'USER_UPDATE', 'USER_VIEW'],
    },
    {
        name: 'Sexlar',
        icon: Building2,
        color: 'text-emerald-500',
        permissions: [
            'SECTION_CREATE',
            'SECTION_UPDATE',
            'SECTION_VIEW',
            'SECTION_ASSIGN_WORKER',
            'SECTION_CLOSE',
            'SECTION_STATUS_UPDATE',
        ],
    },
    {
        name: 'Kunlik Hisobot',
        icon: ClipboardList,
        color: 'text-cyan-500',
        permissions: [
            'SECTION_DAILY_REPORT_CREATE',
            'SECTION_DAILY_REPORT_UPDATE',
            'SECTION_DAILY_REPORT_VIEW',
        ],
    },
    {
        name: 'Kasallik',
        icon: Activity,
        color: 'text-pink-500',
        permissions: [
            'SECTION_DISEASE_CREATE',
            'SECTION_DISEASE_UPDATE',
            'SECTION_DISEASE_VIEW',
            'DISEASE_READ',
            'DISEASE_CREATE',
            'DISEASE_UPDATE',
            'DISEASE_DELETE',
        ],
    },
    {
        name: 'Partiya & Ishlab Chiqarish',
        icon: Package,
        color: 'text-orange-500',
        permissions: [
            'BATCH_CREATE',
            'BATCH_CLOSE',
            'CHICK_OUT_CREATE',
            'CHICKOUT_COMPLETE',
        ],
    },
    {
        name: 'Davr (Period)',
        icon: Calendar,
        color: 'text-indigo-500',
        permissions: [
            'PERIOD_CREATE',
            'PERIOD_VIEW',
            'PERIOD_UPDATE',
            'PERIOD_CLOSE',
            'PERIOD_EXPENSE_CREATE',
        ],
    },
    {
        name: 'Ombor',
        icon: Package,
        color: 'text-amber-500',
        permissions: [
            'WAREHOUSE_VIEW',
            'WAREHOUSE_IN',
            'WAREHOUSE_OUT',
            'WAREHOUSE_UPDATE',
        ],
    },
    {
        name: 'Inventar',
        icon: Package,
        color: 'text-teal-500',
        permissions: [
            'INVENTORY_CREATE',
            'INVENTORY_READ',
            'INVENTORY_UPDATE',
            'INVENTORY_DELETE',
            'INVENTORY_APPROVE',
            'INVENTORY_ALERT_VIEW',
            'INVENTORY_ALERT_RESOLVE',
        ],
    },
    {
        name: 'Dori-Darmon',
        icon: Activity,
        color: 'text-rose-500',
        permissions: [
            'MEDICATION_READ',
            'MEDICATION_CREATE',
            'MEDICATION_UPDATE',
            'MEDICATION_DELETE',
        ],
    },
    {
        name: "Yo'qlama",
        icon: MapPin,
        color: 'text-green-500',
        permissions: [
            'ATTENDANCE_READ',
            'ATTENDANCE_CREATE',
            'ATTENDANCE_UPDATE',
            'ATTENDANCE_DELETE',
            'ATTENDANCE_APPROVE',
        ],
    },
    {
        name: 'GPS Monitoring',
        icon: MapPin,
        color: 'text-sky-500',
        permissions: ['GPS_MONITOR_READ', 'GPS_MONITOR_UPDATE'],
    },
    {
        name: 'Hisobotlar',
        icon: BarChart3,
        color: 'text-violet-500',
        permissions: ['REPORT_VIEW', 'REPORT_EXPORT'],
    },
    {
        name: 'Dashboard',
        icon: BarChart3,
        color: 'text-fuchsia-500',
        permissions: ['DASHBOARD_READ', 'KPI_READ'],
    },
    {
        name: 'Ish Haqi',
        icon: DollarSign,
        color: 'text-lime-500',
        permissions: [
            'SALARY_VIEW',
            'SALARY_MANAGE',
            'SALARY_ADVANCE_GIVE',
            'SALARY_BONUS_GIVE',
        ],
    },
    {
        name: 'Moliya',
        icon: DollarSign,
        color: 'text-yellow-500',
        permissions: ['FINANCE_EXPENSE_APPROVE', 'DELEGATE_PERMISSIONS'],
    },
    {
        name: 'Uskunalar',
        icon: Wrench,
        color: 'text-gray-500',
        permissions: [
            'ASSET_MANAGE',
            'TECH_REPORT_CREATE',
            'TECH_REPORT_VIEW',
            'TECH_REPORT_UPDATE',
        ],
    },
    {
        name: 'Yem & Kommunal',
        icon: Truck,
        color: 'text-orange-600',
        permissions: [
            'FEED_MANAGE',
            'WATER_REPORT',
            'ELECTRICITY_REPORT',
            'GAS_REPORT',
            'PRICE_MANAGE',
        ],
    },
];

export default function PermissionsPage() {
    const totalPermissions = permissionGroups.reduce((sum, g) => sum + g.permissions.length, 0);

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* Header */}
            <motion.div variants={itemVariants}>
                <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Key className="h-6 w-6" />
                    Ruxsatlar
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Tizim ruxsatlari ro'yxati • Jami: {totalPermissions} ta
                </p>
            </motion.div>

            {/* Permission Groups */}
            <motion.div variants={itemVariants} className="grid gap-4 lg:grid-cols-2">
                {permissionGroups.map((group) => {
                    const Icon = group.icon;
                    return (
                        <div
                            key={group.name}
                            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <Icon className={`h-5 w-5 ${group.color}`} />
                                <h3 className="font-medium text-slate-800 dark:text-slate-200">
                                    {group.name}
                                </h3>
                                <span className="text-xs text-slate-400 ml-auto">
                                    {group.permissions.length} ta
                                </span>
                            </div>
                            {group.description && (
                                <p className="text-xs text-slate-500 mb-2">{group.description}</p>
                            )}
                            <div className="flex flex-wrap gap-1.5">
                                {group.permissions.map((perm) => (
                                    <div
                                        key={perm}
                                        className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded flex items-center gap-1"
                                    >
                                        <Check className="h-3 w-3 text-emerald-500" />
                                        {perm}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </motion.div>
        </motion.div>
    );
}
