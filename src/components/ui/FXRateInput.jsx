
import React, { useState, useEffect } from 'react';
import { RefreshCw, Lock, AlertCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/contexts/ThemeProvider';
import { fxService } from '@/services/fxService';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/dateUtils';

const FXRateInput = ({ 
  currency, 
  value, 
  date, 
  onRateChange, 
  amountOriginal, 
  amountArs 
}) => {
  const { t } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState('Manual');
  const [lastFetched, setLastFetched] = useState(null);

  useEffect(() => {
    // Auto-fetch if USD and no value, or if it's a new entry
    if (currency === 'USD' && !value) {
      handleFetchRate();
    }
  }, [currency]);

  const handleFetchRate = async () => {
    setLoading(true);
    try {
      const data = await fxService.getExchangeRate('USD', 'ARS');
      onRateChange(data.rate, data.date);
      setSource(data.source);
      setLastFetched(new Date());
      toast({ title: "FX Actualizado", description: `Cotización: ${data.rate} (${data.source})` });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo obtener la cotización." });
    } finally {
      setLoading(false);
    }
  };

  if (currency === 'ARS') return null;

  return (
    <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Label className="text-blue-700 dark:text-blue-300 mb-0 font-semibold">
             Tipo de Cambio (USD → ARS)
           </Label>
           <div className="flex items-center text-xs text-blue-600/70 bg-blue-100/50 px-2 py-0.5 rounded-full">
              {source}
           </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
           {date && <span>del {formatDate(date)}</span>}
           {date && <Lock className="w-3 h-3" />}
        </div>
      </div>

      <div className="flex gap-3 items-start">
        <div className="flex-1 relative">
           <Input
             type="number"
             value={value}
             onChange={(e) => onRateChange(e.target.value, date || new Date().toISOString().split('T')[0])}
             className="bg-white dark:bg-slate-900 font-mono font-medium"
             placeholder="0.00"
             step="0.01"
           />
           {value && amountOriginal && (
             <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none hidden sm:block">
               ARS {new Intl.NumberFormat('es-AR', { style: 'decimal', minimumFractionDigits: 2 }).format(amountOriginal * value)}
             </div>
           )}
        </div>
        
        <Button 
          type="button" 
          variant="outline" 
          size="icon"
          onClick={handleFetchRate}
          disabled={loading}
          className="shrink-0 bg-white dark:bg-slate-900 text-blue-600 hover:text-blue-700 border-blue-200"
          title="Consultar FX del día"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </Button>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500">
         <AlertCircle className="w-3 h-3 text-slate-400" />
         <span>
           Este valor se congelará al guardar. Los reportes históricos usarán este FX específico.
         </span>
      </div>
    </div>
  );
};

export default FXRateInput;
