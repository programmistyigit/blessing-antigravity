import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { type Language, isValidLanguage, defaultLanguage } from '../i18n';

// Extend Fastify Request to include language
declare module 'fastify' {
    interface FastifyRequest {
        language: Language;
    }
}

/**
 * Parse Accept-Language header and return the best matching language
 */
function parseAcceptLanguage(header: string | undefined): Language {
    if (!header) return defaultLanguage;

    // Parse Accept-Language header (e.g., "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7")
    const languages = header
        .split(',')
        .map((lang) => {
            const [code, qValue] = lang.trim().split(';q=');
            const langCode = code.split('-')[0].toLowerCase(); // Get base language (ru from ru-RU)
            const quality = qValue ? parseFloat(qValue) : 1.0;
            return { code: langCode, quality };
        })
        .sort((a, b) => b.quality - a.quality);

    // Find first supported language
    for (const { code } of languages) {
        if (isValidLanguage(code)) {
            return code;
        }
    }

    return defaultLanguage;
}

/**
 * Language hook for Fastify - extracts language from Accept-Language header
 * and attaches it to request.language
 * 
 * Usage in Fastify:
 * fastify.addHook('onRequest', languageHook);
 */
export const languageHook = (
    request: FastifyRequest,
    _reply: FastifyReply,
    done: HookHandlerDoneFunction
): void => {
    const acceptLanguage = request.headers['accept-language'];
    request.language = parseAcceptLanguage(acceptLanguage);
    done();
};
