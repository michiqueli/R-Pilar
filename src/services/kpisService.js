
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Service for calculating and retrieving Key Performance Indicators (KPIs)
 * Uses 'gastos' and 'ingresos' tables exclusively.
 */
export const kpisService = {
  
  /**
   * Fetch all KPIs for a project from kpis_proyecto table
   */
  async getKpisProyecto(proyectoId) {
    try {
      console.log(`[kpisService] getKpisProyecto: Fetching for project ${proyectoId}`);
      const { data, error } = await supabase
        .from('kpis_proyecto')
        .select('*')
        .eq('proyecto_id', proyectoId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[kpisService] getKpisProyecto Error:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('[kpisService] Error in getKpisProyecto:', error);
      return [];
    }
  },

  /**
   * Fetch monthly balance record
   */
  async getBalanceMensual(proyectoId, mes, anio) {
    try {
      console.log(`[kpisService] getBalanceMensual: Fetching for ${mes}/${anio}, project ${proyectoId}`);
      const { data, error } = await supabase
        .from('balance_mensual')
        .select('*')
        .eq('proyecto_id', proyectoId)
        .eq('mes', mes)
        .eq('anio', anio)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        console.log(`[kpisService] getBalanceMensual: No record found, returning default.`);
        return {
          proyecto_id: proyectoId,
          mes,
          anio,
          ingresos_totales: 0,
          gastos_totales: 0,
          resultado: 0
        };
      }
      
      return data;
    } catch (error) {
      console.error('[kpisService] Error in getBalanceMensual:', error);
      return {
        proyecto_id: proyectoId,
        mes,
        anio,
        ingresos_totales: 0,
        gastos_totales: 0,
        resultado: 0
      };
    }
  },

  /**
   * Fetch confirmed income entries for a specific month
   * Table: ingresos
   */
  async getIngresos(proyectoId, mes, anio) {
    try {
      const startDate = `${anio}-${String(mes).padStart(2, '0')}-01`;
      const endDate = new Date(anio, mes, 0).toISOString().split('T')[0];

      console.log(`[kpisService] getIngresos: Fetching confirmed 'ingresos' for project ${proyectoId} between ${startDate} and ${endDate}`);

      const { data, error } = await supabase
        .from('ingresos')
        .select('id, descripcion, monto, fecha, categoria, estado')
        .eq('proyecto_id', proyectoId)
        .gte('fecha', startDate)
        .lte('fecha', endDate)
        .eq('estado', 'CONFIRMADO')
        .order('fecha', { ascending: false });

      if (error) {
        console.error('[kpisService] getIngresos Query Error:', error);
        throw error;
      }
      
      console.log(`[kpisService] getIngresos: Found ${data?.length || 0} records.`);
      return data || [];
    } catch (error) {
      console.error('[kpisService] Error in getIngresos:', error);
      return [];
    }
  },

  /**
   * Fetch confirmed expense entries for a specific month
   * Table: gastos
   */
  async getGastos(proyectoId, mes, anio) {
    try {
      const startDate = `${anio}-${String(mes).padStart(2, '0')}-01`;
      const endDate = new Date(anio, mes, 0).toISOString().split('T')[0];

      console.log(`[kpisService] getGastos: Fetching confirmed 'gastos' for project ${proyectoId} between ${startDate} and ${endDate}`);

      const { data, error } = await supabase
        .from('gastos')
        .select('id, descripcion, monto, fecha, categoria, estado')
        .eq('proyecto_id', proyectoId)
        .gte('fecha', startDate)
        .lte('fecha', endDate)
        .eq('estado', 'CONFIRMADO')
        .order('fecha', { ascending: false });

      if (error) {
        console.error('[kpisService] getGastos Query Error:', error);
        throw error;
      }

      console.log(`[kpisService] getGastos: Found ${data?.length || 0} records.`);
      return data || [];
    } catch (error) {
      console.error('[kpisService] Error in getGastos:', error);
      return [];
    }
  },

  /**
   * Get total confirmed expenses for project (All Time)
   * Table: gastos
   */
  async getGastosTotales(proyectoId) {
    try {
      console.log(`[kpisService] getGastosTotales: Fetching ALL confirmed 'gastos' for project ${proyectoId}`);
      
      const { data, error } = await supabase
        .from('gastos')
        .select('id, monto, estado')
        .eq('proyecto_id', proyectoId)
        .eq('estado', 'CONFIRMADO');

      if (error) {
        console.error('[kpisService] getGastosTotales Query Error:', error);
        throw error;
      }
      
      const total = data.reduce((sum, item) => sum + Number(item.monto || 0), 0);
      console.log(`[kpisService] getGastosTotales: Calculated Total = ${total} (from ${data.length} records)`);
      
      return total;
    } catch (error) {
      console.error('[kpisService] Error in getGastosTotales:', error);
      return 0;
    }
  },

  /**
   * Get total confirmed income for project (All Time)
   * Table: ingresos
   */
  async getIngresosTotales(proyectoId) {
    try {
      console.log(`[kpisService] getIngresosTotales: Fetching ALL confirmed 'ingresos' for project ${proyectoId}`);
      
      const { data, error } = await supabase
        .from('ingresos')
        .select('id, monto, estado')
        .eq('proyecto_id', proyectoId)
        .eq('estado', 'CONFIRMADO');

      if (error) {
        console.error('[kpisService] getIngresosTotales Query Error:', error);
        throw error;
      }
      
      const total = data.reduce((sum, item) => sum + Number(item.monto || 0), 0);
      console.log(`[kpisService] getIngresosTotales: Calculated Total = ${total} (from ${data.length} records)`);
      
      return total;
    } catch (error) {
      console.error('[kpisService] Error in getIngresosTotales:', error);
      return 0;
    }
  },

  /**
   * Get total result (Income - Expenses) for project (All Time)
   */
  async getResultadoTotal(proyectoId) {
    try {
      console.log(`[kpisService] getResultadoTotal: Calculating...`);
      const [ingresos, gastos] = await Promise.all([
        this.getIngresosTotales(proyectoId),
        this.getGastosTotales(proyectoId)
      ]);
      const resultado = ingresos - gastos;
      console.log(`[kpisService] getResultadoTotal: ${resultado} (Ingresos: ${ingresos} - Gastos: ${gastos})`);
      return resultado;
    } catch (error) {
      console.error('[kpisService] Error in getResultadoTotal:', error);
      return 0;
    }
  },

  /**
   * Get all total KPIs in one object
   */
  async getKpisTotales(proyectoId) {
    try {
      console.log(`[kpisService] getKpisTotales: Fetching summary for project ${proyectoId}`);
      const [ingresos, gastos] = await Promise.all([
        this.getIngresosTotales(proyectoId),
        this.getGastosTotales(proyectoId)
      ]);
      
      const result = {
        ingresos_totales: ingresos,
        gastos_totales: gastos,
        resultado_total: ingresos - gastos
      };
      
      console.log('[kpisService] getKpisTotales Result:', result);
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
   * Calculate monthly totals and update balance_mensual table
   */
  async actualizarBalanceMensual(proyectoId, mes, anio) {
    try {
      console.log(`[kpisService] actualizarBalanceMensual: Updating for ${mes}/${anio}, project ${proyectoId}`);
      
      const ingresos = await this.getIngresos(proyectoId, mes, anio);
      const gastos = await this.getGastos(proyectoId, mes, anio);

      const ingresosTotales = ingresos.reduce((sum, item) => sum + Number(item.monto || 0), 0);
      const gastosTotales = gastos.reduce((sum, item) => sum + Number(item.monto || 0), 0);
      const resultado = ingresosTotales - gastosTotales;
      
      console.log(`[kpisService] Monthly Calc: Ingresos=${ingresosTotales}, Gastos=${gastosTotales}, Resultado=${resultado}`);

      const payload = {
        proyecto_id: proyectoId,
        mes,
        anio,
        ingresos_totales: ingresosTotales,
        gastos_totales: gastosTotales,
        resultado,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('balance_mensual')
        .upsert(payload, { onConflict: 'proyecto_id, mes, anio' })
        .select()
        .single();

      if (error) throw error;
      console.log('[kpisService] actualizarBalanceMensual: Update Successful', data);
      return data;

    } catch (error) {
      console.error('[kpisService] Error in actualizarBalanceMensual:', error);
      throw error;
    }
  },

  /**
   * Calculate all KPIs (Monthly and Total), update monthly balance, and upsert KPI records
   */
  async calcularKpis(proyectoId) {
    try {
      const today = new Date();
      const mes = today.getMonth() + 1; // 1-12
      const anio = today.getFullYear();

      console.log(`[kpisService] calcularKpis: Starting Full Calculation for project ${proyectoId}`);

      // 1. Update Monthly Balance
      const balance = await this.actualizarBalanceMensual(proyectoId, mes, anio);

      // 2. Get Total Balance
      const kpisTotales = await this.getKpisTotales(proyectoId);

      // 3. Prepare KPI records to upsert
      const kpisToUpsert = [
        // Monthly KPIs
        {
          proyecto_id: proyectoId,
          nombre: 'Balance Mensual',
          valor: balance.resultado,
          tipo: 'BALANCE',
          periodo: 'MENSUAL',
          updated_at: new Date().toISOString()
        },
        {
          proyecto_id: proyectoId,
          nombre: 'Ingresos Mensuales',
          valor: balance.ingresos_totales,
          tipo: 'INGRESOS',
          periodo: 'MENSUAL',
          updated_at: new Date().toISOString()
        },
        {
          proyecto_id: proyectoId,
          nombre: 'Gastos Mensuales',
          valor: balance.gastos_totales,
          tipo: 'GASTOS',
          periodo: 'MENSUAL',
          updated_at: new Date().toISOString()
        },
        // Total KPIs
        {
          proyecto_id: proyectoId,
          nombre: 'Balance Total',
          valor: kpisTotales.resultado_total,
          tipo: 'BALANCE',
          periodo: 'TOTAL',
          updated_at: new Date().toISOString()
        },
        {
          proyecto_id: proyectoId,
          nombre: 'Ingresos Totales',
          valor: kpisTotales.ingresos_totales,
          tipo: 'INGRESOS',
          periodo: 'TOTAL',
          updated_at: new Date().toISOString()
        },
        {
          proyecto_id: proyectoId,
          nombre: 'Gastos Totales',
          valor: kpisTotales.gastos_totales,
          tipo: 'GASTOS',
          periodo: 'TOTAL',
          updated_at: new Date().toISOString()
        }
      ];

      // 4. Upsert KPIs 
      // First clean up old KPIs for this project to avoid duplicates
      await supabase.from('kpis_proyecto').delete()
        .eq('proyecto_id', proyectoId)
        .in('periodo', ['MENSUAL', 'TOTAL'])
        .in('tipo', ['BALANCE', 'INGRESOS', 'GASTOS']);

      const { data, error } = await supabase
        .from('kpis_proyecto')
        .insert(kpisToUpsert)
        .select();

      if (error) throw error;

      console.log('[kpisService] calcularKpis: Successfully calculated and saved KPIs');
      return { balance, kpis: data, kpisTotales };

    } catch (error) {
      console.error('[kpisService] Error in calcularKpis:', error);
      throw error;
    }
  }
};
