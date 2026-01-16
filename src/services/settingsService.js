
import { supabase } from '@/lib/customSupabaseClient';

export const DEFAULT_SETTINGS = {
  cotizacion_usd: 1500,
  moneda_base: 'ARS',
  tema: 'light',
  color_acento: '#3B82F6', // Default blue
  idioma: 'es',
  fuente_cotizacion: 'manual'
};

export const settingsService = {
  async getSettings(userId) {
    // Return defaults immediately if no user
    if (!userId) return { success: true, data: DEFAULT_SETTINGS };

    try {
      const { data, error } = await supabase
        .from('configuracion')
        .select('*')
        .eq('user_id', userId)
        .limit(1);

      if (error) {
        // If error (e.g. table doesn't exist yet or RLS issue), fallback to defaults without failing hard
        console.warn('Settings fetch error, using defaults:', error.message);
        return { success: true, data: DEFAULT_SETTINGS };
      }
      
      // Return found settings combined with defaults (to ensure no missing keys), or defaults if none found
      const userSettings = data && data.length > 0 ? data[0] : {};
      const mergedSettings = { ...DEFAULT_SETTINGS, ...userSettings };
      
      return { success: true, data: mergedSettings };
    } catch (error) {
      console.error('Error in getSettings:', error);
      return { success: true, data: DEFAULT_SETTINGS }; // Fail safe
    }
  },

  async upsertSettings(userId, updates) {
    if (!userId) return { success: false, error: 'No user ID' };

    try {
      // Optimistic Update: Save to LocalStorage first for immediate UI feedback
      const currentLocal = JSON.parse(localStorage.getItem('app_user_settings') || JSON.stringify(DEFAULT_SETTINGS));
      const newLocal = { ...currentLocal, ...updates };
      localStorage.setItem('app_user_settings', JSON.stringify(newLocal));

      // Check if record exists first to avoid ON CONFLICT issues if constraint is missing
      const { data: existing } = await supabase
        .from('configuracion')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      let data, error;

      if (existing) {
        // Update existing record
        const result = await supabase
          .from('configuracion')
          .update({ 
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('configuracion')
          .insert([{ 
            user_id: userId, 
            ...updates,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating settings:', error);
      return { success: false, error: error.message };
    }
  },

  async updateCotizacion(userId, valor_usd) {
    // Guard against invalid values
    if (!valor_usd || isNaN(valor_usd)) return { success: false, error: 'Invalid value' };
    return this.upsertSettings(userId, { cotizacion_usd: valor_usd });
  },

  async updateTema(userId, tema) {
    // Side effect: update document class
    if (tema === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (tema === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (tema === 'auto') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
    
    // Fallback to local storage
    localStorage.setItem('vite-ui-theme', tema);
    
    return this.upsertSettings(userId, { tema });
  },

  async updateColorAcento(userId, color_acento) {
    // Side effect: update CSS variable
    document.documentElement.style.setProperty('--color-primary', color_acento);
    // Also update accent which mirrors primary in this new system
    document.documentElement.style.setProperty('--color-accent', color_acento);
    
    localStorage.setItem('app-accent-color', color_acento);
    
    return this.upsertSettings(userId, { color_acento });
  },

  async updateIdioma(userId, idioma) {
    localStorage.setItem('app_locale', idioma);
    return this.upsertSettings(userId, { idioma });
  }
};
