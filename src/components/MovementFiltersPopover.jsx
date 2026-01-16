
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import DatePickerInput from '@/components/ui/DatePickerInput';

const MovementFiltersPopover = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  uniqueProviders = [],
  uniqueAccounts = [],
  trigger
}) => {
  const handleChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleClear = () => {
    onFiltersChange({
      tipo: 'all',
      estado: 'all',
      dateStart: null,
      dateEnd: null,
      cuenta: 'all',
      proveedor: 'all'
    });
    onClose();
  };

  const handleApply = () => {
    onClose();
  };

  return (
    <Popover open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent
        className="w-[320px] md:w-[360px] p-0 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
        align="end"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <h4 className="font-semibold text-slate-900 dark:text-white">Filtros</h4>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Tipo */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</Label>
            <Select value={filters.tipo} onValueChange={(val) => handleChange('tipo', val)}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="INGRESO">Ingreso</SelectItem>
                <SelectItem value="GASTO">Gasto</SelectItem>
                <SelectItem value="INVERSION">Inversión</SelectItem>
                <SelectItem value="DEVOLUCION">Devolución</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Estado */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</Label>
            <Select value={filters.estado} onValueChange={(val) => handleChange('estado', val)}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Desde</Label>
              <DatePickerInput
                date={filters.dateStart}
                onSelect={(date) => handleChange('dateStart', date)}
                className="h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hasta</Label>
              <DatePickerInput
                date={filters.dateEnd}
                onSelect={(date) => handleChange('dateEnd', date)}
                className="h-10 text-sm"
              />
            </div>
          </div>

          {/* Cuenta */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cuenta</Label>
            <Select value={filters.cuenta} onValueChange={(val) => handleChange('cuenta', val)}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {uniqueAccounts.map(acc => (
                  <SelectItem key={acc} value={acc}>{acc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Proveedor */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Proveedor</Label>
            <Select value={filters.proveedor} onValueChange={(val) => handleChange('proveedor', val)}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {uniqueProviders.map(prov => (
                  <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          <Button
            variant="outline"
            onClick={handleClear}
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
      </PopoverContent>
    </Popover>
  );
};

export default MovementFiltersPopover;
