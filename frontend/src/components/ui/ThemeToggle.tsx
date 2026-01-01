import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/stores/theme.store';
import { Sun, Moon, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRef, useCallback } from 'react';

export function ThemeToggle() {
    const { theme, setTheme } = useThemeStore();
    const { t } = useTranslation();
    const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

    const themes = [
        { value: 'light', icon: Sun, label: t('theme.light') },
        { value: 'dark', icon: Moon, label: t('theme.dark') },
        { value: 'system', icon: Monitor, label: t('theme.system') },
    ] as const;

    // Circular reveal animation for theme change
    const handleThemeChange = useCallback((newTheme: 'light' | 'dark' | 'system', event: React.MouseEvent<HTMLButtonElement>) => {
        // Get click position from button center
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        // Calculate the maximum radius needed to cover the screen
        const maxX = Math.max(x, window.innerWidth - x);
        const maxY = Math.max(y, window.innerHeight - y);
        const maxRadius = Math.sqrt(maxX * maxX + maxY * maxY);

        // Check if browser supports View Transitions API
        if (document.startViewTransition) {
            // Use native View Transitions API
            document.documentElement.style.setProperty('--theme-transition-x', `${x}px`);
            document.documentElement.style.setProperty('--theme-transition-y', `${y}px`);
            document.documentElement.style.setProperty('--theme-transition-radius', `${maxRadius}px`);

            document.startViewTransition(() => {
                setTheme(newTheme);
            });
        } else {
            // Fallback: Create overlay with circular clip-path animation
            const isDarkTransition = newTheme === 'dark' ||
                (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

            // Create overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 99999;
        pointer-events: none;
        background: ${isDarkTransition ? '#0f172a' : '#ffffff'};
        clip-path: circle(0px at ${x}px ${y}px);
        transition: clip-path 0.5s ease-out;
      `;
            document.body.appendChild(overlay);

            // Trigger animation
            requestAnimationFrame(() => {
                overlay.style.clipPath = `circle(${maxRadius}px at ${x}px ${y}px)`;
            });

            // Apply theme at animation midpoint
            setTimeout(() => {
                setTheme(newTheme);
            }, 200);

            // Remove overlay after animation
            setTimeout(() => {
                overlay.remove();
            }, 500);
        }
    }, [setTheme]);

    return (
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            {themes.map(({ value, icon: Icon, label }) => (
                <button
                    key={value}
                    ref={(el) => {
                        if (el) buttonRefs.current.set(value, el);
                    }}
                    onClick={(e) => handleThemeChange(value, e)}
                    className={`
            relative p-2 rounded-md transition-colors duration-200
            ${theme === value
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }
          `}
                    title={label}
                    aria-label={label}
                >
                    {theme === value && (
                        <motion.div
                            layoutId="theme-indicator"
                            className="absolute inset-0 bg-white dark:bg-gray-700 rounded-md shadow-sm"
                            initial={false}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                    )}
                    <Icon className="h-4 w-4 relative z-10" />
                </button>
            ))}
        </div>
    );
}
