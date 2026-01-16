
import React from 'react';
import { useTheme } from '@/contexts/ThemeProvider';
import { Check } from 'lucide-react';

const AccentColorSelector = () => {
  const { theme, setTheme } = useTheme();

  const colors = [
    { name: 'blue', label: 'Azul', class: 'bg-blue-600' },
    { name: 'green', label: 'Verde', class: 'bg-emerald-600' },
    { name: 'red', label: 'Rojo', class: 'bg-rose-600' },
    { name: 'purple', label: 'Púrpura', class: 'bg-violet-600' },
    { name: 'orange', label: 'Naranja', class: 'bg-orange-600' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Color de Acento</h3>
      <div className="flex flex-wrap gap-4">
        {colors.map((color) => (
          <button
            key={color.name}
            onClick={() => setTheme(color.name)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${color.class} ${
              theme === color.name ? 'ring-4 ring-offset-2 ring-slate-300 dark:ring-slate-600' : ''
            }`}
            aria-label={color.label}
          >
            {theme === color.name && <Check className="w-6 h-6 text-white" />}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AccentColorSelector;
