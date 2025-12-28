import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { FileText, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDailyReportStatus } from '@/hooks/useDailyReportStatus';
import { DailyReportModal } from '@/components/modals/DailyReportModal';
import type { ISection, IDailyReport } from '@/types/section.types';

interface SectionDailyReportCardProps {
    section: ISection;
}

export function SectionDailyReportCard({ section }: SectionDailyReportCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { submitted, loading, markAsSubmitted } = useDailyReportStatus(section._id);

    const handleReportSubmitted = (report: IDailyReport) => {
        markAsSubmitted(report);
        setIsModalOpen(false);
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="h-full"
            >
                <Card className={`h-full transition-all hover:shadow-lg border-l-4 ${submitted
                        ? 'border-l-emerald-500 bg-gradient-to-br from-white to-emerald-50/30'
                        : 'border-l-amber-500 bg-gradient-to-br from-white to-amber-50/30'
                    }`}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="flex-1">
                            <CardTitle className="text-lg font-bold text-gray-800">
                                {section.name}
                            </CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                                {format(new Date(), 'd MMMM, yyyy')}
                            </p>
                        </div>
                        <div className={`p-2 rounded-lg ${submitted
                                ? 'bg-emerald-100 text-emerald-600'
                                : 'bg-amber-100 text-amber-600'
                            }`}>
                            {submitted ? (
                                <CheckCircle className="h-5 w-5" />
                            ) : (
                                <FileText className="h-5 w-5" />
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* Status Badge */}
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${submitted
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                            {loading ? (
                                <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Tekshirilmoqda...
                                </>
                            ) : submitted ? (
                                <>
                                    <CheckCircle className="h-3 w-3" />
                                    Hisobot topshirilgan
                                </>
                            ) : (
                                <>
                                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                    Hisobot kutilmoqda
                                </>
                            )}
                        </div>

                        {/* Action Button */}
                        {!submitted && !loading && (
                            <Button
                                size="lg"
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md shadow-green-200 transition-all hover:shadow-lg"
                                onClick={() => setIsModalOpen(true)}
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                Kunlik hisobot topshirish
                            </Button>
                        )}

                        {submitted && (
                            <div className="text-sm text-gray-500 text-center py-2">
                                ✓ Bugungi hisobot muvaffaqiyatli topshirildi
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Daily Report Modal */}
            <DailyReportModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                sectionId={section._id}
                sectionName={section.name}
                onSuccess={handleReportSubmitted}
            />
        </>
    );
}
