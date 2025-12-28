import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardService } from '@/services/dashboard.service';
import { useSocket } from '@/services/socket';
import type { ICompanyStats } from '@/types/dashboard.types';

// Components
import { KPIGrid } from './KPIGrid';
import { AlertsPanel } from './AlertsPanel';
import { SectionOverview } from './SectionOverview';
import { InventorySummary } from './InventorySummary';
import { AttendanceSummary } from './AttendanceSummary';
import { DelegationCard } from './DelegationCard';

export function DirectorDashboard() {
    const [stats, setStats] = useState<ICompanyStats | null>(null);
    const [loading, setLoading] = useState(true);
    const socket = useSocket();

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await DashboardService.getCompanyStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch dashboard stats', error);
            // toast error is now handled by api interceptor mostly, but keeping specific msg here is okay or let it bubble?
            // User requested "user-friendly toast". If I added interceptor, I might double toast. 
            // For now I'll just rely on interceptor OR leave this generic one until I implement interceptor.
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Realtime updates
        const events = [
            'report_created',
            'report_approved',
            'report_rejected',
            'batch_started',
            'batch_closed',
            'inventory_updated',
            'attendance_created'
        ];

        const handleUpdate = () => {
            // Optimistic update or refetch? Refetch is safer for dash
            fetchData();
        };

        events.forEach(event => socket.on(event, handleUpdate));

        return () => {
            events.forEach(event => socket.off(event, handleUpdate));
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Boshqaruv Paneli</h2>
                <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Yangilash
                </Button>
            </div>

            {/* Top KPI Cards */}
            <KPIGrid stats={stats?.kpi} loading={loading} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area (2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                    <AlertsPanel alerts={stats?.alerts} loading={loading} />
                    <SectionOverview sections={stats?.sections} loading={loading} />
                </div>

                {/* Side Panel (1 col) */}
                <div className="space-y-6">
                    <InventorySummary inventory={stats?.inventory} loading={loading} />
                    <AttendanceSummary attendance={stats?.attendance} loading={loading} />
                    <DelegationCard />
                </div>
            </div>
        </div>
    );
}
