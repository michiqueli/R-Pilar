
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
import { cn } from '@/lib/utils';

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
      <PopoverContent className="w-80 p-4" align="start">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-sm">Filtros</h4>
          <Button variant="ghost" size="iconSm" onClick={onClose} className="h-6 w-6">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Tipo */}
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo</Label>
            <Select value={filters.tipo} onValueChange={(val) => handleChange('tipo', val)}>
              <SelectTrigger className="h-8 text-xs">
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
            <Label className="text-xs">Estado</Label>
            <Select value={filters.estado} onValueChange={(val) => handleChange('estado', val)}>
              <SelectTrigger className="h-8 text-xs">
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
              <Label className="text-xs">Desde</Label>
              <DatePickerInput
                date={filters.dateStart}
                onSelect={(date) => handleChange('dateStart', date)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hasta</Label>
              <DatePickerInput
                date={filters.dateEnd}
                onSelect={(date) => handleChange('dateEnd', date)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Cuenta */}
          <div className="space-y-1.5">
            <Label className="text-xs">Cuenta</Label>
            <Select value={filters.cuenta} onValueChange={(val) => handleChange('cuenta', val)}>
              <SelectTrigger className="h-8 text-xs">
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
            <Label className="text-xs">Proveedor</Label>
            <Select value={filters.proveedor} onValueChange={(val) => handleChange('proveedor', val)}>
              <SelectTrigger className="h-8 text-xs">
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

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={handleClear} className="flex-1 text-xs">
              Limpiar
            </Button>
            <Button variant="primary" size="sm" onClick={handleApply} className="flex-1 text-xs">
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MovementFiltersPopover;
