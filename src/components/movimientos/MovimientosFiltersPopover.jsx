
import React, { useState } from 'react';
import { Filter, X, CheckCircle2, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/contexts/ThemeProvider';

const STATUS_OPTIONS = [
  { value: 'PAGADO', label: 'Pagado' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'COBRADO', label: 'Cobrado' }
];

const MovimientosFiltersPopover = ({ filters, onApply, onClear }) => {
  const { t } = useTheme();
  const [localFilters, setLocalFilters] = useState(filters);
  const [open, setOpen] = useState(false);

  const handleApply = () => {
    onApply(localFilters);
    setOpen(false);
  };

  const handleClear = () => {
    const cleared = {
      type: 'todos',
      status: [],
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: '',
      currency: 'ALL'
    };
    setLocalFilters(cleared);
    onClear(cleared);
    setOpen(false);
  };

  const handleStatusChange = (status) => {
    const current = localFilters.status || [];
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    setLocalFilters({ ...localFilters, status: updated });
  };

  const activeCount =
    (localFilters.type !== 'todos' ? 1 : 0) +
    (localFilters.status?.length || 0) +
    (localFilters.dateFrom || localFilters.dateTo ? 1 : 0) +
    (localFilters.amountMin || localFilters.amountMax ? 1 : 0) + 
    (localFilters.currency !== 'ALL' ? 1 : 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={`rounded-[8px] px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 border-gray-200 dark:border-gray-700 bg-transparent ${open ? 'bg-gray-100 dark:bg-gray-800' : ''}`}>
          <Filter className="w-4 h-4 mr-2 text-gray-500" />
          <span className="text-gray-700 dark:text-gray-300">{t('common.filters')}</span>
          {activeCount > 0 && (
            <span className="ml-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white rounded-full bg-red-500 shadow-sm">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] md:w-[360px] p-0 rounded-[12px] shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111827] overflow-hidden" align="start">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
           <h3 className="font-semibold text-gray-900 dark:text-white">{t('projects.filterPanel.title')}</h3>
           <button 
             onClick={() => setOpen(false)}
             className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
           >
             <X className="w-5 h-5" />
           </button>
        </div>

        <div className="p-5 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Type */}
          <div>
            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
               <CheckCircle2 className="w-3.5 h-3.5" /> {t('movimientos.tipo')}
            </Label>
            <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
               {['todos', 'ingreso', 'gasto'].map(type => (
                 <button
                   key={type}
                   onClick={() => setLocalFilters({ ...localFilters, type })}
                   className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                     localFilters.type === type
                       ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                       : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                   }`}
                 >
                   {t(`movimientos.${type}`)}
                 </button>
               ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t('common.status')}
            </Label>
            <div className="space-y-2.5">
              {STATUS_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2.5">
                  <Checkbox
                    id={`status-${option.value}`}
                    checked={localFilters.status?.includes(option.value)}
                    onCheckedChange={() => handleStatusChange(option.value)}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 border-gray-300 dark:border-gray-600"
                  />
                  <label
                    htmlFor={`status-${option.value}`}
                    className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" /> {t('movimientos.date_range')}
            </Label>
            <div className="flex gap-3">
               <div className="flex-1 space-y-1">
                 <span className="text-[10px] text-gray-400 font-semibold uppercase">{t('movimientos.from')}</span>
                 <Input 
                   type="date" 
                   className="rounded-lg h-9 text-xs border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                   value={localFilters.dateFrom || ''}
                   onChange={(e) => setLocalFilters({...localFilters, dateFrom: e.target.value})}
                 />
               </div>
               <div className="flex-1 space-y-1">
                 <span className="text-[10px] text-gray-400 font-semibold uppercase">{t('movimientos.to')}</span>
                 <Input 
                   type="date" 
                   className="rounded-lg h-9 text-xs border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                   value={localFilters.dateTo || ''}
                   onChange={(e) => setLocalFilters({...localFilters, dateTo: e.target.value})}
                 />
               </div>
            </div>
          </div>

          {/* Amount Range */}
           <div>
            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5" /> {t('common.amount')}
            </Label>
            <div className="flex gap-3">
               <div className="flex-1 space-y-1">
                 <Input 
                   type="number" 
                   placeholder="Min"
                   className="rounded-lg h-9 text-xs border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                   value={localFilters.amountMin || ''}
                   onChange={(e) => setLocalFilters({...localFilters, amountMin: e.target.value})}
                 />
               </div>
               <div className="flex-1 space-y-1">
                 <Input 
                   type="number" 
                   placeholder="Max"
                   className="rounded-lg h-9 text-xs border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                   value={localFilters.amountMax || ''}
                   onChange={(e) => setLocalFilters({...localFilters, amountMax: e.target.value})}
                 />
               </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex gap-3">
           <Button
             variant="outline"
             onClick={handleClear}
             className="flex-1 rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/20"
           >
             {t('movimientos.clear_filters')}
           </Button>
           <Button
             variant="primary"
             onClick={handleApply}
             className="flex-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md"
           >
             {t('movimientos.apply_filters')}
           </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MovimientosFiltersPopover;
