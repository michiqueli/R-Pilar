
import React, { useState } from 'react';
import { Columns, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useTheme } from '@/contexts/ThemeProvider';

const AVAILABLE_COLUMNS = [
  { id: 'date', label: 'common.date' },
  { id: 'description', label: 'common.description' },
  { id: 'concept', label: 'movimientos.concept' },
  { id: 'project', label: 'tasks.project' },
  { id: 'responsible', label: 'movimientos.responsable' },
  { id: 'type', label: 'movimientos.tipo' },
  { id: 'status', label: 'common.status' },
  { id: 'amount', label: 'common.amount' },
  { id: 'actions', label: 'common.actions' }
];

const MovimientosColumnsPopover = ({ selectedColumns, onApply }) => {
  const { t } = useTheme();
  const [localColumns, setLocalColumns] = useState(selectedColumns);
  const [open, setOpen] = useState(false);

  const handleToggle = (columnId) => {
    setLocalColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(c => c !== columnId)
        : [...prev, columnId]
    );
  };

  const handleApply = () => {
    onApply(localColumns);
    setOpen(false);
  };

  const handleClear = () => {
    setLocalColumns([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={`rounded-[8px] px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 border-gray-200 dark:border-gray-700 bg-transparent ${open ? 'bg-gray-100 dark:bg-gray-800' : ''}`}>
          <Columns className="w-4 h-4 mr-2 text-gray-500" />
          <span className="text-gray-700 dark:text-gray-300">{t('common.columns')}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0 rounded-[12px] shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111827] overflow-hidden" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
           <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('clients.columnsTitle')}</h4>
           <Button variant="ghost" size="iconSm" onClick={() => setOpen(false)} className="rounded-full h-6 w-6">
             <X className="w-3 h-3" />
           </Button>
        </div>

        <div className="p-3 space-y-1">
          {AVAILABLE_COLUMNS.map(col => (
            <div key={col.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
              <Checkbox
                id={`col-${col.id}`}
                checked={localColumns.includes(col.id)}
                onCheckedChange={() => handleToggle(col.id)}
                className="border-gray-300 dark:border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <label
                htmlFor={`col-${col.id}`}
                className="text-sm font-medium leading-none cursor-pointer flex-1 text-gray-700 dark:text-gray-300"
              >
                {t(col.label)}
              </label>
            </div>
          ))}
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
           <Button 
             variant="ghost" 
             size="sm" 
             onClick={handleClear} 
             className="rounded-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
           >
             {t('movimientos.clear_filters')}
           </Button>
           <Button 
             size="sm" 
             onClick={handleApply} 
             className="rounded-full bg-blue-600 text-white hover:bg-blue-700 text-xs px-4"
           >
             {t('movimientos.apply_filters')}
           </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MovimientosColumnsPopover;
