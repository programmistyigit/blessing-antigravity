// Backend i18n exports
import { uz, type BackendTranslationKeys } from './uz';
import { ru } from './ru';
import { en } from './en';

export type Language = 'uz' | 'ru' | 'en';
export type { BackendTranslationKeys };
export { uz, ru, en };

// Dictionary map
export const dictionaries: Record<Language, BackendTranslationKeys> = {
    uz,
    ru,
    en,
};

// Supported languages
export const supportedLanguages: Language[] = ['uz', 'ru', 'en'];
export const defaultLanguage: Language = 'uz';

// Get nested value from object by dot notation key
function getNestedValue(obj: Record<string, unknown>, key: string): string | undefined {
    const keys = key.split('.');
    let result: unknown = obj;

    for (const k of keys) {
        if (result && typeof result === 'object' && k in result) {
            result = (result as Record<string, unknown>)[k];
        } else {
            return undefined;
        }
    }

    return typeof result === 'string' ? result : undefined;
}

/**
 * Translate a key to the specified language
 * @param key - Dot notation key (e.g., 'errors.unauthorized')
 * @param lang - Target language (defaults to 'uz')
 * @returns Translated string or the key if not found
 */
export function t(key: string, lang: Language = 'uz'): string {
    const dictionary = dictionaries[lang] || dictionaries[defaultLanguage];
    return getNestedValue(dictionary as unknown as Record<string, unknown>, key) || key;
}

/**
 * Check if a language is supported
 */
export function isValidLanguage(lang: string): lang is Language {
    return supportedLanguages.includes(lang as Language);
}
