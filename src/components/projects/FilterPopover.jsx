
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, User, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/contexts/ThemeProvider';
import FilterButton from '@/components/common/FilterButton';

function FilterPopover({ filters, onFiltersChange, responsibles = [], clientOptions = [] }) {
  const { t } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const popoverRef = useRef(null);

  const STATUS_OPTIONS = [
    { value: 'active', label: 'status.active' },
    { value: 'on_hold', label: 'status.on_hold' },
    { value: 'completed', label: 'status.completed' },
    { value: 'archived', label: 'status.archived' },
  ];

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverRef]);

  // Sync local state when opening or parent filters change
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  const handleStatusChange = (status) => {
    const current = localFilters.status || [];
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    setLocalFilters({ ...localFilters, status: updated });
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleClear = () => {
    const emptyFilters = {
      status: [],
      client: '',
      responsible: '',
      dateRange: { start: '', end: '' }
    };
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
    setIsOpen(false);
  };

  const activeFiltersCount = 
    (filters.status?.length || 0) + 
    (filters.client ? 1 : 0) + 
    (filters.responsible ? 1 : 0) +
    (filters.dateRange?.start || filters.dateRange?.end ? 1 : 0);

  return (
    <div className="relative z-20" ref={popoverRef}>
      <FilterButton 
        onClick={() => setIsOpen(!isOpen)}
        activeCount={activeFiltersCount}
        label={t('common.filters')}
        isActive={isOpen}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-[320px] md:w-[360px] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <h3 className="font-semibold text-slate-900 dark:text-white">{t('projects.filterPanel.title')}</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-6 max-h-[60vh] overflow-y-auto">
              
              {/* Status */}
              <div>
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {t('projects.filterPanel.status')}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2.5">
                      <Checkbox 
                        id={`status-${option.value}`}
                        checked={localFilters.status?.includes(option.value)}
                        onCheckedChange={() => handleStatusChange(option.value)}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <label 
                        htmlFor={`status-${option.value}`}
                        className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none"
                      >
                        {t(option.label)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Responsible */}
              <div>
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> {t('projects.filterPanel.responsable')}
                </Label>
                <select
                    className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    value={localFilters.responsible || ''}
                    onChange={(e) => setLocalFilters({...localFilters, responsible: e.target.value})}
                  >
                    <option value="">{t('common.all') || 'Todos'}</option>
                    {responsibles.map((person, idx) => (
                      <option key={idx} value={person}>{person}</option>
                    ))}
                  </select>
              </div>

              {/* Date Range */}
              <div>
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" /> {t('projects.filterPanel.date')}
                </Label>
                <div className="flex gap-3">
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">{t('projects.filterPanel.dateStart')}</span>
                    <Input 
                      type="date" 
                      className="rounded-lg h-9 text-xs"
                      value={localFilters.dateRange?.start || ''}
                      onChange={(e) => setLocalFilters({
                        ...localFilters, 
                        dateRange: { ...localFilters.dateRange, start: e.target.value }
                      })}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">{t('projects.filterPanel.dateEnd')}</span>
                    <Input 
                      type="date" 
                      className="rounded-lg h-9 text-xs"
                      value={localFilters.dateRange?.end || ''}
                      onChange={(e) => setLocalFilters({
                        ...localFilters, 
                        dateRange: { ...localFilters.dateRange, end: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleClear}
                className="flex-1 rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                {t('projects.filterPanel.clear')}
              </Button>
              <Button 
                variant="primary" 
                onClick={handleApply}
                className="flex-1 rounded-full bg-blue-600 hover:bg-blue-700"
              >
                {t('projects.filterPanel.apply')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FilterPopover;
