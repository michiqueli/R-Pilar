
import React from 'react';
import { useTheme } from '@/contexts/ThemeProvider';
import { Label } from '@/components/ui/label';
import { Sun, Moon, Monitor } from 'lucide-react';

const ThemeSelector = () => {
  const { mode, setMode, t } = useTheme();

  const options = [
    { value: 'light', label: t('settings.lightMode'), icon: Sun },
    { value: 'dark', label: t('settings.darkMode'), icon: Moon },
    { value: 'auto', label: 'Auto', icon: Monitor },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Tema</h3>
      <div className="grid grid-cols-3 gap-4">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = mode === option.value;
          return (
            <button
              key={option.value}
              onClick={() => setMode(option.value)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:border-blue-200'
              }`}
            >
              <Icon className="w-6 h-6 mb-2" />
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ThemeSelector;
