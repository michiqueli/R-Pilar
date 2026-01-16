
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Loader2, RefreshCw, Save, AlertCircle, CheckCircle } from 'lucide-react';

const TipoCambioSection = ({ config, onSave, loading }) => {
  const [rate, setRate] = useState('');
  const [sourceType, setSourceType] = useState('manual');
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (config) {
      setRate(config.tipo_cambio_usd_ars?.toString() || '');
      setSourceType(config.fuente_tipo_cambio || 'manual');
    }
  }, [config]);

  const handleUpdateNow = async () => {
    // We pass this up to the parent or fetch here? 
    // The prompt says "Actualizar ahora button that calls getUSDARSRate()"
    // Ideally this component is pure, but let's pass a special handler or just let onSave handle saving.
    // Let's assume onSave handles the logic of what to do with the data, but for "Update Now" we need to fetch.
    // But wait, fetching is async logic. Better to have it passed in or imported.
    // Re-reading task 4: "Actualizar ahora" button that calls getUSDARSRate().
    // We'll import the service here for the button action to be self-contained for the "fetch" part, then update state.
    
    setFetching(true);
    // Dynamic import to avoid circular deps if any, or just standard import
    const { tiposCambioService } = await import('@/services/tiposCambioService');
    const result = await tiposCambioService.getUSDARSRate();
    
    if (result.rate) {
      setRate(result.rate.toString());
    }
    setFetching(false);
  };

  const handleSave = () => {
    onSave({
      rate: parseFloat(rate),
      sourceType,
      // If fetching happened recently, we might want to pass provider, but 
      // typically manual vs auto logic is handled by the parent saving routine or service
      provider: sourceType === 'auto' ? 'exchangerate-api.com' : 'Manual'
    });
  };

  return (
    <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-2xl">💱</span> Configuración de Tipo de Cambio
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Define el valor del dólar (USD) para las conversiones en la plataforma.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Fuente de Datos
            </label>
            <Select value={sourceType} onValueChange={setSourceType} disabled={loading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar fuente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual (Fijo)</SelectItem>
                <SelectItem value="auto">Automática (API)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-400">
              {sourceType === 'auto' 
                ? "Se actualizará automáticamente desde la API externa." 
                : "Tú defines el valor manualmente."}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Valor 1 USD = ARS
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <Input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  disabled={sourceType === 'auto' || loading}
                  className="pl-7 font-mono font-bold text-lg"
                  placeholder="0.00"
                />
              </div>
              {sourceType === 'auto' && (
                <Button 
                  variant="outline" 
                  onClick={handleUpdateNow}
                  disabled={loading || fetching}
                  title="Actualizar valor ahora"
                  className="px-3"
                >
                  {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Status Info for Auto Mode */}
        {sourceType === 'auto' && config?.ultima_actualizacion && (
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 text-xs space-y-1 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-500">Última actualización:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {new Date(config.ultima_actualizacion).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Proveedor:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {config.proveedor || 'Desconocido'}
              </span>
            </div>
            {config.error_ultimo && (
              <div className="flex items-center gap-1 text-red-500 mt-2 font-medium">
                <AlertCircle className="w-3 h-3" />
                Error: {config.error_ultimo}
              </div>
            )}
            {!config.error_ultimo && (
               <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                 <CheckCircle className="w-3 h-3" />
                 Sincronizado correctamente
               </div>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={loading || fetching || !rate}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
          >
            {(loading || fetching) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Configuración
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default TipoCambioSection;
