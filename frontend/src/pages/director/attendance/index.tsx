import { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, MapPin, Calendar, RefreshCw, AlertCircle, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSections, useSectionAttendance, useCompanyLocation } from '@/hooks';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

// Status badge colors
const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
    PRESENT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    LATE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
    ABSENT: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    APPROVED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
};

export default function AttendancePage() {
    const navigate = useNavigate();
    const { data: sections, isLoading: sectionsLoading } = useSections();
    const { data: location } = useCompanyLocation();

    const [selectedSection, setSelectedSection] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const { data: attendance, isLoading: attendanceLoading, isError, refetch } = useSectionAttendance(
        selectedSection || undefined,
        selectedDate
    );

    const activeSections = sections?.filter(s => !s.isArchived) || [];

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <ClipboardCheck className="h-6 w-6" />
                        Yo'qlama
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Ishchilar davomati</p>
                </div>
                <button
                    onClick={() => navigate('/director/attendance/location')}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                >
                    <MapPin className="h-4 w-4" />
                    Lokatsiya sozlash
                </button>
            </motion.div>

            {/* Location Status */}
            <motion.div variants={itemVariants} className={`p-3 rounded-lg text-sm flex items-center gap-2 ${location ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'}`}>
                <MapPin className="h-4 w-4" />
                {location ? (
                    <span>Lokatsiya: {location.lat.toFixed(4)}, {location.lng.toFixed(4)} (radius: {location.radius}m)</span>
                ) : (
                    <span>⚠️ Lokatsiya belgilanmagan</span>
                )}
            </motion.div>

            {/* Filters */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sex</label>
                    <select
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    >
                        <option value="">Sex tanlang</option>
                        {sectionsLoading ? (
                            <option disabled>Yuklanmoqda...</option>
                        ) : (
                            activeSections.map(section => (
                                <option key={section.id} value={section.id}>{section.name}</option>
                            ))
                        )}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sana</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Attendance Table */}
            <motion.div
                variants={itemVariants}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
                {!selectedSection ? (
                    <div className="p-8 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
                        <Users className="h-10 w-10" />
                        Yo'qlama ko'rish uchun sex tanlang
                    </div>
                ) : isError ? (
                    <div className="p-8 text-center">
                        <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Ma'lumot yuklanmadi</p>
                        <button onClick={() => refetch()} className="text-sm text-blue-600 hover:underline flex items-center gap-1 mx-auto">
                            <RefreshCw className="h-3 w-3" /> Qayta yuklash
                        </button>
                    </div>
                ) : attendanceLoading ? (
                    <div className="p-4 space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-12 bg-slate-50 dark:bg-slate-800 rounded animate-pulse" />
                        ))}
                    </div>
                ) : attendance && attendance.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400">
                        Bu sanada yo'qlama mavjud emas
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Sana</th>
                                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Check-in</th>
                                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Check-out</th>
                                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Status</th>
                                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Farq</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {attendance?.map((record) => (
                                <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                        {new Date(record.date).toLocaleDateString('uz-UZ')}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100">
                                        {new Date(record.checkInTime).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                        {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-0.5 rounded ${statusColors[record.status] || statusColors.PENDING}`}>
                                            {record.status}
                                            {record.isFake && ' ⚠️'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className={record.arrivalDiff < 0 ? 'text-emerald-600' : record.arrivalDiff > 0 ? 'text-orange-600' : 'text-slate-500'}>
                                            {record.arrivalDiff === 0 ? 'Vaqtida' : record.arrivalDiff < 0 ? `${Math.abs(record.arrivalDiff)} daqiqa erta` : `${record.arrivalDiff} daqiqa kech`}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </motion.div>
        </motion.div>
    );
}
