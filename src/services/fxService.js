
import { tiposCambioService } from './tiposCambioService';

export const fxService = {
  /**
   * Get Exchange Rate
   * Now reads from user_config via tiposCambioService for consistency
   */
  async getExchangeRate(userId, fromCurrency = 'USD', toCurrency = 'ARS') {
    if (fromCurrency === toCurrency) {
      return { rate: 1, date: new Date().toISOString(), source: 'Same Currency' };
    }

    // Attempt to get user config first
    if (userId) {
      const config = await tiposCambioService.getUSDARSConfig(userId);
      if (config && config.tipo_cambio_usd_ars) {
        return {
          rate: parseFloat(config.tipo_cambio_usd_ars),
          date: config.ultima_actualizacion || new Date().toISOString(),
          source: config.fuente_tipo_cambio === 'auto' ? config.proveedor : 'Manual Config'
        };
      }
    }

    // Fallback: Try live fetch if no config exists
    const live = await tiposCambioService.getUSDARSRate();
    if (live.rate) {
      return {
         rate: live.rate,
         date: live.timestamp,
         source: live.source
      };
    }

    // Hard fallback
    return {
      rate: 1000, // Safe default
      date: new Date().toISOString(),
      source: 'System Default'
    };
  }
};
