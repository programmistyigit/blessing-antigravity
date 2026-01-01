import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import uz from './locales/uz.json';
import en from './locales/en.json';
import ru from './locales/ru.json';

const resources = {
    uz: { translation: uz },
    en: { translation: en },
    ru: { translation: ru },
};

// Get saved language or default to Uzbek
const savedLanguage = localStorage.getItem('blessing-language') || 'uz';

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: savedLanguage,
        fallbackLng: 'uz',
        interpolation: {
            escapeValue: false,
        },
    });

// Save language on change
i18n.on('languageChanged', (lng) => {
    localStorage.setItem('blessing-language', lng);
    document.documentElement.lang = lng;
});

export default i18n;
