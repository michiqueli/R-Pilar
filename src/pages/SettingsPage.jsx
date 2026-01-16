
import React, { useEffect, useState } from 'react';
import { 
  Banknote, 
  Palette, 
  Globe, 
  LogOut, 
  Save, 
  Loader2 
} from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { settingsService, DEFAULT_SETTINGS } from '@/services/settingsService';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

// Components
import SettingsCard from '@/components/settings/SettingsCard';
import SettingsPillGroup from '@/components/settings/SettingsPillGroup';
import ConfirmLogoutModal from '@/components/settings/ConfirmLogoutModal';
import usePageTitle from '@/hooks/usePageTitle';

const SettingsPage = () => {
  const { t, currentTheme, setCurrentTheme, language, setLanguage } = useTranslation();
  usePageTitle(t('settings.title'));
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // State
  const [fxValue, setFxValue] = useState(DEFAULT_SETTINGS.cotizacion_usd.toString());
  const [fxSource, setFxSource] = useState(DEFAULT_SETTINGS.fuente_cotizacion);
  const [savingFx, setSavingFx] = useState(false);
  
  // Local UI state
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [selectedLang, setSelectedLang] = useState(language);

  // Modal State
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Constants
  const themes = [
    { id: 'light', label: t('settings.themeLight'), icon: '☀️' },
    { id: 'dark', label: t('settings.themeDark'), icon: '🌙' },
    { id: 'system', label: t('settings.themeAuto'), icon: '🖥️' }
  ];

  const languages = [
    { id: 'es', label: 'Español', icon: '🇪🇸' },
    { id: 'en', label: 'English', icon: '🇺🇸' },
    { id: 'pt', label: 'Português', icon: '🇧🇷' }
  ];

  // Load Settings on Mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      
      const { success, data } = await settingsService.getSettings(user.id);
      if (success && data) {
        setFxValue(data.cotizacion_usd?.toString() || DEFAULT_SETTINGS.cotizacion_usd.toString());
        setFxSource(data.fuente_cotizacion || DEFAULT_SETTINGS.fuente_cotizacion);
        
        if (data.tema && data.tema !== currentTheme) setSelectedTheme(data.tema);
        if (data.idioma && data.idioma !== language) setSelectedLang(data.idioma);
      }
    };

    loadSettings();
  }, [user]); 

  // Handlers
  const handleSaveFx = async () => {
    if (!fxValue || parseFloat(fxValue) <= 0) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('settings.invalidFx')
      });
      return;
    }

    setSavingFx(true);
    if (user) {
      const { success } = await settingsService.updateCotizacion(user.id, parseFloat(fxValue));
      if (success) {
        toast({
          title: t('common.success'),
          description: t('settings.fxSaved'),
          className: "bg-green-50 border-green-200 text-green-800"
        });
      } else {
        toast({
          variant: "destructive",
          title: t('common.error'),
          description: t('common.errorSave')
        });
      }
    } else {
       localStorage.setItem('settings_fx_value', fxValue);
       toast({ title: t('common.success'), description: t('common.save') });
    }
    setSavingFx(false);
  };

  const handleThemeChange = async (newTheme) => {
    setSelectedTheme(newTheme);
    setCurrentTheme(newTheme);
    if (user) {
      await settingsService.updateTema(user.id, newTheme);
    }
  };

  const handleLanguageChange = async (langId) => {
    setSelectedLang(langId);
    setLanguage(langId);
    if (user) {
      await settingsService.updateIdioma(user.id, langId);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] transition-colors duration-300 font-sans">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">
            {t('settings.title')}
          </h1>
          <p className="text-[var(--color-muted-text)]">
            {t('settings.subtitle')}
          </p>
        </div>

        <div className="space-y-6">
          {/* 1. FX Rate Settings */}
          <SettingsCard 
            icon={Banknote} 
            title={t('settings.fxTitle')}
            description={t('settings.fxDesc')}
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                 <div className="flex-1 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted-text)]">{t('settings.fxRate')}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-text)] font-semibold">$</span>
                      <input
                        type="number"
                        value={fxValue}
                        onChange={(e) => setFxValue(e.target.value)}
                        className="flex h-11 w-full rounded-[var(--radius-md)] border-2 border-[var(--color-border)] bg-transparent px-3 py-2 pl-7 text-lg font-medium text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                        placeholder="0.00"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-text)] text-xs font-bold">ARS</span>
                    </div>
                 </div>
                 <div className="flex-1 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted-text)]">{t('settings.fxSource')}</label>
                    <select 
                       value={fxSource}
                       onChange={(e) => setFxSource(e.target.value)}
                       className="flex h-11 w-full rounded-[var(--radius-md)] border-2 border-[var(--color-border)] bg-transparent px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                    >
                       <option value="manual">{t('settings.manual')}</option>
                       <option value="dolar_blue">{t('settings.dolarBlue')}</option>
                       <option value="dolar_oficial">{t('settings.dolarOficial')}</option>
                    </select>
                 </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveFx}
                  disabled={savingFx}
                  className="inline-flex items-center justify-center rounded-[var(--radius-full)] text-sm font-bold bg-[var(--color-primary)] text-white hover:opacity-90 h-10 px-6 py-2 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingFx ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  {t('settings.saveChanges')}
                </button>
              </div>
            </div>
          </SettingsCard>

          {/* 2. Theme Settings */}
          <SettingsCard 
            icon={Palette} 
            title={t('settings.appearanceTitle')}
            description={t('settings.appearanceDesc')}
          >
            <div className="py-2">
              <SettingsPillGroup 
                options={themes} 
                value={selectedTheme} 
                onChange={handleThemeChange} 
              />
            </div>
          </SettingsCard>

          {/* 3. Language Settings */}
          <SettingsCard 
            icon={Globe} 
            title={t('settings.languageTitle')}
            description={t('settings.languageDesc')}
          >
            <div className="py-2">
              <SettingsPillGroup 
                options={languages} 
                value={selectedLang} 
                onChange={handleLanguageChange} 
              />
            </div>
          </SettingsCard>

          {/* 4. Logout Section */}
          <div className="pt-8 border-t border-[var(--color-border)] flex justify-center">
             <button
                onClick={() => setShowLogoutModal(true)}
                className="group flex items-center gap-2 px-6 py-3 rounded-[var(--radius-full)] text-[var(--color-danger)] hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors font-medium"
             >
                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {t('auth.logout')}
             </button>
          </div>
        </div>

        <div className="text-center text-xs text-[var(--color-muted-text)] pt-10 pb-4">
           Caisha SRL • v1.0.3 • {new Date().getFullYear()}
        </div>
      </div>

      <ConfirmLogoutModal 
        isOpen={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  );
};

export default SettingsPage;
