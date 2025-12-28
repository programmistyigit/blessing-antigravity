import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Permission } from '@/types/auth.types';
import { motion } from 'framer-motion';
import { LogOut, Package, Users, Factory, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { InventoryModal } from '@/components/modals/InventoryModal';
import { AttendanceModal } from '@/components/modals/AttendanceModal';
import { SectionDailyReportCard } from '@/components/sections/SectionDailyReportCard';
import { ManagerDashboard } from '@/components/manager/ManagerDashboard';
import { DirectorDashboard } from '@/components/director/DirectorDashboard';
import { useUserSections } from '@/hooks/useUserSections';
import { useState } from 'react';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function ProfilePage() {
    const navigate = useNavigate();
    const { user, logout, hasPermission } = useAuthStore();

    // Modal states
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

    // Fetch user's assigned sections for daily reports
    const { sections, loading: sectionsLoading, error: sectionsError } = useUserSections();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-pulse text-lg text-blue-600">Yuklanmoqda...</div>
            </div>
        );
    }

    // Animation variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    // Check if user has daily report permission
    const canCreateDailyReport = hasPermission(Permission.SECTION_DAILY_REPORT_CREATE);

    // Check if user has manager permissions
    const isManager = hasPermission(Permission.SECTION_DAILY_REPORT_APPROVE) ||
        hasPermission(Permission.SECTION_STATUS_UPDATE) ||
        hasPermission(Permission.BATCH_CREATE) ||
        hasPermission(Permission.BATCH_CLOSE);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-6 pb-20 transition-colors">
            {/* Header */}
            <header className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xl">
                        {user.fullName.charAt(0)}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.fullName}</h1>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                {user.role.name}
                            </span>
                            {sections.length > 0 && (
                                <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Factory className="h-3 w-3" />
                                        {sections.length} ta sex
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto flex-wrap">
                    {/* Language & Theme Controls */}
                    <LanguageSelector />
                    <ThemeToggle />

                    <div className="hidden md:flex flex-col items-end text-right mr-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date().toLocaleDateString()}</span>
                    </div>

                    {hasPermission(Permission.ATTENDANCE_CREATE) && (
                        <Button
                            onClick={() => setIsAttendanceModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 animate-pulse"
                        >
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-400"></div>
                                Ishga keldim
                            </div>
                        </Button>
                    )}

                    <Button variant="outline" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-100 dark:border-red-900">
                        <LogOut className="h-4 w-4 mr-2" />
                        Chiqish
                    </Button>
                </div>
            </header>

            {/* Main Grid */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                {/* MANAGER DASHBOARD AREA */}
                {isManager && (
                    <div className="col-span-full mb-6">
                        <ManagerDashboard />
                    </div>
                )}

                {/* DIRECTOR DASHBOARD AREA - Global View */}
                {hasPermission(Permission.SYSTEM_ALL) && (
                    <div className="col-span-full mb-6">
                        <DirectorDashboard />
                    </div>
                )}

                {/* Daily Report Section Cards - One per assigned section */}
                {canCreateDailyReport && (
                    <>
                        {sectionsLoading ? (
                            <motion.div variants={item} className="h-full">
                                <Card className="h-full flex items-center justify-center py-12 border-l-4 border-l-green-500">
                                    <div className="flex flex-col items-center gap-3 text-gray-500">
                                        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                                        <span className="text-sm">Sexlar yuklanmoqda...</span>
                                    </div>
                                </Card>
                            </motion.div>
                        ) : sectionsError ? (
                            <motion.div variants={item} className="h-full">
                                <Card className="h-full flex items-center justify-center py-12 border-l-4 border-l-red-500">
                                    <div className="flex flex-col items-center gap-3 text-red-500">
                                        <AlertCircle className="h-8 w-8" />
                                        <span className="text-sm">{sectionsError}</span>
                                    </div>
                                </Card>
                            </motion.div>
                        ) : sections.length === 0 ? (
                            <motion.div variants={item} className="h-full">
                                <Card className="h-full flex items-center justify-center py-12 border-l-4 border-l-gray-300">
                                    <div className="flex flex-col items-center gap-3 text-gray-500">
                                        <Factory className="h-8 w-8" />
                                        <span className="text-sm">Sizga sex biriktirilmagan</span>
                                    </div>
                                </Card>
                            </motion.div>
                        ) : (
                            sections.map((section) => (
                                <SectionDailyReportCard key={section._id} section={section} />
                            ))
                        )}
                    </>
                )}

                {/* Sexlar (Sections) Information - View Only */}
                {/* Hide detailed cards for manager to avoid clutter as they have ManagerDashboard */}
                {!isManager && (hasPermission(Permission.SECTION_VIEW) || hasPermission(Permission.SECTION_CREATE)) && (
                    <motion.div variants={item} className="h-full">
                        <Card className="h-full hover:shadow-md transition-all border-l-4 border-l-blue-500">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg font-bold text-gray-800">Mening Sexim</CardTitle>
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                    <Users className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Sexlar soni:</span>
                                        <span className="font-medium">{sections.length}</span>
                                    </div>
                                    <Button variant="ghost" className="w-full mt-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                        Batafsil ma'lumot
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Inventory View */}
                {(hasPermission(Permission.INVENTORY_READ) || hasPermission(Permission.WAREHOUSE_VIEW)) && (
                    <motion.div variants={item} className="h-full">
                        <Card className="h-full hover:shadow-md transition-all border-l-4 border-l-orange-500">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg font-bold text-gray-800">Ombor Zaxirasi</CardTitle>
                                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                    <Package className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="text-sm text-gray-600 bg-orange-50 p-2 rounded border border-orange-100">
                                        ⚠️ <b>Diqqat:</b> Vitamin A kam qoldi.
                                    </div>
                                    <CardDescription>
                                        Yem va qo'shimcha mahsulotlar qoldig'ini tekshirish.
                                    </CardDescription>
                                    <Button
                                        variant="outline"
                                        className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
                                        onClick={() => setIsInventoryModalOpen(true)}
                                    >
                                        Omborni Ko'rish
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Attendance Action */}
                {hasPermission(Permission.ATTENDANCE_CREATE) && (
                    <motion.div variants={item} className="h-full">
                        <Card className="h-full hover:shadow-lg transition-all border-l-4 border-l-purple-500 bg-gradient-to-br from-white to-purple-50/30">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg font-bold text-gray-800">Davomat</CardTitle>
                                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                    <Users className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent className="flex flex-col h-[calc(100%-80px)] justify-between">
                                <CardDescription className="mb-4">
                                    Ishchilarning bugungi davomatini belgilash.
                                </CardDescription>
                                <Button
                                    size="lg"
                                    className="w-full bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200"
                                    onClick={() => setIsAttendanceModalOpen(true)}
                                >
                                    Davomatni Kiritish
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

            </motion.div>

            {/* Modals */}
            <InventoryModal
                isOpen={isInventoryModalOpen}
                onClose={() => setIsInventoryModalOpen(false)}
            />

            <AttendanceModal
                isOpen={isAttendanceModalOpen}
                onClose={() => setIsAttendanceModalOpen(false)}
                sectionId={sections[0]?._id || ""}
            />

        </div>
    );
}
