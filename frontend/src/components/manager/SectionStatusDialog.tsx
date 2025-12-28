import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { SectionStatus } from '@/types/section.types';
import { Loader2 } from 'lucide-react';

interface SectionStatusDialogProps {
    isOpen: boolean;
    onClose: () => void;
    currentStatus: SectionStatus;
    hasActiveBatch: boolean;
    onUpdate: (status: SectionStatus) => Promise<void>;
}

export function SectionStatusDialog({ isOpen, onClose, currentStatus, hasActiveBatch, onUpdate }: SectionStatusDialogProps) {
    const [status, setStatus] = useState<SectionStatus>(currentStatus);
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        setLoading(true);
        try {
            await onUpdate(status);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Sex Holatini O'zgartirish</DialogTitle>
                    <DialogDescription>
                        Joriy holat: <span className="font-semibold">{currentStatus}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <label className="text-sm font-medium mb-1.5 block">Yangi Holat</label>
                    <Select value={status} onValueChange={(val: string) => setStatus(val as SectionStatus)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Holatni tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={SectionStatus.PREPARING}>Tayyorlanmoqda (PREPARING)</SelectItem>
                            <SelectItem value={SectionStatus.CLEANING}>Tozalanmoqda (CLEANING)</SelectItem>
                            <SelectItem value={SectionStatus.INACTIVE}>Faol emas (INACTIVE)</SelectItem>
                            {/* ACTIVE status should ideally be set automatically when creating a batch, but manual override is allowed if batch exists */}
                            <SelectItem value={SectionStatus.ACTIVE} disabled={!hasActiveBatch}>
                                Faol (ACTIVE) {!hasActiveBatch && '(Batch yaratish kerak)'}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Bekor qilish</Button>
                    <Button onClick={handleUpdate} disabled={loading || status === currentStatus}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Saqlash
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
