
import { supabase } from '@/lib/customSupabaseClient';

export const movimientosProyectoService = {
  /**
   * Obtiene todos los movimientos vinculados a un proyecto
   */
  async getMovimientosProyecto(proyectoId) {
    try {
      // First try to get from the join table
      const { data: linkedData, error: linkedError } = await supabase
        .from('movimientos_proyecto')
        .select(`
          movimiento_id,
          movimiento:inversiones (
            *,
            cuentas (id, titulo),
            projects (id, name),
            providers (id, name),
            inversionistas (id, nombre)
          )
        `)
        .eq('project_id', proyectoId);

      if (linkedError) throw linkedError;

      // Extract the nested movement objects
      const movements = linkedData?.map(item => item.movimiento).filter(Boolean) || [];
      
      // Also fetch legacy/direct movements (where proyecto_id is set directly on inversiones but maybe not in link table)
      // This ensures we don't lose data during transition
      const { data: directData, error: directError } = await supabase
        .from('inversiones')
        .select(`
            *,
            cuentas (id, titulo),
            projects (id, name),
            providers (id, name),
            inversionistas (id, nombre)
        `)
        .eq('proyecto_id', proyectoId);
        
      if (directError) throw directError;

      // Merge and deduplicate by ID
      const allMovements = [...movements, ...(directData || [])];
      const uniqueMovements = Array.from(new Map(allMovements.map(item => [item.id, item])).values());
      
      // Sort by date desc
      return uniqueMovements.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    } catch (error) {
      console.error('[movimientosProyectoService] Error fetching project movements:', error);
      return [];
    }
  },

  /**
   * Obtiene solo los movimientos confirmados de un proyecto
   */
  async getMovimientosConfirmados(proyectoId) {
    const all = await this.getMovimientosProyecto(proyectoId);
    return all.filter(m => m.estado === 'CONFIRMADO');
  },

  /**
   * Vincula un movimiento existente a un proyecto
   */
  async vincularMovimientoProyecto(movimientoId, proyectoId) {
    try {
      // Check if already linked
      const { data: existing } = await supabase
        .from('movimientos_proyecto')
        .select('id')
        .eq('movimiento_id', movimientoId)
        .maybeSingle();

      if (existing) {
        // If already linked to another project, update it? Or ignore?
        // Constraint is unique on movimiento_id, so we update
        const { error } = await supabase
          .from('movimientos_proyecto')
          .update({ project_id: proyectoId })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Create new link
        const { error } = await supabase
          .from('movimientos_proyecto')
          .insert({
            project_id: proyectoId,
            movimiento_id: movimientoId
          });
        if (error) throw error;
      }

      // Also ensure the direct column is updated for compatibility
      await supabase
        .from('inversiones')
        .update({ proyecto_id: proyectoId })
        .eq('id', movimientoId);

      return { success: true };
    } catch (error) {
      console.error('[movimientosProyectoService] Error linking movement:', error);
      return { success: false, error };
    }
  },

  /**
   * Calcula el balance mensual (Ingresos - Gastos) para un mes específico
   */
  async getBalanceMensualProyecto(proyectoId, mes, anio) {
    try {
      const movimientos = await this.getMovimientosConfirmados(proyectoId);
      
      // Filter by month/year
      const monthlyMovs = movimientos.filter(m => {
        const d = new Date(m.fecha);
        return d.getMonth() === mes && d.getFullYear() === anio;
      });

      let ingresos = 0;
      let gastos = 0;

      monthlyMovs.forEach(m => {
        const monto = Number(m.monto_ars) || 0;
        if (m.tipo === 'INGRESO' || m.tipo === 'INVERSION') {
          ingresos += monto;
        } else if (m.tipo === 'GASTO' || m.tipo === 'DEVOLUCION') {
          gastos += monto;
        }
      });

      return {
        ingresos,
        gastos,
        balance: ingresos - gastos,
        count: monthlyMovs.length
      };

    } catch (error) {
      console.error('[movimientosProyectoService] Error calculating monthly balance:', error);
      return { ingresos: 0, gastos: 0, balance: 0, count: 0 };
    }
  },

  /**
   * Calcula los totales globales del proyecto (Solo confirmados)
   */
  async getTotalesProyecto(proyectoId) {
    try {
      const movimientos = await this.getMovimientosConfirmados(proyectoId);
      
      let ingresos = 0;
      let gastos = 0;
      let inversiones = 0;

      movimientos.forEach(m => {
        const monto = Number(m.monto_ars) || 0;
        // Clasificación basada en tu nueva estructura
        if (m.tipo === 'INGRESO') {
          ingresos += monto;
        } else if (m.tipo === 'GASTO' || m.tipo === 'DEVOLUCION') {
          gastos += monto;
        } else if (m.tipo === 'INVERSION') {
          inversiones += monto;
        }
      });

      return {
        ingresos,
        gastos,
        inversiones,
        resultado: ingresos - gastos, // Resultado operativo
        flujoNeto: (ingresos + inversiones) - gastos // Caja real
      };
    } catch (error) {
       console.error('[movimientosProyectoService] Error:', error);
       return { ingresos: 0, gastos: 0, inversiones: 0, resultado: 0, flujoNeto: 0 };
    }
  },
  // Alias for specific KPI getters
  async getIngresosTotalesProyecto(proyectoId) {
    const totals = await this.getTotalesProyecto(proyectoId);
    return totals.ingresos;
  },

  async getGastosTotalesProyecto(proyectoId) {
    const totals = await this.getTotalesProyecto(proyectoId);
    return totals.gastos;
  },
  
  async getResultadoTotalProyecto(proyectoId) {
    const totals = await this.getTotalesProyecto(proyectoId);
    return totals.resultado;
  }
};
