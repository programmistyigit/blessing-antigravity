import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Loader2, MapPin, CheckCircle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from "@/services/api";

interface AttendanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    sectionId?: string; // Should be passed from parent
}

export function AttendanceModal({ isOpen, onClose, sectionId = "dummy-section-id" }: AttendanceModalProps) {
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update time every second
    useEffect(() => {
        if (!isOpen) return;
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [isOpen]);

    // Request location when modal opens
    useEffect(() => {
        if (isOpen) {
            setLoading(true); // Loading location
            setError(null);
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setLocation({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                        });
                        setLoading(false);
                    },
                    (err) => {
                        console.error(err);
                        setError("Geolokatsiya olish imkonsiz. Ruxsat berilganligini tekshiring.");
                        setLoading(false);
                    },
                    { enableHighAccuracy: true, timeout: 10000 }
                );
            } else {
                setError("Brauzeringiz geolokatsiyani qo'llab-quvvatlamaydi.");
                setLoading(false);
            }
        } else {
            // Reset state on close
            setSuccess(false);
            setLocation(null);
            setError(null);
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!location) {
            setError("Iltimos, lokatsiya aniqlanishini kuting.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await api.post(`/sections/${sectionId}/attendance`, {
                checkInTime: new Date().toISOString(),
                location: location,
            });

            setSuccess(true);

            // Auto close after 2 seconds
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Xatolik yuz berdi. Qayta urinib ko'ring.");
        } finally {
            setLoading(false);
        }
    };

    const isLate = currentTime.getHours() >= 8 && currentTime.getMinutes() > 0;

    return (
        <Dialog open={isOpen} onOpenChange={() => !loading && !success && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl">Ishga kelishni tasdiqlash</DialogTitle>
                    <DialogDescription className="text-center">
                        GPS orqali joylashuvingiz va vaqt tekshiriladi.
                    </DialogDescription>
                </DialogHeader>

                {success ? (
                    <div className="flex flex-col items-center justify-center py-6 space-y-4 text-green-600">
                        <CheckCircle className="w-16 h-16" />
                        <p className="text-lg font-medium">Muvaffaqiyatli tasdiqlandi!</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6 py-4">
                        {/* Time Display */}
                        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-sm text-gray-500 mb-1">{format(currentTime, "d MMMM, yyyy")}</span>
                            <div className="text-5xl font-mono font-bold text-slate-800 tracking-wider">
                                {format(currentTime, "HH:mm")}
                            </div>
                            <div className={`mt-2 text-xs font-bold px-2 py-1 rounded ${isLate ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                                {isLate ? "KECHIKISH" : "O'Z VAQTIDA"}
                            </div>
                        </div>

                        {/* Location Status */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50/50 rounded-lg border border-blue-100">
                            <div className={`p-2 rounded-full ${location ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">GPS Joylashuv</p>
                                <p className="text-xs text-gray-500">
                                    {loading && !location ? "Aniqlanmoqda..." : location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : "Kutilmoqda..."}
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100 text-center">
                                {error}
                            </div>
                        )}
                    </div>
                )}

                {!success && (
                    <DialogFooter className="sm:justify-between gap-2">
                        <Button variant="ghost" onClick={onClose} disabled={loading}>
                            Bekor qilish
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || !location}
                            className={`w-full ${isLate ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"}`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Yuborilmoqda...
                                </>
                            ) : (
                                "Tasdiqlash"
                            )}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
