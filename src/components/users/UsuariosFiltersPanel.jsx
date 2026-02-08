import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import FilterButton from '@/components/common/FilterButton';
import { cn } from '@/lib/utils';

const UsuariosFiltersPanel = ({ filters, onFiltersChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const activeCount = [filters.rol !== 'all', filters.estado !== 'all'].filter(Boolean).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <FilterButton activeCount={activeCount} label="Filtros" isActive={isOpen} />
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden" align="end">
        <div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
          <h4 className="font-semibold">Filtros de Acceso</h4>
          <button onClick={() => setIsOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        
        <div className="p-5 space-y-6">
          <div className="space-y-3">
            <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Rol en Plataforma</Label>
            <div className="flex flex-col gap-1.5">
              {['all', 'ADMINISTRADOR', 'TECNICO'].map(r => (
                <button 
                  key={r} 
                  onClick={() => handleFilterChange('rol', r)} 
                  className={cn(
                    "text-left text-sm p-2.5 rounded-xl transition-all", 
                    filters.rol === r ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-bold border border-blue-100" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {r === 'all' ? 'Todos los Roles' : r}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Estado de Cuenta</Label>
            <div className="flex flex-col gap-1.5">
              {['all', 'aceptado', 'pendiente', 'rechazado'].map(e => (
                <button 
                  key={e} 
                  onClick={() => handleFilterChange('estado', e)} 
                  className={cn(
                    "text-left text-sm p-2.5 rounded-xl transition-all", 
                    filters.estado === e ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-bold border border-blue-100" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {e === 'all' ? 'Todos los Estados' : e.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => onFiltersChange({ rol: 'all', estado: 'all' })} 
            className="flex-1 rounded-full text-red-600 border-red-200"
          >
            Limpiar
          </Button>
          <Button onClick={() => setIsOpen(false)} className="flex-1 rounded-full bg-blue-600 text-white font-bold">
            Aplicar Filtros
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UsuariosFiltersPanel;