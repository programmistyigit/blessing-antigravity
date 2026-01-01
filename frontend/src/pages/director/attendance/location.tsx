import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Save, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useCompanyLocation, useUpdateCompanyLocation } from '@/hooks';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function AttendanceLocationPage() {
    const { data: location, isLoading, isError, refetch } = useCompanyLocation();
    const updateLocation = useUpdateCompanyLocation();

    const [form, setForm] = useState({
        lat: '',
        lng: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Sync form with loaded data
    useState(() => {
        if (location) {
            setForm({ lat: String(location.lat), lng: String(location.lng) });
        }
    });

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolokatsiya qo\'llab-quvvatlanmaydi');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setForm({
                    lat: String(position.coords.latitude),
                    lng: String(position.coords.longitude),
                });
                setError('');
            },
            (error) => {
                setError(`Lokatsiya olishda xatolik: ${error.message}`);
            }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!form.lat || !form.lng) {
            setError('Latitude va Longitude majburiy');
            return;
        }

        const lat = parseFloat(form.lat);
        const lng = parseFloat(form.lng);

        if (isNaN(lat) || lat < -90 || lat > 90) {
            setError('Latitude -90 dan 90 gacha bo\'lishi kerak');
            return;
        }
        if (isNaN(lng) || lng < -180 || lng > 180) {
            setError('Longitude -180 dan 180 gacha bo\'lishi kerak');
            return;
        }

        try {
            await updateLocation.mutateAsync({ lat, lng, radius: 100 });
            setSuccess(true);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } } };
            setError(error?.response?.data?.error || 'Xatolik yuz berdi');
        }
    };

    if (isError) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Lokatsiya yuklanmadi</p>
                <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg">
                    <RefreshCw className="h-4 w-4" /> Qayta yuklash
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-lg">
            <motion.div variants={itemVariants}>
                <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <MapPin className="h-6 w-6" />
                    Yo'qlama Lokatsiyasi
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Ishchilar faqat shu nuqtadan 100m radiusda yo'qlama qila oladi
                </p>
            </motion.div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
            ) : (
                <motion.form variants={itemVariants} onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                    {/* Current Location Display */}
                    {location && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">Hozirgi lokatsiya:</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                                📍 {location.lat.toFixed(6)}, {location.lng.toFixed(6)} (radius: {location.radius}m)
                            </p>
                        </div>
                    )}

                    {/* Get Current Location Button */}
                    <button
                        type="button"
                        onClick={handleGetCurrentLocation}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                        <MapPin className="h-4 w-4" />
                        Hozirgi joylashuvni olish
                    </button>

                    {/* Lat / Lng Inputs */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Latitude</label>
                            <input
                                type="text"
                                value={form.lat}
                                onChange={(e) => { setForm({ ...form, lat: e.target.value }); setError(''); setSuccess(false); }}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                placeholder="41.311081"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Longitude</label>
                            <input
                                type="text"
                                value={form.lng}
                                onChange={(e) => { setForm({ ...form, lng: e.target.value }); setError(''); setSuccess(false); }}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                placeholder="69.279722"
                            />
                        </div>
                    </div>

                    {/* Radius Info */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm text-slate-500 dark:text-slate-400">
                        ⚠️ Radius: <strong>100 metr</strong> (o'zgartirib bo'lmaydi)
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-600 dark:text-emerald-400">
                            ✓ Lokatsiya muvaffaqiyatli saqlandi
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={updateLocation.isPending}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-medium disabled:opacity-50"
                    >
                        {updateLocation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Saqlash
                    </button>
                </motion.form>
            )}
        </motion.div>
    );
}
