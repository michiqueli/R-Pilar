
import React, { useState } from 'react';
import { Columns, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';

const InvestorsColumnsSelector = ({ columns, onColumnsChange }) => {
  const { t } = useTheme();
  const [open, setOpen] = useState(false);
  const [localColumns, setLocalColumns] = useState(columns);

  const availableColumns = [
    { id: 'name', label: 'investors.name' },
    { id: 'contact', label: 'investors.contact' },
    { id: 'status', label: 'investors.status' },
    { id: 'invested', label: 'investors.invested' },
    { id: 'returned', label: 'investors.returned' },
    { id: 'netBalance', label: 'investors.netBalance' },
    { id: 'actions', label: 'investors.actions' }
  ];

  const handleApply = () => {
    onColumnsChange(localColumns);
    setOpen(false);
  };

  const handleToggle = (id) => {
    if (localColumns.includes(id)) {
      if (localColumns.length > 1) { // Prevent hiding all columns
        setLocalColumns(localColumns.filter(c => c !== id));
      }
    } else {
      setLocalColumns([...localColumns, id]);
    }
  };

  const handleReset = () => {
    setLocalColumns(availableColumns.map(c => c.id));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn(
          "rounded-[8px] px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 border-gray-200 dark:border-gray-700 bg-transparent h-9",
          open && "bg-gray-100 dark:bg-gray-800"
        )}>
          <Columns className="w-4 h-4 mr-2 text-gray-500" />
          <span className="text-gray-700 dark:text-gray-300 text-sm">{t('investors.columns')}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0 rounded-[12px] shadow-lg border border-gray-200 dark:border-[#374151] bg-white dark:bg-[#111827] overflow-hidden" align="start">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
           <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{t('investors.columns')}</h3>
           <button 
             onClick={() => setOpen(false)}
             className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
           >
             <X className="w-4 h-4" />
           </button>
        </div>

        <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
           {availableColumns.map(col => (
             <div key={col.id} className="flex items-center space-x-2 p-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-md transition-colors">
                <Checkbox 
                  id={`col-${col.id}`}
                  checked={localColumns.includes(col.id)}
                  onCheckedChange={() => handleToggle(col.id)}
                  className="data-[state=checked]:bg-[#3B82F6] data-[state=checked]:border-[#3B82F6]"
                />
                <Label 
                  htmlFor={`col-${col.id}`} 
                  className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1 font-normal"
                >
                  {t(col.label)}
                </Label>
             </div>
           ))}
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex gap-2">
           <Button
             variant="outline"
             onClick={handleReset}
             className="flex-1 rounded-full border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 h-8 text-xs"
           >
             {t('common.clearFilters')}
           </Button>
           <Button
             variant="primary"
             onClick={handleApply}
             className="flex-1 rounded-full bg-[#3B82F6] hover:bg-blue-700 text-white shadow-md h-8 text-xs"
           >
             {t('common.applyFilters')}
           </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default InvestorsColumnsSelector;
