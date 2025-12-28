import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'uz' | 'ru' | 'en';

interface LanguageState {
    language: Language;
    setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set) => ({
            language: 'uz',
            setLanguage: (lang: Language) => set({ language: lang }),
        }),
        {
            name: 'language-storage',
        }
    )
);
