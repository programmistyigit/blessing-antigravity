import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import type { IDailyReport } from '@/types/section.types';
import { Check, X, AlertTriangle } from 'lucide-react';

interface ReportApprovalDialogProps {
    isOpen: boolean;
    onClose: () => void;
    report: IDailyReport;
    onApprove: (id: string) => Promise<void>;
    onReject: (id: string, reason: string) => Promise<void>;
}

export function ReportApprovalDialog({ isOpen, onClose, report, onApprove, onReject }: ReportApprovalDialogProps) {
    const [rejectMode, setRejectMode] = useState(false);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const handleApprove = async () => {
        setLoading(true);
        try {
            await onApprove(report._id);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!reason.trim()) return;
        setLoading(true);
        try {
            await onReject(report._id, reason);
            onClose();
            setReason('');
            setRejectMode(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Hisobotni Tasdiqlash</DialogTitle>
                    <DialogDescription>
                        {new Date(report.date).toLocaleDateString()} sanasi uchun hisobot
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-slate-50 p-3 rounded-lg">
                            <span className="text-gray-500 block">O'rtacha Vazn</span>
                            <span className="font-semibold text-lg">{report.avgWeight} gr</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg">
                            <span className="text-gray-500 block">O'lim Soni</span>
                            <span className="font-semibold text-lg text-red-600">{report.deaths}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg">
                            <span className="text-gray-500 block">Yem (Kg)</span>
                            <span className="font-semibold text-lg">{report.feedUsedKg}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg">
                            <span className="text-gray-500 block">Suv (L)</span>
                            <span className="font-semibold text-lg">{report.waterUsedLiters}</span>
                        </div>
                    </div>

                    {report.notes && (
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                            <div className="flex items-center gap-2 text-yellow-700 mb-1">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="font-semibold text-xs uppercase">Izoh</span>
                            </div>
                            <p className="text-sm text-yellow-800">{report.notes}</p>
                        </div>
                    )}

                    {rejectMode && (
                        <div className="mt-2">
                            <label className="text-sm font-medium mb-1.5 block">Rad etish sababi:</label>
                            <Textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Nima uchun rad etilmoqda? Masalan: O'lim soni shubhali..."
                                className="border-red-200 focus:ring-red-500"
                            />
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    {rejectMode ? (
                        <>
                            <Button variant="ghost" onClick={() => setRejectMode(false)} disabled={loading}>
                                Bekor qilish
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleReject}
                                disabled={!reason.trim() || loading}
                            >
                                {loading ? 'Yuborilmoqda...' : 'Rad Etishni Tasdiqlash'}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => setRejectMode(true)} className="text-red-500 hover:text-red-600 hover:bg-red-50" disabled={loading}>
                                <X className="mr-2 h-4 w-4" /> Rad Etish
                            </Button>
                            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700" disabled={loading}>
                                <Check className="mr-2 h-4 w-4" /> Tasdiqlash
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
