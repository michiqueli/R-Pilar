
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import FilterButton from '@/components/common/FilterButton';
import { supabase } from '@/lib/customSupabaseClient';

function IncomeFilterPopover({ filters, onFiltersChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const [catalogs, setCatalogs] = useState({
    projects: []
  });
  const popoverRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('projects').select('id, name');
      setCatalogs({
        projects: data || []
      });
    };
    if (isOpen) fetchData();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFilterChange = (category, value) => {
    const current = localFilters[category] || [];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    setLocalFilters({ ...localFilters, [category]: updated });
  };

  const clearFilters = () => {
    const cleared = {
      project_id: [],
      currency: [],
      month: ''
    };
    setLocalFilters(cleared);
    onFiltersChange(cleared);
    setIsOpen(false);
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const activeCount = 
    filters.project_id.length + 
    filters.currency.length +
    (filters.month ? 1 : 0);

  return (
    <div className="relative z-20" ref={popoverRef}>
      <FilterButton
        onClick={() => setIsOpen(!isOpen)}
        activeCount={activeCount}
        label="Filtros"
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
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <h3 className="font-semibold text-slate-900 dark:text-white">Filtros</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-6 max-h-[60vh] overflow-y-auto">
              <div>
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">
                  Mes
                </Label>
                <input
                  type="month"
                  value={localFilters.month}
                  onChange={(e) => setLocalFilters({ ...localFilters, month: e.target.value })}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-950"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">
                  Moneda
                </Label>
                {['ARS', 'USD'].map(c => (
                  <div key={c} className="flex items-center space-x-2 mb-1">
                    <Checkbox
                      checked={localFilters.currency.includes(c)}
                      onCheckedChange={() => handleFilterChange('currency', c)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <Label className="text-sm font-normal">{c}</Label>
                  </div>
                ))}
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">
                  Proyecto
                </Label>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {catalogs.projects.map(p => (
                    <div key={p.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={localFilters.project_id.includes(p.id)}
                        onCheckedChange={() => handleFilterChange('project_id', p.id)}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <Label className="text-sm font-normal truncate">{p.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex-1 rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Limpiar
              </Button>
              <Button
                variant="primary"
                onClick={handleApply}
                className="flex-1 rounded-full bg-blue-600 hover:bg-blue-700"
              >
                Aplicar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default IncomeFilterPopover;
