
import React from 'react';
import { Columns } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';

const ClientsColumnsSelector = ({ columns, onColumnsChange }) => {
  const { t } = useTheme();

  const handleToggle = (columnId) => {
    const newColumns = { ...columns, [columnId]: !columns[columnId] };
    onColumnsChange(newColumns);
    localStorage.setItem('client_columns_pref', JSON.stringify(newColumns));
  };

  const columnLabels = {
    name: t('clients.name') || 'Nombre',
    contact: t('clients.contact') || 'Contacto',
    phone: t('clients.phone') || 'Teléfono',
    email: t('clients.email') || 'Email',
    projects: t('clients.projects') || 'Proyectos',
    actions: t('clients.actions') || 'Acciones'
  };

  const handleClear = () => {
    const cleared = Object.keys(columns).reduce((acc, key) => ({ ...acc, [key]: false }), {});
    onColumnsChange(cleared);
  };
  
  const handleSelectAll = () => {
    const all = Object.keys(columns).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    onColumnsChange(all);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="rounded-[8px] px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 flex items-center gap-2">
          <Columns className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-slate-600 dark:text-slate-300">{t('clients.columns')}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 rounded-[12px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg" align="end">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{t('clients.columnsTitle')}</h4>
        </div>
        <div className="p-4 space-y-3">
          {Object.entries(columns).map(([key, isVisible]) => (
            <label key={key} className="flex items-center space-x-3 cursor-pointer group">
              <Checkbox 
                id={`col-${key}`} 
                checked={isVisible}
                onCheckedChange={() => handleToggle(key)}
                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 dark:border-slate-600 transition-all duration-150"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {columnLabels[key]}
              </span>
            </label>
          ))}
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-2">
           <Button variant="ghost" size="sm" onClick={handleClear} className="text-xs h-8 rounded-full border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 transition-colors duration-150 px-3">
             {t('common.clearFilters')}
           </Button>
           <Button variant="ghost" size="sm" onClick={handleSelectAll} className="text-xs h-8 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-150 px-3">
             {t('common.all')}
           </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ClientsColumnsSelector;
