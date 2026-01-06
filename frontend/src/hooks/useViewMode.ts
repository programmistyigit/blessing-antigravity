import { useState, useEffect } from 'react';

type ViewMode = 'table' | 'card';

const STORAGE_KEY = 'blessing_view_modes';

/**
 * Hook to persist view mode preference per page
 * @param pageKey - Unique page identifier (e.g., 'roles', 'sections', 'batches')
 * @param defaultMode - Default view mode if none is saved
 */
export function useViewMode(pageKey: string, defaultMode: ViewMode = 'table') {
    const [mode, setMode] = useState<ViewMode>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed[pageKey] || defaultMode;
            }
        } catch {
            // ignore parse errors
        }
        return defaultMode;
    });

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            const current = saved ? JSON.parse(saved) : {};
            current[pageKey] = mode;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
        } catch {
            // ignore storage errors
        }
    }, [pageKey, mode]);

    return [mode, setMode] as const;
}

export default useViewMode;
