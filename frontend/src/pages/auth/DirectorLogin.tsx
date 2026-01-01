import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Eye, EyeOff, Shield, Lock } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import api from '@/lib/api';

/**
 * DIRECTOR LOGIN PAGE
 * 
 * This page is HIDDEN and should NOT be linked from anywhere public.
 * Access via direct URL: /control
 * 
 * After successful login:
 * - JWT token saved to localStorage (via Zustand persist)
 * - User data stored in auth store
 * - Redirect to /director
 */
export default function DirectorLogin() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login } = useAuthStore();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!username.trim() || !password.trim()) {
            setError(t('auth.loginError'));
            return;
        }

        setIsLoading(true);

        try {
            const response = await api.post('/auth/login', { username, password });

            if (response.data.success) {
                const { token, user } = response.data.data;

                // Check if user has SYSTEM_ALL (Director) permission
                const hasDirectorAccess =
                    user.role.permissions.includes('SYSTEM_ALL') ||
                    user.role.permissions.includes('DASHBOARD_READ');

                if (!hasDirectorAccess) {
                    setError('Bu sahifa faqat direktorlar uchun');
                    toast.error('Bu sahifa faqat direktorlar uchun');
                    return;
                }

                // Save token and user to store (persisted to localStorage)
                login(token, user);

                toast.success(t('auth.loginSuccess'));
                navigate('/director');
            }
        } catch (err: any) {
            const message = err.response?.data?.error || t('auth.loginError');
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
            {/* Header */}
            <header className="p-4 flex items-center justify-end">
                <div className="flex items-center gap-3">
                    <LanguageSwitcher />
                    <ThemeToggle />
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md"
                >
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl mb-4 shadow-lg shadow-amber-500/30">
                            <Shield className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">
                            {t('auth.directorLogin.title')}
                        </h1>
                        <p className="text-gray-400 mt-1 flex items-center justify-center gap-2">
                            <Lock className="h-4 w-4" />
                            {t('auth.directorLogin.subtitle')}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 shadow-2xl">
                        {/* Error message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Username */}
                        <div className="mb-5">
                            <label
                                htmlFor="username"
                                className="block text-sm font-medium text-gray-300 mb-2"
                            >
                                {t('auth.username')}
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                placeholder={t('auth.username')}
                                autoComplete="username"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Password */}
                        <div className="mb-6">
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-300 mb-2"
                            >
                                {t('auth.password')}
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-12 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    placeholder={t('auth.password')}
                                    autoComplete="current-password"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-200 transition-colors"
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
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-amber-400 disabled:to-amber-500 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-300 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Shield className="h-5 w-5" />
                                    <span>{t('auth.login')}</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Security notice */}
                    <p className="mt-6 text-center text-xs text-gray-500">
                        Bu sahifaga kirish loglangan va kuzatilmoqda.
                    </p>
                </motion.div>
            </main>
        </div>
    );
}
