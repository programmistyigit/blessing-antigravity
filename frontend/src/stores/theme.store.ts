import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            theme: 'system',
            setTheme: (theme) => set({ theme }),
            toggleTheme: () => {
                const current = get().theme;
                const next = current === 'dark' ? 'light' : 'dark';
                set({ theme: next });
            },
        }),
        {
            name: 'blessing-theme',
        }
    )
);
