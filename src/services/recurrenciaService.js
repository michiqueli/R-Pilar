import { supabase } from '@/lib/customSupabaseClient';
import { addDays, addWeeks, addMonths } from 'date-fns';

/**
 * Service para gestionar Pagos Recurrentes.
 * Genera y trackea ocurrencias de movimientos periódicos.
 */
export const recurrenciaService = {

  /**
   * Genera las fechas programadas futuras para un movimiento recurrente
   */
  calcularFechasFuturas(fechaInicio, frecuencia, fechaLimite = null, maxOcurrencias = 52) {
    const fechas = [];
    let current = new Date(fechaInicio);
    const limite = fechaLimite ? new Date(fechaLimite) : null;

    for (let i = 0; i < maxOcurrencias; i++) {
      switch (frecuencia) {
        case 'semanal':
          current = addWeeks(current, 1);
          break;
        case 'quincenal':
          current = addDays(current, 15);
          break;
        case 'mensual':
          current = addMonths(current, 1);
          break;
        case 'trimestral':
          current = addMonths(current, 3);
          break;
        default:
          return fechas;
      }

      if (limite && current > limite) break;
      fechas.push(new Date(current));
    }

    return fechas;
  },

  /**
   * Activa la recurrencia para un movimiento: genera los registros en recurrencias_log
   */
  async activarRecurrencia(movimientoId, frecuencia, fechaInicio, fechaLimite = null) {
    try {
      // 1. Actualizar el movimiento origen
      const { error: updateError } = await supabase
        .from('inversiones')
        .update({
          es_recurrente: true,
          frecuencia,
          fecha_limite: fechaLimite || null,
          recurrencia_activa: true
        })
        .eq('id', movimientoId);

      if (updateError) throw updateError;

      // 2. Limpiar logs anteriores pendientes de este movimiento
      await supabase
        .from('recurrencias_log')
        .delete()
        .eq('movimiento_origen_id', movimientoId)
        .eq('estado', 'PENDIENTE');

      // 3. Generar nuevas fechas
      const fechas = this.calcularFechasFuturas(fechaInicio, frecuencia, fechaLimite);

      if (fechas.length === 0) return { success: true, count: 0 };

      // 4. Insertar registros
      const registros = fechas.map(fecha => ({
        movimiento_origen_id: movimientoId,
        fecha_programada: fecha.toISOString().split('T')[0],
        estado: 'PENDIENTE'
      }));

      const { error: insertError } = await supabase
        .from('recurrencias_log')
        .insert(registros);

      if (insertError) throw insertError;

      return { success: true, count: registros.length };
    } catch (error) {
      console.error('[recurrenciaService] Error activando recurrencia:', error);
      throw error;
    }
  },

  /**
   * Desactiva la recurrencia (limpia pendientes futuros)
   */
  async desactivarRecurrencia(movimientoId) {
    try {
      await supabase
        .from('inversiones')
        .update({
          es_recurrente: false,
          recurrencia_activa: false,
          frecuencia: null,
          fecha_limite: null
        })
        .eq('id', movimientoId);

      // Eliminar pendientes futuros
      await supabase
        .from('recurrencias_log')
        .delete()
        .eq('movimiento_origen_id', movimientoId)
        .eq('estado', 'PENDIENTE');

      return { success: true };
    } catch (error) {
      console.error('[recurrenciaService] Error desactivando recurrencia:', error);
      throw error;
    }
  },

  /**
   * Obtiene las recurrencias pendientes (para mostrar al usuario)
   */
  async getPendientes(limit = 20) {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('recurrencias_log')
        .select(`
          *,
          movimiento_origen:inversiones!movimiento_origen_id (
            id, tipo, descripcion, monto_ars, cuenta_id, proyecto_id, proveedor_id,
            cuentas (titulo),
            projects (name),
            providers (name)
          )
        `)
        .eq('estado', 'PENDIENTE')
        .lte('fecha_programada', today)
        .order('fecha_programada', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[recurrenciaService] Error fetching pendientes:', error);
      return [];
    }
  },

  /**
   * Obtiene las próximas recurrencias futuras (preview calendario)
   */
  async getProximas(dias = 30) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const futuro = new Date();
      futuro.setDate(futuro.getDate() + dias);

      const { data, error } = await supabase
        .from('recurrencias_log')
        .select(`
          *,
          movimiento_origen:inversiones!movimiento_origen_id (
            id, tipo, descripcion, monto_ars,
            cuentas (titulo),
            projects (name)
          )
        `)
        .eq('estado', 'PENDIENTE')
        .gte('fecha_programada', today)
        .lte('fecha_programada', futuro.toISOString().split('T')[0])
        .order('fecha_programada', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[recurrenciaService] Error fetching proximas:', error);
      return [];
    }
  },

  /**
   * Confirma una recurrencia: crea un nuevo movimiento basado en el original
   */
  async confirmarRecurrencia(recurrenciaId) {
    try {
      // 1. Obtener la recurrencia con datos del movimiento original
      const { data: recurrencia, error: fetchError } = await supabase
        .from('recurrencias_log')
        .select(`
          *,
          movimiento_origen:inversiones!movimiento_origen_id (*)
        `)
        .eq('id', recurrenciaId)
        .single();

      if (fetchError) throw fetchError;

      const origen = recurrencia.movimiento_origen;

      // 2. Crear nuevo movimiento basado en el original
      const nuevoMovimiento = {
        tipo: origen.tipo,
        descripcion: origen.descripcion,
        fecha: recurrencia.fecha_programada,
        estado: 'CONFIRMADO',
        cuenta_id: origen.cuenta_id,
        proyecto_id: origen.proyecto_id,
        proveedor_id: origen.proveedor_id,
        cliente_id: origen.cliente_id,
        inversionista_id: origen.inversionista_id,
        monto_ars: origen.monto_ars,
        valor_usd: origen.valor_usd,
        monto_usd: origen.monto_usd,
        iva_incluido: origen.iva_incluido,
        iva_porcentaje: origen.iva_porcentaje,
        neto: origen.neto,
        notas: `Pago recurrente generado automáticamente`
      };

      const { data: movCreado, error: insertError } = await supabase
        .from('inversiones')
        .insert([nuevoMovimiento])
        .select()
        .single();

      if (insertError) throw insertError;

      // 3. Actualizar el log
      const { error: updateError } = await supabase
        .from('recurrencias_log')
        .update({
          estado: 'CONFIRMADO',
          movimiento_generado_id: movCreado.id
        })
        .eq('id', recurrenciaId);

      if (updateError) throw updateError;

      return { success: true, movimiento: movCreado };
    } catch (error) {
      console.error('[recurrenciaService] Error confirmando recurrencia:', error);
      throw error;
    }
  },

  /**
   * Omite una recurrencia (la marca como OMITIDO, no genera movimiento)
   */
  async omitirRecurrencia(recurrenciaId) {
    try {
      const { error } = await supabase
        .from('recurrencias_log')
        .update({ estado: 'OMITIDO' })
        .eq('id', recurrenciaId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('[recurrenciaService] Error omitiendo recurrencia:', error);
      throw error;
    }
  },

  /**
   * Obtiene el log de recurrencias de un movimiento específico
   */
  async getLogByMovimiento(movimientoId) {
    try {
      const { data, error } = await supabase
        .from('recurrencias_log')
        .select('*')
        .eq('movimiento_origen_id', movimientoId)
        .order('fecha_programada', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[recurrenciaService] Error fetching log:', error);
      return [];
    }
  }
};
