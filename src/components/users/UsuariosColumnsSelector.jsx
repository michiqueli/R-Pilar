import React from 'react';
import { Columns } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/contexts/LanguageContext';

const UsuariosColumnsSelector = ({ columns, onColumnsChange }) => {
  const { t } = useTranslation();

  const handleToggle = (columnId) => {
    const newColumns = { ...columns, [columnId]: !columns[columnId] };
    onColumnsChange(newColumns);
    localStorage.setItem('user_columns_pref_v1', JSON.stringify(newColumns));
  };

  const columnLabels = {
    name: 'Nombre y Email',
    phone: 'Teléfono',
    rol: 'Rol',
    status: 'Estado',
    actions: 'Acciones'
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="rounded-[8px] px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
          <Columns className="w-4 h-4 text-slate-500" />
          <span className="text-slate-600 dark:text-slate-300">Columnas</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 rounded-[12px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg" align="end">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <h4 className="font-semibold text-sm text-center">Columnas Visibles</h4>
        </div>
        <div className="p-4 space-y-3">
          {Object.entries(columns).map(([key, isVisible]) => (
            <label key={key} className="flex items-center space-x-3 cursor-pointer group">
              <Checkbox 
                checked={isVisible}
                onCheckedChange={() => handleToggle(key)}
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors">
                {columnLabels[key]}
              </span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UsuariosColumnsSelector;