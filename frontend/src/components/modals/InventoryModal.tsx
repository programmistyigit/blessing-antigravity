import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Package, AlertTriangle } from 'lucide-react';

interface InventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function InventoryModal({ isOpen, onClose }: InventoryModalProps) {
    // Mock data - eventually needs to be fetched
    const items = [
        { id: 1, name: "Tovuq Yemi (Start)", quantity: 1500, unit: "kg", status: "ok" },
        { id: 2, name: "Vitamin A", quantity: 20, unit: "litr", status: "low" },
        { id: 3, name: "Qadoqlash qutisi", quantity: 5000, unit: "dona", status: "ok" },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Ombor Holati</DialogTitle>
                    <DialogDescription>
                        Mavjud zaxiralar va ularning holati
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {items.map((item) => (
                        <Card key={item.id} className="border shadow-none bg-slate-50">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${item.status === 'low' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                        <Package className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{item.name}</p>
                                        <p className="text-sm text-gray-500">Zaxira</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold font-mono">{item.quantity} <span className="text-sm font-normal text-gray-500">{item.unit}</span></p>
                                    {item.status === 'low' && (
                                        <div className="flex items-center justify-end text-xs text-red-600 gap-1">
                                            <AlertTriangle className="h-3 w-3" />
                                            <span>Kam qoldi</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
