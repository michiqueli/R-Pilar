import { supabase } from '@/lib/customSupabaseClient';

/**
 * Service para importación masiva de movimientos.
 * Valida, previsualiza y crea movimientos en bulk.
 */
export const importMovimientosService = {

  /**
   * Valida una fila de datos importados y retorna errores por campo
   */
  validateRow(row, index, { accounts = [], projects = [], providers = [] } = {}) {
    const errors = {};

    // Descripción obligatoria
    if (!row.descripcion || row.descripcion.trim() === '') {
      errors.descripcion = 'Descripción requerida';
    }

    // Importe obligatorio y numérico
    const importe = parseFloat(row.monto_ars);
    if (!row.monto_ars || isNaN(importe) || importe <= 0) {
      errors.monto_ars = 'Importe debe ser un número mayor a 0';
    }

    // Tipo válido
    const tiposValidos = ['GASTO', 'INGRESO', 'INVERSION', 'DEVOLUCION'];
    if (row.tipo && !tiposValidos.includes(row.tipo.toUpperCase())) {
      errors.tipo = `Tipo inválido. Usar: ${tiposValidos.join(', ')}`;
    }

    // Fecha válida si se proporciona
    if (row.fecha) {
      const date = new Date(row.fecha);
      if (isNaN(date.getTime())) {
        errors.fecha = 'Formato de fecha inválido (usar YYYY-MM-DD o DD/MM/YYYY)';
      }
    }

    // Validar cuenta si se proporciona
    if (row.cuenta && accounts.length > 0) {
      const found = accounts.find(a =>
        a.titulo.toLowerCase() === row.cuenta.toLowerCase() ||
        a.id === row.cuenta
      );
      if (!found) {
        errors.cuenta = `Cuenta "${row.cuenta}" no encontrada`;
      }
    }

    // Validar proyecto si se proporciona
    if (row.proyecto && projects.length > 0) {
      const found = projects.find(p =>
        p.name.toLowerCase() === row.proyecto.toLowerCase() ||
        p.id === row.proyecto
      );
      if (!found) {
        errors.proyecto = `Proyecto "${row.proyecto}" no encontrado`;
      }
    }

    return {
      rowIndex: index,
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  /**
   * Valida un array completo de filas
   */
  validateAll(rows, catalogs) {
    return rows.map((row, index) => ({
      ...row,
      _validation: this.validateRow(row, index, catalogs)
    }));
  },

  /**
   * Parsea fecha en múltiples formatos
   */
  parseDate(dateStr) {
    if (!dateStr) return null;

    // Formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

    // Formato DD/MM/YYYY
    const ddmmyyyy = dateStr.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Formato MM/DD/YYYY
    const mmddyyyy = dateStr.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
    if (mmddyyyy) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    }

    return null;
  },

  /**
   * Resuelve IDs de catálogos a partir de nombres
   */
  resolveIds(row, { accounts = [], projects = [], providers = [] }) {
    const resolved = { ...row };

    // Resolver cuenta
    if (row.cuenta && typeof row.cuenta === 'string') {
      const acc = accounts.find(a =>
        a.titulo.toLowerCase() === row.cuenta.toLowerCase()
      );
      resolved.cuenta_id = acc?.id || null;
    }

    // Resolver proyecto
    if (row.proyecto && typeof row.proyecto === 'string') {
      const proj = projects.find(p =>
        p.name.toLowerCase() === row.proyecto.toLowerCase()
      );
      resolved.proyecto_id = proj?.id || null;
    }

    // Resolver proveedor
    if (row.proveedor && typeof row.proveedor === 'string') {
      const prov = providers.find(p =>
        p.name.toLowerCase() === row.proveedor.toLowerCase()
      );
      resolved.proveedor_id = prov?.id || null;
    }

    return resolved;
  },

  /**
   * Importa movimientos masivamente
   * @param {Array} rows - Filas validadas y resueltas
   * @param {string} defaultProjectId - Proyecto destino por defecto
   * @param {string} defaultCuentaId - Cuenta por defecto (opcional)
   */
  async bulkCreate(rows, defaultProjectId = null, defaultCuentaId = null) {
    try {
      const today = new Date().toISOString().split('T')[0];

      const payloads = rows.map(row => ({
        tipo: (row.tipo || 'GASTO').toUpperCase(),
        descripcion: row.descripcion.trim(),
        fecha: this.parseDate(row.fecha) || today,
        estado: 'PENDIENTE',
        cuenta_id: row.cuenta_id || defaultCuentaId || null,
        proyecto_id: row.proyecto_id || defaultProjectId || null,
        proveedor_id: row.proveedor_id || null,
        monto_ars: parseFloat(row.monto_ars) || 0,
        valor_usd: parseFloat(row.valor_usd) || 0,
        monto_usd: parseFloat(row.monto_usd) || 0,
        iva_incluido: false,
        iva_porcentaje: 0,
        neto: parseFloat(row.monto_ars) || 0,
        notas: row.notas || null
      }));

      // Insert en bloques de 50 para evitar timeout
      const BATCH_SIZE = 50;
      const results = [];

      for (let i = 0; i < payloads.length; i += BATCH_SIZE) {
        const batch = payloads.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabase
          .from('inversiones')
          .insert(batch)
          .select('id');

        if (error) throw error;
        results.push(...(data || []));
      }

      // Si hay proyecto por defecto, vincular en tabla intermedia
      if (defaultProjectId) {
        const links = results.map(r => ({
          movimiento_id: r.id,
          project_id: defaultProjectId
        }));

        for (let i = 0; i < links.length; i += BATCH_SIZE) {
          const batch = links.slice(i, i + BATCH_SIZE);
          await supabase
            .from('movimientos_proyecto')
            .upsert(batch, { onConflict: 'movimiento_id,project_id' });
        }
      }

      return { success: true, count: results.length, ids: results.map(r => r.id) };
    } catch (error) {
      console.error('[importMovimientosService] Error en bulkCreate:', error);
      throw error;
    }
  },

  /**
   * Actualización masiva de campo(s) en múltiples movimientos
   */
  async bulkUpdate(movimientoIds, updateData) {
    try {
      const { data, error } = await supabase
        .from('inversiones')
        .update(updateData)
        .in('id', movimientoIds)
        .select('id');

      if (error) throw error;
      return { success: true, count: data?.length || 0 };
    } catch (error) {
      console.error('[importMovimientosService] Error en bulkUpdate:', error);
      throw error;
    }
  },

  /**
   * Genera la plantilla CSV de ejemplo para descarga
   */
  getTemplateCSV() {
    const headers = ['descripcion', 'monto_ars', 'tipo', 'fecha', 'cuenta', 'proyecto', 'proveedor', 'notas'];
    const example = ['Compra de materiales', '50000', 'GASTO', '2025-01-15', 'Cuenta Principal', 'Mi Proyecto', 'Proveedor X', 'Notas opcionales'];
    return [headers.join(','), example.join(',')].join('\n');
  }
};
