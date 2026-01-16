
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Save, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { ExchangeRateService } from '@/services/ExchangeRateService';
import { ThemedCard } from '@/components/ui/themed-components';

export default function SettingsExchangeRate() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({ mode: 'MANUAL', manual_rate: 0 });
  const [currentAutoRate, setCurrentAutoRate] = useState(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const storedConfig = await ExchangeRateService.getConfig();
      setConfig(storedConfig);
      
      // Just for display purposes, try to fetch current live rate
      try {
        const response = await fetch('https://dolarapi.com/v1/dolares/blue');
        if (response.ok) {
          const data = await response.json();
          setCurrentAutoRate(data.venta);
        }
      } catch (e) {
        console.error("Could not fetch live preview", e);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await ExchangeRateService.saveConfig(config);
      toast({ title: 'Configuración guardada', description: 'La configuración de cotización ha sido actualizada.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save settings' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold" style={{ color: 'var(--theme-foreground)' }}>Cotización USD/ARS</h2>
      <p className="text-sm text-slate-500 mb-4">Define cómo se calcula la equivalencia de moneda para los reportes de gastos.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mode Selection */}
        <div className="space-y-4">
          <Label>Fuente de Cotización</Label>
          <div className="flex items-center space-x-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
             <div className="flex-1">
               <span className={`block font-medium ${config.mode === 'AUTO' ? 'text-blue-600' : 'text-slate-600'}`}>
                 Automática (API)
               </span>
               <span className="text-xs text-slate-500">Usa DolarApi.com (Blue)</span>
             </div>
             <Switch 
               checked={config.mode === 'AUTO'}
               onCheckedChange={(checked) => setConfig({ ...config, mode: checked ? 'AUTO' : 'MANUAL' })}
             />
             <div className="flex-1 text-right">
               <span className={`block font-medium ${config.mode === 'MANUAL' ? 'text-blue-600' : 'text-slate-600'}`}>
                 Manual (Fija)
               </span>
               <span className="text-xs text-slate-500">Valor definido por usuario</span>
             </div>
          </div>
        </div>

        {/* Rate Input */}
        <div className="space-y-4">
          <Label>Valor del Dólar (ARS)</Label>
          <div className="relative">
             <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <Input 
               type="number"
               disabled={config.mode === 'AUTO'}
               value={config.mode === 'AUTO' && currentAutoRate ? currentAutoRate : config.manual_rate}
               onChange={(e) => setConfig({ ...config, manual_rate: parseFloat(e.target.value) })}
               className="pl-10"
             />
             {config.mode === 'AUTO' && (
               <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 font-medium flex items-center gap-1">
                 <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} /> Live
               </div>
             )}
          </div>
          {config.mode === 'AUTO' && (
             <p className="text-xs text-slate-500">
               * Si la API falla, se usará el último valor manual guardado ({config.manual_rate}).
             </p>
          )}
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button onClick={handleSave} disabled={loading} className="gap-2">
          <Save className="w-4 h-4" />
          {loading ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </div>
    </div>
  );
}
