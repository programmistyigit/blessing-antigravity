import { useCallback } from 'react';
import { useLanguageStore } from '@/store/language.store';
import { dictionaries, getNestedValue } from '@/i18n';

/**
 * Hook for translations
 * Usage: const { t, language } = useTranslate();
 *        t('common.loading') → "Yuklanmoqda..." (or translated value)
 */
export function useTranslate() {
    const { language } = useLanguageStore();

    const t = useCallback(
        (key: string): string => {
            const dictionary = dictionaries[language];
            return getNestedValue(dictionary as unknown as Record<string, unknown>, key);
        },
        [language]
    );

    return { t, language };
}
