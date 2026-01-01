import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import api from '@/lib/api';

export default function LoginPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login } = useAuthStore();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username.trim() || !password.trim()) {
            toast.error(t('auth.loginError'));
            return;
        }

        setIsLoading(true);

        try {
            const response = await api.post('/auth/login', { username, password });

            if (response.data.success) {
                const { token, user } = response.data.data;
                login(token, user);
                toast.success(t('auth.loginSuccess'));
                navigate('/dashboard');
            }
        } catch (error: any) {
            const message = error.response?.data?.error || t('auth.loginError');
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex flex-col">
            {/* Header */}
            <header className="p-4 flex items-center justify-between">
                <Link
                    to="/"
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="hidden sm:inline">{t('common.back')}</span>
                </Link>

                <div className="flex items-center gap-3">
                    <LanguageSwitcher />
                    <ThemeToggle />
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md"
                >
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <img src="/logo.png" alt="UMID" className="h-16 w-auto mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {t('auth.workerLogin.title')}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            {t('auth.workerLogin.subtitle')}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
                        {/* Username */}
                        <div className="mb-5">
                            <label
                                htmlFor="username"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                {t('auth.username')}
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                placeholder={t('auth.username')}
                                autoComplete="username"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Password */}
                        <div className="mb-6">
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                {t('auth.password')}
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    placeholder={t('auth.password')}
                                    autoComplete="current-password"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold rounded-xl shadow-lg shadow-primary-600/25 transition-all duration-300 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <LogIn className="h-5 w-5" />
                                    <span>{t('auth.login')}</span>
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            </main>
        </div>
    );
}
