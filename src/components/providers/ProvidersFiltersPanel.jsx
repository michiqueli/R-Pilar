import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import FilterButton from '@/components/common/FilterButton';
import { supabase } from '@/lib/customSupabaseClient';

const ProvidersFiltersPanel = ({ filters, onFiltersChange }) => {
  const { t } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const [types, setTypes] = useState([]);

  // Cargar tipos de proveedores para el filtro
  useEffect(() => {
    const fetchTypes = async () => {
      const { data } = await supabase.from('catalog_provider_type').select('*').order('name');
      setTypes(data || []);
    };
    if (isOpen) fetchTypes();
  }, [isOpen]);

  // Sincronizar con props cuando se abre
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  const activeCount = [
  filters.status !== 'all',
  filters.type_id !== 'all' && filters.type_id !== undefined && filters.type_id?.length !== 0
].filter(Boolean).length;

  const handleFilterChange = (key, value) => {
    setLocalFilters({ ...localFilters, [key]: value });
  };

  const clearFilters = () => {
    const cleared = {
      status: 'all',
      type_id: 'all'
    };
    setLocalFilters(cleared);
    onFiltersChange(cleared);
    setIsOpen(false);
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  // Reutilizamos el mismo RadioGroup visual de Clientes
  const RadioGroup = ({ options, value, onChange, name }) => (
    <div className="flex flex-col gap-2">
      {options.map((option) => (
        <label key={option.value} className="flex items-center gap-2 cursor-pointer group">
          <div className={cn(
            "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
            value === option.value 
              ? "border-blue-600 bg-blue-600" 
              : "border-slate-300 dark:border-slate-600 group-hover:border-blue-400"
          )}>
            {value === option.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
          </div>
          <input 
            type="radio" 
            name={name} 
            value={option.value} 
            checked={value === option.value} 
            onChange={() => onChange(option.value)}
            className="hidden" 
          />
          <span className={cn(
            "text-sm",
            value === option.value 
              ? "text-slate-900 dark:text-white font-medium" 
              : "text-slate-600 dark:text-slate-400"
          )}>
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <FilterButton 
           activeCount={activeCount}
           label={t('common.filters') || 'Filtros'}
           isActive={isOpen}
        />
      </PopoverTrigger>
      <PopoverContent className="w-[320px] md:w-[360px] p-0 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden" align="end">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <h4 className="font-semibold text-slate-900 dark:text-white">{t('common.filters') || 'Filtros'}</h4>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[400px] overflow-y-auto">
          {/* Status */}
          <div className="space-y-3">
            <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              {t('providers.filterStatus') || 'Estado'}
            </Label>
            <RadioGroup 
              name="status"
              value={localFilters.status}
              onChange={(val) => handleFilterChange('status', val)}
              options={[
                { label: t('common.all') || 'Todos', value: 'all' },
                { label: t('common.active') || 'Activos', value: 'active' },
                { label: t('common.inactive') || 'Inactivos', value: 'inactive' }
              ]}
            />
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

          {/* Types (Dinámicos de la BDD) */}
          <div className="space-y-3">
            <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              {t('providers.filterType') || 'Tipo de Proveedor'}
            </Label>
            <RadioGroup 
              name="type_id"
              value={localFilters.type_id}
              onChange={(val) => handleFilterChange('type_id', val)}
              options={[
                { label: t('common.all') || 'Todos los tipos', value: 'all' },
                ...types.map(t => ({ label: t.name, value: t.id }))
              ]}
            />
          </div>
        </div>
        
        {/* Footer Actions - Mismo estilo que Clientes */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
           <Button 
             variant="outline" 
             onClick={clearFilters}
             className="flex-1 rounded-full px-4 py-2 border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 transition-colors duration-150"
           >
             {t('common.clearFilters') || 'Limpiar'}
           </Button>
           <Button 
             variant="primary" 
             onClick={handleApply}
             className="flex-1 rounded-full px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-150"
           >
             {t('common.applyFilters') || 'Aplicar'}
           </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ProvidersFiltersPanel;