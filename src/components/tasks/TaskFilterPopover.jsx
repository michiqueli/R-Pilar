
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Briefcase, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/Input';
import FilterButton from '@/components/common/FilterButton';

const STATUS_OPTIONS = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'EN_PROGRESO', label: 'En Progreso' },
  { value: 'HECHO', label: 'Hecho' },
];

function TaskFilterPopover({ filters, onFiltersChange, projects = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const popoverRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverRef]);

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
      project_id: '',
      dateRange: { start: '', end: '' }
    };
    onFiltersChange(emptyFilters);
    setIsOpen(false);
  };

  const activeFiltersCount = 
    (filters.status?.length || 0) + 
    (filters.project_id ? 1 : 0) + 
    (filters.dateRange?.start || filters.dateRange?.end ? 1 : 0);

  return (
    <div className="relative" ref={popoverRef}>
      <FilterButton 
        onClick={() => setIsOpen(!isOpen)} 
        isActive={isOpen}
        activeCount={activeFiltersCount}
        label="Filtros"
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-[16px] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-white">Filtros de Tareas</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-6 max-h-[60vh] overflow-y-auto">
              
              {/* Section: Estado */}
              <div>
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Estado
                </Label>
                <div className="flex flex-col gap-2">
                  {STATUS_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2.5">
                      <Checkbox 
                        id={`status-${option.value}`}
                        checked={localFilters.status?.includes(option.value)}
                        onCheckedChange={() => handleStatusChange(option.value)}
                      />
                      <label 
                        htmlFor={`status-${option.value}`}
                        className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: Proyecto */}
              <div>
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5" /> Proyecto
                </Label>
                <select
                  className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  value={localFilters.project_id || ''}
                  onChange={(e) => setLocalFilters({...localFilters, project_id: e.target.value})}
                >
                  <option value="">Todos los proyectos</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                  ))}
                </select>
              </div>

              {/* Section: Fecha Vencimiento */}
              <div>
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" /> Vencimiento
                </Label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input 
                      type="date" 
                      className="rounded-xl h-10 text-xs"
                      value={localFilters.dateRange?.start || ''}
                      onChange={(e) => setLocalFilters({
                        ...localFilters, 
                        dateRange: { ...localFilters.dateRange, start: e.target.value }
                      })}
                    />
                  </div>
                  <div className="flex items-center text-slate-400">-</div>
                  <div className="flex-1">
                    <Input 
                      type="date" 
                      className="rounded-xl h-10 text-xs"
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

            <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <Button 
                variant="secondary" 
                onClick={handleClear}
                className="flex-1 rounded-full h-10"
              >
                Limpiar
              </Button>
              <Button 
                variant="primary" 
                onClick={handleApply}
                className="flex-1 rounded-full h-10 shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
              >
                Aplicar filtros
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TaskFilterPopover;
