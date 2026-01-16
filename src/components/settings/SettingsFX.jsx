
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/ThemeProvider';
import { RefreshCw, Save } from 'lucide-react';
import { fxService } from '@/services/fxService';

const SettingsFX = () => {
  const { t } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentRate, setCurrentRate] = useState(null);
  const [manualRate, setManualRate] = useState('1000');

  useEffect(() => {
    fetchSettings();
    checkLiveRate();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'fx_settings')
      .single();
    
    if (data?.value) {
      setManualRate(data.value.manual_rate || '1000');
    }
  };

  const checkLiveRate = async () => {
    try {
      const data = await fxService.getExchangeRate('USD', 'ARS');
      setCurrentRate(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        manual_rate: manualRate,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'fx_settings', value: payload });

      if (error) throw error;
      toast({ title: t('common.success'), description: "Configuración FX guardada" });
    } catch (error) {
      toast({ variant: "destructive", title: t('common.error'), description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">Configuración FX (Moneda Extranjera)</h3>
        <p className="text-sm text-slate-500">Administra las tasas de cambio y fuentes de datos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Live Status */}
        <div className="bg-blue-50/50 dark:bg-slate-900/50 border border-blue-100 dark:border-slate-800 rounded-xl p-6">
           <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-4 flex items-center gap-2">
             <RefreshCw className="w-4 h-4" /> Cotización Actual (Dolar Blue)
           </h4>
           
           {currentRate ? (
             <div className="space-y-2">
               <div className="text-3xl font-bold text-slate-900 dark:text-white">
                 ${currentRate.rate}
               </div>
               <div className="text-xs text-slate-500">
                 Fuente: <span className="font-medium text-slate-700 dark:text-slate-300">{currentRate.source}</span>
                 <span className="mx-2">•</span>
                 Fecha: {currentRate.date}
               </div>
             </div>
           ) : (
             <div className="text-sm text-slate-500">Cargando cotización...</div>
           )}
           
           <Button variant="outline" size="sm" className="mt-4 w-full" onClick={checkLiveRate}>
             Forzar Actualización
           </Button>
        </div>

        {/* Manual Fallback */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
           <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
             Fallback Manual
           </h4>
           <p className="text-xs text-slate-500 mb-4">
             Valor a utilizar si la API externa falla o no responde.
           </p>

           <div className="space-y-2">
             <Label>Tasa Manual (ARS/USD)</Label>
             <Input 
               type="number" 
               value={manualRate} 
               onChange={(e) => setManualRate(e.target.value)} 
             />
           </div>

           <Button onClick={handleSave} disabled={loading} className="w-full">
             <Save className="w-4 h-4 mr-2" /> Guardar Configuración
           </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsFX;
