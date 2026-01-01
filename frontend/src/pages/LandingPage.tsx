import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    Heart,
    Shield,
    TrendingUp,
    Users,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export default function LandingPage() {
    const { t } = useTranslation();

    const values = [
        {
            icon: Heart,
            key: 'honesty',
            color: 'text-red-500',
            bgColor: 'bg-red-50 dark:bg-red-900/20'
        },
        {
            icon: Shield,
            key: 'discipline',
            color: 'text-blue-500',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20'
        },
        {
            icon: TrendingUp,
            key: 'growth',
            color: 'text-green-500',
            bgColor: 'bg-green-50 dark:bg-green-900/20'
        },
        {
            icon: Users,
            key: 'family',
            color: 'text-purple-500',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20'
        },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5 },
        },
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <img src="/logo.png" alt="UMID" className="h-10 w-auto" />
                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                                {t('landing.title')}
                            </span>
                        </div>

                        {/* Right side */}
                        <div className="flex items-center gap-3">
                            <LanguageSwitcher />
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="pt-24 pb-16">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
                >
                    {/* Hero Content */}
                    <motion.div
                        variants={itemVariants}
                        className="text-center max-w-3xl mx-auto mb-16"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 rounded-full text-primary-600 dark:text-primary-400 text-sm font-medium mb-6">
                            <Sparkles className="h-4 w-4" />
                            <span>{t('landing.subtitle')}</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                            {t('landing.hero.title')}
                        </h1>

                        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                            {t('landing.hero.description')}
                        </p>

                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-600/25 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                        >
                            <span>{t('landing.hero.cta')}</span>
                            <ChevronRight className="h-5 w-5" />
                        </Link>
                    </motion.div>

                    {/* Values Grid */}
                    <motion.div variants={itemVariants} className="mb-16">
                        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
                            {t('landing.values.title')}
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {values.map(({ icon: Icon, key, color, bgColor }) => (
                                <motion.div
                                    key={key}
                                    whileHover={{ scale: 1.02, y: -5 }}
                                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow"
                                >
                                    <div className={`inline-flex p-3 rounded-xl ${bgColor} mb-4`}>
                                        <Icon className={`h-6 w-6 ${color}`} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        {t(`landing.values.${key}.title`)}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                        {t(`landing.values.${key}.description`)}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Stats (Placeholder) */}
                    <motion.div
                        variants={itemVariants}
                        className="grid grid-cols-3 gap-8 max-w-2xl mx-auto"
                    >
                        {[
                            { value: '50+', label: t('landing.stats.workers') },
                            { value: '10', label: t('landing.stats.sections') },
                            { value: '5+', label: t('landing.stats.experience') },
                        ].map((stat) => (
                            <div key={stat.label} className="text-center">
                                <div className="text-3xl sm:text-4xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="py-8 border-t border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    © {new Date().getFullYear()} Blessing. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
