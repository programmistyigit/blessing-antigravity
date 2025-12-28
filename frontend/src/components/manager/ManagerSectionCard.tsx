import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ISection, ITodayReportStatus, IBatch } from '@/types/section.types';
import { SectionStatus } from '@/types/section.types';
import { Factory, Settings, PlayCircle, StopCircle, FileText, CheckCircle, Clock } from 'lucide-react';

interface ManagerSectionCardProps {
    section: ISection;
    todayReport: ITodayReportStatus;
    onStatusClick: () => void;
    onBatchStartClick: () => void;
    onBatchCloseClick: () => void;
    onReportClick: () => void;
    permissions: {
        canUpdateStatus: boolean;
        canCreateBatch: boolean;
        canCloseBatch: boolean;
        canApproveReport: boolean;
    };
}

export function ManagerSectionCard({
    section,
    todayReport,
    onStatusClick,
    onBatchStartClick,
    onBatchCloseClick,
    onReportClick,
    permissions
}: ManagerSectionCardProps) {
    const activeBatch = typeof section.activeBatchId === 'object' ? section.activeBatchId as IBatch : null;

    const getStatusColor = (status: SectionStatus) => {
        switch (status) {
            case SectionStatus.ACTIVE: return 'bg-green-100 text-green-800 border-green-200';
            case SectionStatus.CLEANING: return 'bg-cyan-100 text-cyan-800 border-cyan-200';
            case SectionStatus.PREPARING: return 'bg-amber-100 text-amber-800 border-amber-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <Factory className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">{section.name}</CardTitle>
                        <Badge variant="outline" className={`mt-1 capitalize ${getStatusColor(section.status)}`}>
                            {section.status}
                        </Badge>
                    </div>
                </div>
                {permissions.canUpdateStatus && (
                    <Button variant="ghost" size="icon" onClick={onStatusClick} title="Holatni o'zgartirish">
                        <Settings className="h-4 w-4 text-gray-500" />
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Batch Info */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Batch</span>
                        {activeBatch ? (
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-medium text-slate-700">{activeBatch.batchNumber}</div>
                                    <div className="text-xs text-slate-500">{activeBatch.currentPopulation} dona</div>
                                </div>
                                {permissions.canCloseBatch && (
                                    <Button size="sm" variant="outline" className="h-7 text-xs border-red-200 hover:bg-red-50 text-red-600" onClick={onBatchCloseClick}>
                                        <StopCircle className="h-3 w-3 mr-1" /> Yopish
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="flex justify-between items-center h-9">
                                <span className="text-sm text-slate-400 italic">Faol batch yo'q</span>
                                {permissions.canCreateBatch && (
                                    <Button size="sm" variant="outline" className="h-7 text-xs border-green-200 hover:bg-green-50 text-green-600" onClick={onBatchStartClick}>
                                        <PlayCircle className="h-3 w-3 mr-1" /> Boshlash
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Report Info */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-semibold text-slate-500 uppercase">Bugungi Hisobot</span>
                            {todayReport.report?.status === 'approved' && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {todayReport.report?.status === 'pending' && <Clock className="h-4 w-4 text-amber-500" />}
                        </div>

                        {todayReport.submitted && todayReport.report ? (
                            <>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-600">Holati:</span>
                                    <Badge variant={todayReport.report.status === 'pending' ? 'outline' : 'default'}
                                        className={
                                            todayReport.report.status === 'approved' ? 'bg-green-500' :
                                                todayReport.report.status === 'rejected' ? 'bg-red-500' :
                                                    'text-amber-600 border-amber-200 bg-amber-50'
                                        }>
                                        {todayReport.report.status.toUpperCase()}
                                    </Badge>
                                </div>
                                {todayReport.report.status === 'pending' && permissions.canApproveReport && (
                                    <Button className="w-full mt-2" size="sm" onClick={onReportClick}>
                                        <FileText className="h-3 w-3 mr-2" /> Ko'rish va Tasdiqlash
                                    </Button>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-2 text-sm text-slate-400 italic">
                                Hozircha hisobot yo'q
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
