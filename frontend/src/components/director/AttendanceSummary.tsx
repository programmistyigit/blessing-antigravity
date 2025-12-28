import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, UserCheck, Clock, UserX, MapPinOff } from "lucide-react";
import type { IAttendanceSummary } from "@/types/dashboard.types";
import { Skeleton } from "@/components/ui/skeleton";

interface AttendanceSummaryProps {
    attendance?: IAttendanceSummary;
    loading?: boolean;
}

export function AttendanceSummary({ attendance, loading }: AttendanceSummaryProps) {
    if (loading) {
        return (
            <Card className="h-full">
                <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} className="h-20 rounded-lg" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!attendance) return null;

    const stats = [
        { label: 'Keldi', value: attendance.present, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
        { label: 'Kechikdi', value: attendance.late, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
        { label: 'Kelmadi', value: attendance.absent, icon: UserX, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
        { label: 'Fake GPS', value: attendance.fakeGps, icon: MapPinOff, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    ];

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                    <span>Davomat</span>
                    <Users className="h-5 w-5 text-slate-400" />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                            <div className={`p-2 rounded-full mb-2 ${stat.bg} ${stat.color}`}>
                                <stat.icon className="h-4 w-4" />
                            </div>
                            <span className="text-2xl font-bold">{stat.value}</span>
                            <span className="text-xs text-slate-500">{stat.label}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-4 text-center">
                    <p className="text-sm text-slate-500">
                        Jami xodimlar: <span className="font-semibold text-slate-900 dark:text-slate-100">{attendance.totalEmployees}</span>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
