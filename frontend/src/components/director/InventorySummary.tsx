import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Package, AlertTriangle } from "lucide-react";
import type { IInventorySummary } from "@/types/dashboard.types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface InventorySummaryProps {
    inventory?: IInventorySummary;
    loading?: boolean;
}

export function InventorySummary({ inventory, loading }: InventorySummaryProps) {
    if (loading) {
        return (
            <Card className="h-full">
                <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-center mb-6">
                        <Skeleton className="h-10 w-24" />
                    </div>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex justify-between items-center">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-12" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        )
    }

    if (!inventory) return null;

    const lowStockItems = inventory.lowStockItems || [];

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                    <span>Ombor Holati</span>
                    <Package className="h-5 w-5 text-slate-400" />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-center mb-6">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">{inventory.totalItems}</span>
                    <p className="text-sm text-slate-500">Jami mahsulot turlari</p>
                </div>

                <div className="space-y-3">
                    <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                        Kam qolgan ({lowStockItems.length})
                    </h5>

                    {lowStockItems.length > 0 ? (
                        <div className="space-y-2">
                            {lowStockItems.slice(0, 3).map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm p-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/20">
                                    <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                                    <Badge variant="outline" className="bg-white dark:bg-slate-800 text-amber-600 border-amber-200">
                                        {item.currentStock} {item.unit}
                                    </Badge>
                                </div>
                            ))}
                            {lowStockItems.length > 3 && (
                                <p className="text-xs text-center text-slate-400 mt-2">
                                    + yana {lowStockItems.length - 3} ta mahsulot
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg text-center">
                            Zaxira yetarli
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
