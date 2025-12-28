// i18n exports
import { uz, type TranslationKeys } from './uz';
import { ru } from './ru';
import { en } from './en';
import type { Language } from '@/store/language.store';

export type { TranslationKeys };
export { uz, ru, en };

// Dictionary map
export const dictionaries: Record<Language, TranslationKeys> = {
    uz,
    ru,
    en,
};

// Language labels for UI
export const languageLabels: Record<Language, { flag: string; name: string; nativeName: string }> = {
    uz: { flag: '🇺🇿', name: 'Uzbek', nativeName: "O'zbek" },
    ru: { flag: '🇷🇺', name: 'Russian', nativeName: 'Русский' },
    en: { flag: '🇬🇧', name: 'English', nativeName: 'English' },
};

// Get nested value from object by dot notation key
export function getNestedValue(obj: Record<string, unknown>, key: string): string {
    const keys = key.split('.');
    let result: unknown = obj;

    for (const k of keys) {
        if (result && typeof result === 'object' && k in result) {
            result = (result as Record<string, unknown>)[k];
        } else {
            return key; // Return original key if path not found
        }
    }

    return typeof result === 'string' ? result : key;
}
