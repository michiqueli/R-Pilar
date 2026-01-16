
import { supabase } from '@/lib/customSupabaseClient';

export const inversionesService = {
  /**
   * Fetch movements for a specific project that are of type INVERSION or DEVOLUCION
   */
  async getMovimientosInversion(proyectoId) {
    if (!proyectoId) return [];
    
    console.log('Fetching investment movements for project:', proyectoId);

    try {
      const { data, error } = await supabase
        .from('inversiones')
        .select(`
          *,
          cuentas:cuenta_id (titulo, moneda),
          inversionistas:inversionista_id (nombre)
        `)
        .eq('proyecto_id', proyectoId)
        .in('tipo', ['INVERSION', 'DEVOLUCION'])
        //.eq('estado', 'CONFIRMADO') // Requirement says "estado is 'CONFIRMADO'", but typically we might want to see PENDING too. Let's stick to prompt strictly, or maybe filter later. 
        // Prompt says: "fetch movements from 'inversiones' table where proyecto_id matches, tipo is 'INVERSION' or 'DEVOLUCION', estado is 'CONFIRMADO'". 
        // Wait, Task 2 says "Show estado as CONFIRMADO... or PENDIENTE". So I should probably fetch both statuses to be safe, or just filter in UI.
        // Let's allow fetching all statuses and filter if needed, but the prompt for Task 1 specifically says "estado is 'CONFIRMADO'".
        // However, if I filter strictly here, Task 2 can't show PENDIENTE.
        // I will assume the prompt for Task 1 meant "focus on confirmed for calculations" but for the list we usually need all.
        // Let's try to follow strictly first: "estado is 'CONFIRMADO'". But then Task 2 is impossible.
        // I'll fetch all and filter in calculation for accuracy, but show all in table.
        // Correction: Prompt Task 1 explicitly says "estado is 'CONFIRMADO'". I will follow this for the service method as requested. 
        // IF the user finds missing pending items, they can request a change.
        // actually, looking at Task 2 "Show estado as CONFIRMADO ... or PENDIENTE". It implies the list should have PENDIENTE.
        // I will remove the strict .eq('estado', 'CONFIRMADO') from the fetch to support Task 2, but apply it for the "Resumen" calculation in Task 1.
        .order('fecha', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getMovimientosInversion:', error);
      return [];
    }
  },

  /**
   * Calculate summary of investments
   */
  async getResumenInversiones(proyectoId) {
    console.log('Calculating investment summary for:', proyectoId);
    
    // We reuse the fetch, but we might need to be careful if we changed the query above.
    // If getMovimientosInversion returns all (including pending), we should filter for the summary math if we only want confirmed numbers.
    // Usually financial summaries only count confirmed.
    
    const movimientos = await this.getMovimientosInversion(proyectoId);
    
    let aportes = 0;
    let devoluciones = 0;
    let cantidad = 0;

    movimientos.forEach(m => {
      // Only count CONFIRMADO for financial totals
      if (m.estado === 'CONFIRMADO') {
        const monto = parseFloat(m.monto_ars || 0); // Using monto_ars as base, or net if preferred. Prompt says "neto/monto_ars".
        // Let's use monto_ars or neto. Usually neto includes tax? In investments usually tax isn't the main thing.
        // Let's use m.monto_ars as per prompt "calculate sum of neto/monto_ars". I'll use monto_ars.
        
        if (m.tipo === 'INVERSION') {
          aportes += monto;
        } else if (m.tipo === 'DEVOLUCION') {
          devoluciones += monto;
        }
      }
      cantidad++;
    });

    const saldoNeto = aportes - devoluciones;

    return {
      aportes,
      devoluciones,
      saldoNeto,
      cantidad
    };
  }
};
