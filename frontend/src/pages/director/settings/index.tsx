import { motion } from 'framer-motion';
import { Settings, User, Bell, Shield, Palette } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const settingsItems = [
    { icon: User, label: 'Profil', description: 'Shaxsiy ma\'lumotlar va parol' },
    { icon: Bell, label: 'Bildirishnomalar', description: 'Push va email sozlamalari' },
    { icon: Shield, label: 'Xavfsizlik', description: 'Ikki bosqichli tekshiruv' },
    { icon: Palette, label: 'Ko\'rinish', description: 'Tema va til sozlamalari' },
];

export default function SettingsPage() {
    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={itemVariants}>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Settings className="h-7 w-7" />
                    Sozlamalar
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Tizim va profil sozlamalari</p>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-4">
                {settingsItems.map((item) => (
                    <div
                        key={item.label}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                    >
                        <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                            <item.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-white">{item.label}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                        </div>
                    </div>
                ))}
            </motion.div>
        </motion.div>
    );
}
