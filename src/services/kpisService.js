import { movimientosProyectoService } from './movimientosProyectoService';

/**
 * Service for calculating and retrieving Key Performance Indicators (KPIs)
 * Updated to use the unified 'inversiones' table via movimientosProyectoService.
 */
export const kpisService = {
  
  /**
   * Obtiene los KPIs totales del proyecto usando la tabla unificada
   */
  async getKpisTotales(proyectoId) {
    try {      
      // Utilizamos el servicio que ya sabe filtrar la tabla unificada
      const totals = await movimientosProyectoService.getTotalesProyecto(proyectoId);
      
      const result = {
        ingresos_totales: totals.ingresos,
        gastos_totales: totals.gastos,
        resultado_total: totals.resultado,
        inversiones_totales: totals.inversiones,
        flujo_neto: totals.flujoNeto
      };
      
      return result;
    } catch (error) {
      console.error('[kpisService] Error in getKpisTotales:', error);
      return {
        ingresos_totales: 0,
        gastos_totales: 0,
        resultado_total: 0
      };
    }
  },

  /**
   * Mantenemos este para compatibilidad con la tabla de balance_mensual si la sigues usando como caché,
   * pero ahora se nutre de la lógica unificada.
   */
  async actualizarBalanceMensual(proyectoId, mes, anio) {
    try {
      // Obtenemos los datos calculados desde la tabla unificada
      const balance = await movimientosProyectoService.getBalanceMensualProyecto(proyectoId, mes, anio);

      const payload = {
        proyecto_id: proyectoId,
        mes: mes + 1, // JS months are 0-11, DB usually 1-12
        anio,
        ingresos_totales: balance.ingresos,
        gastos_totales: balance.gastos,
        resultado: balance.balance,
        updated_at: new Date().toISOString()
      };

      // Si decides seguir guardando el histórico en balance_mensual:
      /*
      await supabase
        .from('balance_mensual')
        .upsert(payload, { onConflict: 'proyecto_id, mes, anio' });
      */

      return payload;
    } catch (error) {
      console.error('[kpisService] Error in actualizarBalanceMensual:', error);
      throw error;
    }
  }
};