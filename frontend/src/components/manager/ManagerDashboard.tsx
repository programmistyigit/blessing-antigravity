import { useEffect, useState } from 'react';
import type { ISection, ITodayReportStatus } from '@/types/section.types';
import { SectionStatus } from '@/types/section.types';
import { ManagerService } from '@/services/manager.service';
import { getTodayReportStatus } from '@/services/section.service';
import { useSocket } from '@/services/socket';
import { ManagerSectionCard } from './ManagerSectionCard';
import { ReportApprovalDialog } from './ReportApprovalDialog';
import { SectionStatusDialog } from './SectionStatusDialog';
import { BatchControlDialog } from './BatchControlDialog';
import { useAuthStore } from '@/store/auth.store';
import { Permission } from '@/types/auth.types';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export function ManagerDashboard() {
    const [sections, setSections] = useState<ISection[]>([]);
    const [reportStatuses, setReportStatuses] = useState<Record<string, ITodayReportStatus>>({});
    const [loading, setLoading] = useState(true);

    const { hasPermission } = useAuthStore();
    const socket = useSocket();

    // Dialog States
    const [selectedSection, setSelectedSection] = useState<ISection | null>(null);
    const [showStatusDialog, setShowStatusDialog] = useState(false);
    const [showBatchDialog, setShowBatchDialog] = useState(false);
    const [batchDialogMode, setBatchDialogMode] = useState<'START' | 'CLOSE'>('START');
    const [showReportDialog, setShowReportDialog] = useState(false);

    // Permissions
    const permissions = {
        canUpdateStatus: hasPermission(Permission.SECTION_STATUS_UPDATE),
        canCreateBatch: hasPermission(Permission.BATCH_CREATE),
        canCloseBatch: hasPermission(Permission.BATCH_CLOSE),
        canApproveReport: hasPermission(Permission.SECTION_DAILY_REPORT_APPROVE),
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const sectionsData = await ManagerService.getAllSections();
            setSections(sectionsData);

            // Fetch report status for each section
            const statuses: Record<string, ITodayReportStatus> = {};
            await Promise.all(sectionsData.map(async (sec) => {
                try {
                    statuses[sec._id] = await getTodayReportStatus(sec._id);
                } catch (e) {
                    console.error(`Failed to fetch report status for ${sec.name}`, e);
                }
            }));
            setReportStatuses(statuses);
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
            // toast error handled by api interceptor
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Socket Listeners
        const handleRefresh = () => fetchData();

        socket.on('report_created', handleRefresh);
        socket.on('batch_started', handleRefresh);
        socket.on('batch_closed', handleRefresh);
        socket.on('section_status_changed', handleRefresh);

        return () => {
            socket.off('report_created', handleRefresh);
            socket.off('batch_started', handleRefresh);
            socket.off('batch_closed', handleRefresh);
            socket.off('section_status_changed', handleRefresh);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Handlers
    const handleStatusUpdate = async (status: SectionStatus) => {
        if (!selectedSection) return;
        await ManagerService.updateSectionStatus(selectedSection._id, status);
        toast.success('Sex holati yangilandi');
        fetchData();
    };

    const handleBatchStart = async (data: any) => {
        if (!selectedSection) return;
        await ManagerService.startBatch({ ...data, sectionId: selectedSection._id });
        toast.success('Yangi batch boshlandi');
        fetchData();
    };

    const handleBatchClose = async (data: any) => {
        if (!selectedSection?.activeBatchId) return;
        const batchId = typeof selectedSection.activeBatchId === 'object'
            ? selectedSection.activeBatchId._id
            : selectedSection.activeBatchId;

        await ManagerService.closeBatch(batchId, undefined, data.notes);
        toast.success('Batch yopildi');
        fetchData();
    };

    const handleApproveReport = async (reportId: string) => {
        await ManagerService.approveReport(reportId);
        toast.success('Hisobot tasdiqlandi');
        fetchData();
    };

    const handleRejectReport = async (reportId: string, reason: string) => {
        await ManagerService.rejectReport(reportId, reason);
        toast.success('Hisobot rad etildi');
        fetchData();
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48 mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <Skeleton key={i} className="h-64 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold px-1">Seksiyalar Boshqaruvi</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map(section => (
                    <ManagerSectionCard
                        key={section._id}
                        section={section}
                        todayReport={reportStatuses[section._id] || { submitted: false }}
                        permissions={permissions}
                        onStatusClick={() => {
                            setSelectedSection(section);
                            setShowStatusDialog(true);
                        }}
                        onBatchStartClick={() => {
                            setSelectedSection(section);
                            setBatchDialogMode('START');
                            setShowBatchDialog(true);
                        }}
                        onBatchCloseClick={() => {
                            setSelectedSection(section);
                            setBatchDialogMode('CLOSE');
                            setShowBatchDialog(true);
                        }}
                        onReportClick={() => {
                            setSelectedSection(section);
                            setShowReportDialog(true);
                        }}
                    />
                ))}
            </div>

            {selectedSection && (
                <>
                    <SectionStatusDialog
                        isOpen={showStatusDialog}
                        onClose={() => setShowStatusDialog(false)}
                        currentStatus={selectedSection.status}
                        hasActiveBatch={!!selectedSection.activeBatchId}
                        onUpdate={handleStatusUpdate}
                    />

                    <BatchControlDialog
                        isOpen={showBatchDialog}
                        onClose={() => setShowBatchDialog(false)}
                        mode={batchDialogMode}
                        onStart={handleBatchStart}
                        onCloseBatch={handleBatchClose}
                    />

                    {reportStatuses[selectedSection._id]?.report && (
                        <ReportApprovalDialog
                            isOpen={showReportDialog}
                            onClose={() => setShowReportDialog(false)}
                            report={reportStatuses[selectedSection._id].report!}
                            onApprove={handleApproveReport}
                            onReject={handleRejectReport}
                        />
                    )}
                </>
            )}
        </div>
    );
}
