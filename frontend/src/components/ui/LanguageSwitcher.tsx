import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const languages = [
    { code: 'uz', name: "O'zbek", flag: '🇺🇿' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

export function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Wave ripple animation for language change
    const handleLanguageChange = useCallback((code: string) => {
        if (code === i18n.language) {
            setIsOpen(false);
            return;
        }

        // Get button position for ripple origin
        const button = buttonRef.current;
        if (!button) {
            i18n.changeLanguage(code);
            setIsOpen(false);
            return;
        }

        const rect = button.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        // Create shadow ripple overlay - MORE VISIBLE VERSION
        const ripple = document.createElement('div');
        ripple.className = 'language-ripple';
        ripple.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 99998;
      pointer-events: none;
      background: radial-gradient(
        circle at ${x}px ${y}px,
        rgba(59, 130, 246, 0.4) 0%,
        rgba(59, 130, 246, 0.25) 20%,
        rgba(147, 197, 253, 0.15) 40%,
        transparent 60%
      );
      opacity: 0;
      transform: scale(0);
    `;
        document.body.appendChild(ripple);

        // Trigger ripple animation with longer duration
        requestAnimationFrame(() => {
            ripple.style.transition = 'opacity 0.2s ease-out, transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            ripple.style.opacity = '1';
            ripple.style.transform = 'scale(4)';
        });

        // Add wave class to all text elements
        const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, button, a, label');
        textElements.forEach((el, index) => {
            const htmlEl = el as HTMLElement;
            const delay = Math.min(index * 15, 300); // Stagger animation

            setTimeout(() => {
                htmlEl.classList.add('language-wave');
            }, delay);

            setTimeout(() => {
                htmlEl.classList.remove('language-wave');
            }, delay + 400);
        });

        // Change language after ripple starts
        setTimeout(() => {
            i18n.changeLanguage(code);
        }, 150);

        // Remove ripple
        setTimeout(() => {
            ripple.style.opacity = '0';
        }, 400);

        setTimeout(() => {
            ripple.remove();
        }, 700);

        setIsOpen(false);
    }, [i18n]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{currentLang.flag} {currentLang.name}</span>
                <span className="sm:hidden">{currentLang.flag}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50"
                    >
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleLanguageChange(lang.code)}
                                className={`
                  w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left
                  hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200
                  ${lang.code === i18n.language
                                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                        : 'text-gray-700 dark:text-gray-200'
                                    }
                `}
                            >
                                <span className="text-lg">{lang.flag}</span>
                                <span>{lang.name}</span>
                                {lang.code === i18n.language && (
                                    <motion.div
                                        layoutId="lang-check"
                                        className="ml-auto w-2 h-2 rounded-full bg-primary-500"
                                    />
                                )}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
