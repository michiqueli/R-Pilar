
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import FilterButton from '@/components/common/FilterButton';
import { supabase } from '@/lib/customSupabaseClient';

function ProviderFilterPopover({ filters, onFiltersChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const [types, setTypes] = useState([]);
  const popoverRef = useRef(null);

  useEffect(() => {
    const fetchTypes = async () => {
      const { data } = await supabase.from('catalog_provider_type').select('*');
      setTypes(data || []);
    };
    if (isOpen) fetchTypes();
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

  const handleTypeChange = (typeId) => {
    const current = localFilters.type_id || [];
    const updated = current.includes(typeId)
      ? current.filter(id => id !== typeId)
      : [...current, typeId];
    setLocalFilters({ ...localFilters, type_id: updated });
  };

  const handleStatusChange = (status) => {
    const newStatus = localFilters.is_active === status ? null : status;
    setLocalFilters({ ...localFilters, is_active: newStatus });
  };

  const clearFilters = () => {
    const cleared = { type_id: [], is_active: null };
    setLocalFilters(cleared);
    onFiltersChange(cleared);
    setIsOpen(false);
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const activeFiltersCount = (filters.type_id?.length || 0) + (filters.is_active !== null ? 1 : 0);

  return (
    <div className="relative z-20" ref={popoverRef}>
      <FilterButton
        onClick={() => setIsOpen(!isOpen)}
        activeCount={activeFiltersCount}
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
                  Tipo
                </Label>
                <div className="space-y-2">
                  {types.map(type => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type.id}`}
                        checked={localFilters.type_id?.includes(type.id)}
                        onCheckedChange={() => handleTypeChange(type.id)}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <Label htmlFor={`type-${type.id}`} className="text-sm font-normal cursor-pointer">
                        {type.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">
                  Estado
                </Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="status-active"
                      checked={localFilters.is_active === true}
                      onCheckedChange={() => handleStatusChange(true)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <Label htmlFor="status-active" className="text-sm font-normal cursor-pointer">Activos</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="status-inactive"
                      checked={localFilters.is_active === false}
                      onCheckedChange={() => handleStatusChange(false)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <Label htmlFor="status-inactive" className="text-sm font-normal cursor-pointer">Inactivos</Label>
                  </div>
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

export default ProviderFilterPopover;
