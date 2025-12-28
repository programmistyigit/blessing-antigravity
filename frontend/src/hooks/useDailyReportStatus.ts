import { useState, useEffect, useCallback } from 'react';
import { getTodayReportStatus } from '@/services/section.service';
import type { IDailyReport } from '@/types/section.types';

interface UseDailyReportStatusResult {
    submitted: boolean;
    report: IDailyReport | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    markAsSubmitted: (report: IDailyReport) => void;
}

/**
 * Hook for checking today's daily report status for a section
 */
export function useDailyReportStatus(sectionId: string): UseDailyReportStatusResult {
    const [submitted, setSubmitted] = useState(false);
    const [report, setReport] = useState<IDailyReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStatus = useCallback(async () => {
        if (!sectionId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await getTodayReportStatus(sectionId);
            setSubmitted(data.submitted);
            setReport(data.report || null);
        } catch (err: unknown) {
            console.error('Failed to fetch report status:', err);
            setError('Hisobot holatini tekshirishda xatolik');
            setSubmitted(false);
            setReport(null);
        } finally {
            setLoading(false);
        }
    }, [sectionId]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    const markAsSubmitted = useCallback((newReport: IDailyReport) => {
        setSubmitted(true);
        setReport(newReport);
    }, []);

    return {
        submitted,
        report,
        loading,
        error,
        refetch: fetchStatus,
        markAsSubmitted,
    };
}
