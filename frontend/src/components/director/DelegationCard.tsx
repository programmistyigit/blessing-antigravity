import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ListChecks } from "lucide-react";

export function DelegationCard() {
    return (
        <Card className="h-full border-dashed border-2">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                    <span>Delegatsiya</span>
                    <ListChecks className="h-5 w-5 text-slate-400" />
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-32 text-center">
                <p className="text-sm text-slate-500">Hozircha ma'lumot yo'q</p>
                <p className="text-xs text-slate-400 mt-1">Vazifalar taqsimoti tez orada qo'shiladi</p>
            </CardContent>
        </Card>
    );
}
