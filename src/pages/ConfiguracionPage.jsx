
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { themeService } from '@/services/themeService';
import { tiposCambioService } from '@/services/tiposCambioService';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/layout/PageHeader';
import TipoCambioSection from '@/components/configuracion/TipoCambioSection';
import { Card } from '@/components/ui/Card';
import { Moon, Sun, Monitor } from 'lucide-react';

const ConfiguracionPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  
  // Settings State
  const [currentTheme, setCurrentTheme] = useState('light');
  const [fxConfig, setFxConfig] = useState(null);

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Theme
      const theme = await themeService.getThemePreference(user.id);
      setCurrentTheme(theme);

      // 2. FX Config
      const config = await tiposCambioService.getUSDARSConfig(user.id);
      setFxConfig(config || {
        tipo_cambio_usd_ars: 0,
        fuente_tipo_cambio: 'manual'
      });

    } catch (error) {
      console.error('Error loading settings:', error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la configuración." });
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = async (newTheme) => {
    setCurrentTheme(newTheme);
    await themeService.saveThemePreference(user?.id, newTheme);
    toast({ title: "Tema actualizado", description: `Preferencia guardada: ${newTheme}` });
  };

  const handleSaveFx = async (newConfig) => {
    if (!tiposCambioService.validateRate(newConfig.rate)) {
      toast({ variant: "destructive", title: "Valor inválido", description: "El tipo de cambio debe ser un número positivo." });
      return;
    }

    setLoading(true);
    try {
      const result = await tiposCambioService.saveUSDARSConfig(user.id, newConfig);
      if (result.success) {
        toast({ title: "Configuración guardada", description: "El tipo de cambio ha sido actualizado.", className: "bg-green-50 text-green-800" });
        await loadSettings(); // Reload to confirm
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error al guardar", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <PageHeader 
        title="Configuración Global" 
        description="Personaliza la apariencia y parámetros financieros del sistema."
      />

      {/* 1. Theme Section */}
      <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
           <span className="text-2xl">🎨</span> Apariencia
        </h3>
        <div className="grid grid-cols-3 gap-4 max-w-md">
           <button
             onClick={() => handleThemeChange('light')}
             className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
               currentTheme === 'light' 
                 ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                 : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
             }`}
           >
             <Sun className="w-6 h-6 mb-2" />
             <span className="text-sm font-medium">Claro</span>
           </button>

           <button
             onClick={() => handleThemeChange('dark')}
             className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
               currentTheme === 'dark' 
                 ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                 : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
             }`}
           >
             <Moon className="w-6 h-6 mb-2" />
             <span className="text-sm font-medium">Oscuro</span>
           </button>

           <button
             onClick={() => handleThemeChange('system')}
             className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
               currentTheme === 'system' 
                 ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                 : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
             }`}
           >
             <Monitor className="w-6 h-6 mb-2" />
             <span className="text-sm font-medium">Sistema</span>
           </button>
        </div>
      </Card>

      {/* 2. Tipo de Cambio Section */}
      <TipoCambioSection 
        config={fxConfig} 
        onSave={handleSaveFx} 
        loading={loading}
      />
    </div>
  );
};

export default ConfiguracionPage;
