import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import DatePickerInput from '@/components/ui/DatePickerInput';
import { Repeat, Calendar, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

/**
 * Componente para configurar pagos recurrentes en el formulario de movimientos.
 * 
 * Props:
 *  - esRecurrente: boolean
 *  - frecuencia: 'semanal' | 'quincenal' | 'mensual' | 'trimestral'
 *  - fechaLimite: string (YYYY-MM-DD) | null
 *  - onChange: ({ esRecurrente, frecuencia, fechaLimite }) => void
 *  - disabled: boolean
 */
const RecurrenciaConfig = ({
  esRecurrente = false,
  frecuencia = 'mensual',
  fechaLimite = null,
  onChange,
  disabled = false
}) => {
  const [showFechaLimite, setShowFechaLimite] = useState(!!fechaLimite);

  const handleToggle = (checked) => {
    onChange({
      esRecurrente: checked,
      frecuencia: checked ? (frecuencia || 'mensual') : null,
      fechaLimite: checked ? fechaLimite : null
    });
  };

  const handleFrecuenciaChange = (value) => {
    onChange({ esRecurrente, frecuencia: value, fechaLimite });
  };

  const handleFechaLimiteChange = (date) => {
    const formattedDate = date ? format(date, 'yyyy-MM-dd') : null;
    onChange({ esRecurrente, frecuencia, fechaLimite: formattedDate });
  };

  const frequencyLabels = {
    semanal: 'Cada semana',
    quincenal: 'Cada 15 días',
    mensual: 'Cada mes',
    trimestral: 'Cada 3 meses'
  };

  return (
    <div className={cn(
      'rounded-xl border p-4 space-y-4 transition-colors',
      esRecurrente
        ? 'bg-purple-50/50 dark:bg-purple-950/10 border-purple-200 dark:border-purple-800'
        : 'bg-slate-50/50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800'
    )}>
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-1.5 rounded-full transition-colors',
            esRecurrente ? 'bg-purple-100 dark:bg-purple-900' : 'bg-slate-100 dark:bg-slate-800'
          )}>
            <Repeat className={cn(
              'w-4 h-4',
              esRecurrente ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'
            )} />
          </div>
          <div>
            <Label className="font-bold text-sm cursor-pointer">Pago Recurrente</Label>
            <p className="text-[10px] text-slate-400">El sistema generará recordatorios periódicos</p>
          </div>
        </div>
        <Switch
          checked={esRecurrente}
          onCheckedChange={handleToggle}
          disabled={disabled}
        />
      </div>

      {/* Config (collapsed when off) */}
      {esRecurrente && (
        <div className="space-y-4 pt-2 border-t border-purple-200/50 dark:border-purple-800/50">
          {/* Frecuencia */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-purple-700 dark:text-purple-400">Frecuencia</Label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(frequencyLabels).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleFrecuenciaChange(key)}
                  disabled={disabled}
                  className={cn(
                    'py-2 px-2 rounded-lg text-xs font-bold transition-all border text-center',
                    frecuencia === key
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Fecha Límite (opcional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Fecha Límite
              </Label>
              <button
                type="button"
                onClick={() => {
                  setShowFechaLimite(!showFechaLimite);
                  if (showFechaLimite) {
                    onChange({ esRecurrente, frecuencia, fechaLimite: null });
                  }
                }}
                className="text-[10px] font-bold text-purple-600 hover:text-purple-800 transition-colors"
              >
                {showFechaLimite ? 'Quitar límite' : 'Agregar límite'}
              </button>
            </div>

            {showFechaLimite && (
              <DatePickerInput
                date={fechaLimite ? new Date(fechaLimite + 'T12:00:00') : null}
                onSelect={handleFechaLimiteChange}
                placeholder="Sin fecha límite (indefinido)"
              />
            )}

            {!showFechaLimite && (
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <Info className="w-3 h-3" />
                Sin fecha límite — se repetirá indefinidamente hasta que se desactive
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurrenciaConfig;
