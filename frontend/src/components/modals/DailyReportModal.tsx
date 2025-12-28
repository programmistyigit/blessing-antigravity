import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Scale, Weight, Skull, Wheat, Droplets, Zap, Calendar } from 'lucide-react';
import { submitDailyReport } from '@/services/section.service';
import type { IDailyReport } from '@/types/section.types';

// Zod validation schema
const dailyReportSchema = z.object({
    avgWeight: z.coerce
        .number({ message: "O'rtacha vazn kiritilishi shart" })
        .min(0, "Manfiy qiymat bo'lishi mumkin emas")
        .max(100000, "Qiymat juda katta"),
    totalWeight: z.coerce
        .number({ message: "Umumiy vazn kiritilishi shart" })
        .min(0, "Manfiy qiymat bo'lishi mumkin emas")
        .max(1000000, "Qiymat juda katta"),
    deaths: z.coerce
        .number({ message: "O'lim soni kiritilishi shart" })
        .int("Butun son bo'lishi kerak")
        .min(0, "Manfiy qiymat bo'lishi mumkin emas")
        .max(100000, "Qiymat juda katta"),
    feedUsedKg: z.coerce
        .number({ message: "Yem miqdori kiritilishi shart" })
        .min(0, "Manfiy qiymat bo'lishi mumkin emas")
        .max(100000, "Qiymat juda katta"),
    waterUsedLiters: z.coerce
        .number({ message: "Suv miqdori kiritilishi shart" })
        .min(0, "Manfiy qiymat bo'lishi mumkin emas")
        .max(1000000, "Qiymat juda katta"),
    electricityUsedKwh: z.coerce
        .number({ message: "Elektr miqdori kiritilishi shart" })
        .min(0, "Manfiy qiymat bo'lishi mumkin emas")
        .max(100000, "Qiymat juda katta"),
    notes: z.string().optional(),
});

type DailyReportFormValues = z.infer<typeof dailyReportSchema>;

interface DailyReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    sectionId: string;
    sectionName?: string;
    onSuccess?: (report: IDailyReport) => void;
}

export function DailyReportModal({
    isOpen,
    onClose,
    sectionId,
    sectionName = "Sex",
    onSuccess,
}: DailyReportModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const today = new Date();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<DailyReportFormValues>({
        resolver: zodResolver(dailyReportSchema) as any,
        defaultValues: {
            avgWeight: undefined,
            totalWeight: undefined,
            deaths: undefined,
            feedUsedKg: undefined,
            waterUsedLiters: undefined,
            electricityUsedKwh: undefined,
            notes: '',
        },
    });

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            reset();
        }
    }, [isOpen, reset]);

    const onSubmit: SubmitHandler<DailyReportFormValues> = async (data) => {
        // Check internet connection
        if (!navigator.onLine) {
            toast.warning("Internet aloqasi yo'q", {
                description: "Iltimos, internetga ulanib qayta urinib ko'ring.",
            });
            return;
        }

        setIsLoading(true);

        try {
            const payload = {
                date: format(today, 'yyyy-MM-dd'),
                avgWeight: data.avgWeight,
                totalWeight: data.totalWeight,
                deaths: data.deaths,
                feedUsedKg: data.feedUsedKg,
                waterUsedLiters: data.waterUsedLiters,
                electricityUsedKwh: data.electricityUsedKwh,
                notes: data.notes || undefined,
            };

            const report = await submitDailyReport(sectionId, payload);

            toast.success('Kunlik hisobot saqlandi', {
                description: `${sectionName} uchun hisobot muvaffaqiyatli topshirildi.`,
            });

            reset();
            onSuccess?.(report);
            onClose();
        } catch (error: any) {
            console.error('Failed to submit report:', error);

            // Handle specific error cases
            const message = error.response?.data?.message || error.message;

            if (message?.toLowerCase().includes('already') || message?.toLowerCase().includes('submitted')) {
                toast.error('Hisobot allaqachon topshirilgan', {
                    description: 'Bu sex uchun bugun hisobot avval topshirilgan.',
                });
            } else if (error.response?.status === 403) {
                toast.error('Ruxsat yo\'q', {
                    description: 'Sizda hisobot topshirish huquqi yo\'q.',
                });
            } else if (error.response?.status === 404) {
                toast.error('Sex topilmadi', {
                    description: 'Bu sex mavjud emas yoki o\'chirilgan.',
                });
            } else {
                toast.error('Xatolik yuz berdi', {
                    description: message || 'Iltimos, qayta urinib ko\'ring.',
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const inputFields = [
        {
            id: 'avgWeight',
            label: "O'rtacha vazn",
            unit: 'gram',
            icon: Scale,
            step: '0.1',
            color: 'blue',
        },
        {
            id: 'totalWeight',
            label: 'Umumiy vazn',
            unit: 'kg',
            icon: Weight,
            step: '0.1',
            color: 'indigo',
        },
        {
            id: 'deaths',
            label: "O'lim soni",
            unit: 'dona',
            icon: Skull,
            step: '1',
            color: 'red',
        },
        {
            id: 'feedUsedKg',
            label: 'Yem sarfi',
            unit: 'kg',
            icon: Wheat,
            step: '0.1',
            color: 'amber',
        },
        {
            id: 'waterUsedLiters',
            label: 'Suv sarfi',
            unit: 'litr',
            icon: Droplets,
            step: '0.1',
            color: 'cyan',
        },
        {
            id: 'electricityUsedKwh',
            label: 'Elektr sarfi',
            unit: 'kWh',
            icon: Zap,
            step: '0.01',
            color: 'yellow',
        },
    ] as const;

    return (
        <Dialog open={isOpen} onOpenChange={() => !isLoading && onClose()}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                            <Scale className="h-5 w-5" />
                        </div>
                        Kunlik Hisobot
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-700">{sectionName}</span>
                        <span className="text-gray-400">•</span>
                        <span className="flex items-center gap-1 text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {format(today, 'd MMMM, yyyy')}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    {/* Input Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {inputFields.map((field) => {
                            const Icon = field.icon;
                            const error = errors[field.id as keyof DailyReportFormValues];

                            return (
                                <div key={field.id} className="space-y-2">
                                    <Label
                                        htmlFor={field.id}
                                        className="flex items-center gap-1.5 text-sm font-medium"
                                    >
                                        <Icon className={`h-3.5 w-3.5 text-${field.color}-500`} />
                                        {field.label}
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id={field.id}
                                            type="number"
                                            step={field.step}
                                            min="0"
                                            placeholder="0"
                                            className={`pr-12 ${error
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                                : ''
                                                }`}
                                            {...register(field.id as keyof DailyReportFormValues)}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                                            {field.unit}
                                        </span>
                                    </div>
                                    {error && (
                                        <span className="text-xs text-red-500">{error.message}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Notes Field */}
                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-medium">
                            Izoh (ixtiyoriy)
                        </Label>
                        <Textarea
                            id="notes"
                            placeholder="Qo'shimcha ma'lumotlar..."
                            className="resize-none"
                            rows={3}
                            {...register('notes')}
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Bekor qilish
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saqlanmoqda...
                                </>
                            ) : (
                                'Hisobotni saqlash'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
