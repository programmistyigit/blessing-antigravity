import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, Info, Bell, CheckCircle2 } from "lucide-react";
import type { IDashboardAlert } from "@/types/dashboard.types";
import { formatDistanceToNow } from 'date-fns';
import { uz } from 'date-fns/locale';
import { Skeleton } from "@/components/ui/skeleton";

interface AlertsPanelProps {
    alerts?: IDashboardAlert[];
    loading?: boolean;
}

export function AlertsPanel({ alerts, loading }: AlertsPanelProps) {
    if (loading) {
        return (
            <Card className="h-full">
                <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-lg border">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (!alerts || alerts.length === 0) {
        return (
            <Card className="border-l-4 border-l-green-500 h-full">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Bell className="h-5 w-5 text-slate-500" />
                        Aktual Ogohlantirishlar
                    </CardTitle>
                </CardHeader>
                <CardContent className="py-4 flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Ayni damda hech qanday ogohlantirish yo'q. Tizim barqaror ishlamoqda.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const getIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <AlertCircle className="h-5 w-5 text-white" />;
            case 'warning': return <AlertTriangle className="h-5 w-5 text-white" />;
            default: return <Info className="h-5 w-5 text-white" />;
        }
    };

    const getColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-500 shadow-red-200 shadow-md animate-pulse'; // Added animation
            case 'warning': return 'bg-amber-500 shadow-amber-200 shadow-md';
            default: return 'bg-blue-500 shadow-blue-200 shadow-md';
        }
    };

    const getBorderColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'border-red-100 bg-red-50 dark:bg-red-900/10 dark:border-red-900/50';
            case 'warning': return 'border-amber-100 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/50';
            default: return 'border-blue-100 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-900/50';
        }
    }

    const hasCritical = alerts.some(a => a.severity === 'critical');

    return (
        <Card className="h-full border-t-4 border-t-blue-500">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <div className="relative">
                        <Bell className="h-5 w-5 text-slate-500" />
                        {hasCritical && (
                            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping" />
                        )}
                    </div>
                    Aktual Ogohlantirishlar
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {alerts.map((alert) => (
                    <div key={alert.id} className={`flex gap-3 p-3 rounded-lg border ${getBorderColor(alert.severity)} transition-all hover:translate-x-1`}>
                        <div className={`p-2 rounded-lg h-fit ${getColor(alert.severity)}`}>
                            {getIcon(alert.severity)}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 leading-tight">
                                {alert.message}
                            </h4>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded">
                                    {alert.type}
                                </span>
                                <span className="text-xs text-slate-400">
                                    {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true, locale: uz })}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
