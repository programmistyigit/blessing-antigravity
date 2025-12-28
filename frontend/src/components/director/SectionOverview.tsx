import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ISectionSummary } from "@/types/dashboard.types";
import { SectionStatus } from "@/types/section.types";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface SectionOverviewProps {
    sections?: ISectionSummary[];
    loading?: boolean;
}

export function SectionOverview({ sections, loading }: SectionOverviewProps) {
    const navigate = useNavigate();

    const getStatusColor = (status: SectionStatus) => {
        switch (status) {
            case SectionStatus.ACTIVE: return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
            case SectionStatus.CLEANING: return 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800';
            case SectionStatus.PREPARING: return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
            default: return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
        }
    };

    if (loading) {
        return (
            <Card className="col-span-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-5 w-16" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="p-4 rounded-xl border space-y-3">
                                <div className="flex justify-between">
                                    <Skeleton className="h-5 w-24" />
                                    <Skeleton className="h-5 w-20" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!sections?.length) {
        return (
            <Card className="col-span-full">
                <CardHeader>
                    <CardTitle className="text-lg">Sexlar Holati</CardTitle>
                </CardHeader>
                <CardContent className="h-32 flex items-center justify-center text-slate-500">
                    Hozircha sexlar mavjud emas
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="col-span-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Sexlar Holati</CardTitle>
                <Badge variant="secondary">{sections.length} ta sex</Badge>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sections.map((section) => (
                        <div
                            key={section.id}
                            onClick={() => navigate(`/dashboard/sections/${section.id}`)}
                            className="group flex flex-col justify-between p-4 rounded-xl border bg-card hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-lg transition-all cursor-pointer border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-semibold text-base group-hover:text-blue-600 transition-colors">{section.name}</h4>
                                    <Badge className={`mt-1 font-normal ${getStatusColor(section.status)}`}>
                                        {section.status}
                                    </Badge>
                                </div>
                                {section.hasActiveBatch && (
                                    <div className="flex flex-col items-end">
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                            Batch Active
                                        </Badge>
                                        {section.batchAge && (
                                            <span className="text-xs text-slate-500 mt-1">{section.batchAge} kun</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                <div className="flex justify-between border-b pb-1 border-slate-100 dark:border-slate-800">
                                    <span>Kunlik O'lim:</span>
                                    <span className={section.dailyMortality && section.dailyMortality > 10 ? "text-red-500 font-bold" : ""}>
                                        {section.dailyMortality || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Hisobot:</span>
                                    <span className={`capitalize ${section.reportStatus === 'approved' ? 'text-green-600 font-medium' :
                                        section.reportStatus === 'pending' ? 'text-amber-600 font-medium' :
                                            'text-slate-400'
                                        }`}>
                                        {section.reportStatus || 'Topshirilmagan'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
