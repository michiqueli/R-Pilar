
import { tiposCambioService } from './tiposCambioService';

export const ExchangeRateService = {
  /**
   * Wrapper for getting USD rate, prioritizing user config
   */
  async getUsdArsRate(userId) {
    if (userId) {
      const config = await tiposCambioService.getUSDARSConfig(userId);
      if (config && config.tipo_cambio_usd_ars) {
        return parseFloat(config.tipo_cambio_usd_ars);
      }
    }
    
    // Fallback
    const live = await tiposCambioService.getUSDARSRate();
    return live.rate || 1200;
  }
};
