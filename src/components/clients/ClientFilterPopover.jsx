
import React from 'react';
import { Filter, Calendar as CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const ClientFilterPopover = ({ filters, onFiltersChange }) => {
  const hasActiveFilters = 
    filters.status.length > 0 || 
    filters.hasProjects !== null || 
    filters.dateRange.start || 
    filters.dateRange.end;

  const handleStatusChange = (status) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    onFiltersChange({ ...filters, status: newStatus });
  };

  const handleHasProjectsChange = (value) => {
    onFiltersChange({ ...filters, hasProjects: filters.hasProjects === value ? null : value });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: [],
      hasProjects: null,
      dateRange: { start: '', end: '' }
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant={hasActiveFilters ? "primary" : "secondary"} 
          className="rounded-full gap-2 px-4 shadow-sm"
        >
          <Filter className="w-4 h-4" />
          Filtros
          {hasActiveFilters && (
            <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs font-bold ml-1">
              !
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-5 rounded-2xl shadow-xl border-slate-100" align="end">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-slate-900">Filtrar Clientes</h4>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              Limpiar
            </Button>
          )}
        </div>

        <div className="space-y-5">
          {/* Status */}
          <div className="space-y-3">
            <Label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Estado</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="status-active" 
                  checked={filters.status.includes('active')}
                  onCheckedChange={() => handleStatusChange('active')}
                />
                <label htmlFor="status-active" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Activo
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="status-inactive" 
                  checked={filters.status.includes('inactive')}
                  onCheckedChange={() => handleStatusChange('inactive')}
                />
                <label htmlFor="status-inactive" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Inactivo
                </label>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100"></div>

          {/* Has Projects */}
          <div className="space-y-3">
            <Label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Con Proyectos</Label>
            <div className="flex gap-2">
              <button
                onClick={() => handleHasProjectsChange(true)}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  filters.hasProjects === true
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Sí, con proyectos
              </button>
              <button
                onClick={() => handleHasProjectsChange(false)}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  filters.hasProjects === false
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                No, sin proyectos
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-100"></div>

          {/* Date Range */}
          <div className="space-y-3">
            <Label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Fecha de Creación</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] mb-1">Desde</Label>
                <input
                  type="date"
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.dateRange.start}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    dateRange: { ...filters.dateRange, start: e.target.value } 
                  })}
                />
              </div>
              <div>
                <Label className="text-[10px] mb-1">Hasta</Label>
                <input
                  type="date"
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.dateRange.end}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    dateRange: { ...filters.dateRange, end: e.target.value } 
                  })}
                />
              </div>
            </div>
          </div>

        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ClientFilterPopover;
