
import React from 'react';
import { useTheme } from '@/contexts/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/Input';
import { Calendar, User, Briefcase, CheckCircle2 } from 'lucide-react';

const FilterPanel = ({ filters, onFilterChange, onClear, onApply, responsibles = [], clientOptions = [] }) => {
  const { t } = useTheme();

  const handleStatusChange = (status) => {
    const current = filters.status || [];
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    onFilterChange({ ...filters, status: updated });
  };

  const statusOptions = [
    { value: 'active', label: 'status.active' },
    { value: 'on_hold', label: 'status.on_hold' },
    { value: 'completed', label: 'status.completed' },
    { value: 'archived', label: 'status.archived' },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-none md:border border-slate-200 dark:border-slate-800 rounded-xl shadow-none md:shadow-lg overflow-hidden">
      
      {/* Panel Header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          {t('projects.filterPanel.title')}
        </h3>
      </div>
      
      {/* Scrollable Content */}
      <div className="p-6 space-y-8 flex-1 overflow-y-auto max-h-[60vh]">
        
        {/* Status Section */}
        <div className="space-y-3">
           <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-2">
             <CheckCircle2 className="w-4 h-4 text-slate-400" />
             {t('projects.filterPanel.status')}
           </Label>
           <div className="grid grid-cols-2 gap-3">
             {statusOptions.map((option) => (
               <div key={option.value} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                 <Checkbox 
                   id={`status-${option.value}`}
                   checked={filters.status?.includes(option.value)}
                   onCheckedChange={() => handleStatusChange(option.value)}
                   className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                 />
                 <label 
                   htmlFor={`status-${option.value}`}
                   className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none flex-1"
                 >
                   {t(option.label)}
                 </label>
               </div>
             ))}
           </div>
        </div>

        {/* Responsible Section */}
        <div className="space-y-3">
           <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-2">
             <User className="w-4 h-4 text-slate-400" />
             {t('projects.filterPanel.responsable')}
           </Label>
           <select
             className="flex h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:ring-offset-slate-950 dark:placeholder:text-slate-400"
             value={filters.responsible || ''}
             onChange={(e) => onFilterChange({...filters, responsible: e.target.value})}
           >
             <option value="">{t('common.all') || 'Todos'}</option>
             {responsibles.map((person, idx) => (
               <option key={idx} value={person}>{person}</option>
             ))}
           </select>
        </div>

        {/* Client Section - Using existing logic from FilterPopover */}
        <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-slate-400" />
              {t('projects.filterClient')}
            </Label>
            {clientOptions.length > 0 ? (
              <select
                className="flex h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:ring-offset-slate-950"
                value={filters.client || ''}
                onChange={(e) => onFilterChange({...filters, client: e.target.value})}
              >
                <option value="">{t('projects.allClients')}</option>
                {clientOptions.map((client, idx) => (
                  <option key={idx} value={client}>{client}</option>
                ))}
              </select>
            ) : (
              <Input 
                placeholder={t('projects.searchClient')} 
                value={filters.client || ''}
                onChange={(e) => onFilterChange({...filters, client: e.target.value})}
                className="rounded-lg h-11"
              />
            )}
        </div>

        {/* Date Range Section */}
        <div className="space-y-3">
           <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-2">
             <Calendar className="w-4 h-4 text-slate-400" />
             {t('projects.filterPanel.date')}
           </Label>
           <div className="flex gap-4 items-center">
             <div className="flex-1 space-y-1">
               <span className="text-[10px] text-slate-400 uppercase font-semibold">{t('projects.filterPanel.dateStart')}</span>
               <Input 
                 type="date" 
                 className="rounded-lg h-10 text-xs w-full"
                 value={filters.dateRange?.start || ''}
                 onChange={(e) => onFilterChange({
                   ...filters, 
                   dateRange: { ...filters.dateRange, start: e.target.value }
                 })}
               />
             </div>
             <div className="flex-1 space-y-1">
               <span className="text-[10px] text-slate-400 uppercase font-semibold">{t('projects.filterPanel.dateEnd')}</span>
               <Input 
                 type="date" 
                 className="rounded-lg h-10 text-xs w-full"
                 value={filters.dateRange?.end || ''}
                 onChange={(e) => onFilterChange({
                   ...filters, 
                   dateRange: { ...filters.dateRange, end: e.target.value }
                 })}
               />
             </div>
           </div>
        </div>

      </div>

      {/* Footer Actions */}
      <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex gap-4">
        <Button 
          variant="outline" 
          onClick={onClear}
          className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          {t('projects.filterPanel.clear')}
        </Button>
        <Button 
          variant="primary" 
          onClick={onApply}
          className="flex-1 bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg text-white"
        >
          {t('projects.filterPanel.apply')}
        </Button>
      </div>
    </div>
  );
};

export default FilterPanel;
