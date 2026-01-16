
import { supabase } from '@/lib/customSupabaseClient';

export const tiposCambioService = {
  
  async getUSDARSRate() {
    try {
      // Using exchangerate-api as requested, or fallback to dolarapi for AR specific
      // The prompt specifically asked for: https://api.exchangerate-api.com/v4/latest/USD
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const rate = data.rates?.ARS;

      if (!rate) {
        throw new Error('ARS rate not found in response');
      }

      return {
        rate: parseFloat(rate),
        timestamp: new Date().toISOString(),
        source: 'exchangerate-api.com',
        error: null
      };

    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      return {
        rate: null,
        timestamp: null,
        source: null,
        error: error.message
      };
    }
  },

  validateRate(rate) {
    const num = parseFloat(rate);
    return !isNaN(num) && num > 0;
  },

  async getUSDARSConfig(userId) {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('user_config')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error fetching FX config:', err);
      return null;
    }
  },

  async saveUSDARSConfig(userId, config) {
    if (!userId) return { success: false, error: 'No user ID' };

    try {
      const payload = {
        user_id: userId,
        tipo_cambio_usd_ars: config.rate,
        fuente_tipo_cambio: config.sourceType, // 'manual' | 'auto'
        proveedor: config.provider,
        ultima_actualizacion: new Date().toISOString(),
        error_ultimo: config.error || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_config')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Error saving FX config:', err);
      return { success: false, error: err.message };
    }
  }
};
