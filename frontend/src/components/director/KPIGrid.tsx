import { Card, CardContent } from "@/components/ui/card";
import { Activity, Skull, Wheat, Users } from "lucide-react";
import type { ICompanyStats } from "@/types/dashboard.types";
import { Skeleton } from "@/components/ui/skeleton";

interface KPIGridProps {
    stats?: ICompanyStats['kpi'];
    loading?: boolean;
}

export function KPIGrid({ stats, loading }: KPIGridProps) {
    if (loading || !stats) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-16" />
                            </div>
                            <Skeleton className="h-10 w-10 rounded-xl" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    const items = [
        {
            label: "Faol Sexlar / Batchlar",
            value: (
                <span>
                    {stats.activeSections} <span className="text-sm text-slate-400 font-normal">/ {stats.activeBatches}</span>
                </span>
            ),
            icon: Activity,
            color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
        },
        {
            label: "Bugungi O'lim",
            value: stats.dailyMortality,
            unit: "ta",
            icon: Skull,
            color: stats.dailyMortality > 50
                ? "text-red-600 bg-red-100 dark:bg-red-900/30"
                : "text-slate-600 bg-slate-100 dark:bg-slate-800",
        },
        {
            label: "Yem Sarfi",
            value: stats.dailyConsumption.feed.toLocaleString(),
            unit: "kg",
            icon: Wheat,
            color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
        },
        {
            label: "Kechikkan Xodimlar",
            value: stats.lateEmployees,
            unit: "nafar",
            icon: Users,
            color: stats.lateEmployees > 0
                ? "text-orange-600 bg-orange-100 dark:bg-orange-900/30"
                : "text-green-600 bg-green-100 dark:bg-green-900/30",
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((item, index) => (
                <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
                            <div className="flex items-baseline gap-1 mt-1">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    {item.value}
                                </h3>
                                {item.unit && (
                                    <span className="text-sm text-slate-500 font-medium">{item.unit}</span>
                                )}
                            </div>
                        </div>
                        <div className={`p-3 rounded-xl ${item.color}`}>
                            <item.icon className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
