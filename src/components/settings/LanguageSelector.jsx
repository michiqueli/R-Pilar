
import React from 'react';
import { useTheme } from '@/contexts/ThemeProvider';

const LanguageSelector = () => {
  const { locale, setLocale, t } = useTheme();

  const languages = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
    { code: 'pt', label: 'Português' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('settings.language')}</h3>
      <div className="flex flex-col sm:flex-row gap-4">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            className={`px-6 py-3 rounded-xl border font-medium text-sm transition-all flex-1 sm:flex-none text-center ${
              locale === lang.code
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
