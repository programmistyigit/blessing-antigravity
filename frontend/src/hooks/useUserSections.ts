import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { getUserSections } from '@/services/section.service';
import type { ISection } from '@/types/section.types';

interface UseUserSectionsResult {
    sections: ISection[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Hook for fetching user's assigned sections
 */
export function useUserSections(): UseUserSectionsResult {
    const [sections, setSections] = useState<ISection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuthStore();

    const fetchSections = useCallback(async () => {
        if (!user) {
            setSections([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await getUserSections();
            setSections(data);
        } catch (err: unknown) {
            console.error('Failed to fetch sections:', err);
            setError('Sexlarni yuklashda xatolik yuz berdi');
            setSections([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchSections();
    }, [fetchSections]);

    return {
        sections,
        loading,
        error,
        refetch: fetchSections,
    };
}
