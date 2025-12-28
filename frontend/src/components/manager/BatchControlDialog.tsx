import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface BatchControlDialogProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'START' | 'CLOSE';
    onStart: (data: any) => Promise<void>;
    onCloseBatch: (data: any) => Promise<void>;
}

export function BatchControlDialog({ isOpen, onClose, mode, onStart, onCloseBatch }: BatchControlDialogProps) {
    const [loading, setLoading] = useState(false);

    // Start Batch State
    const [batchNumber, setBatchNumber] = useState('');
    const [initialPopulation, setInitialPopulation] = useState('');
    const [breed, setBreed] = useState('');

    // Close Batch State
    const [notes, setNotes] = useState('');

    const handleSubmit = async () => {
        setLoading(true);
        try {
            if (mode === 'START') {
                await onStart({
                    batchNumber,
                    initialPopulation: Number(initialPopulation),
                    breed
                });
            } else {
                await onCloseBatch({ notes });
            }
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'START' ? 'Yangi Batch Boshlash' : 'Batchni Yopish'}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {mode === 'START' ? (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="batchNumber">Batch Raqami</Label>
                                <Input
                                    id="batchNumber"
                                    value={batchNumber}
                                    onChange={(e) => setBatchNumber(e.target.value)}
                                    placeholder="Masalan: B-2024-01"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="population">Boshlang'ich Soni</Label>
                                <Input
                                    id="population"
                                    type="number"
                                    value={initialPopulation}
                                    onChange={(e) => setInitialPopulation(e.target.value)}
                                    placeholder="Masalan: 5000"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="breed">Zoti (Ixtiyoriy)</Label>
                                <Input
                                    id="breed"
                                    value={breed}
                                    onChange={(e) => setBreed(e.target.value)}
                                    placeholder="Masalan: Cobb 500"
                                />
                            </div>
                        </>
                    ) : (
                        <div className="grid gap-2">
                            <Label htmlFor="notes">Yopish bo'yicha izoh</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Batch yakunlanishi haqida qisqacha..."
                            />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Bekor qilish</Button>
                    <Button onClick={handleSubmit} disabled={loading || (mode === 'START' && (!batchNumber || !initialPopulation))}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {mode === 'START' ? 'Boshlash' : 'Yopish'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
