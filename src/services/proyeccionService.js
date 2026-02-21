import { supabase } from '@/lib/customSupabaseClient';

/**
 * Service para gestionar Proyecciones (ex "Costes")
 * Lista simple de gastos estimados por proyecto, de carga manual.
 */
export const proyeccionService = {

  /**
   * Obtiene todas las proyecciones de un proyecto
   */
  async getByProject(projectId) {
    try {
      const { data, error } = await supabase
        .from('proyecciones')
        .select('*')
        .eq('proyecto_id', projectId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[proyeccionService] Error fetching proyecciones:', error);
      throw error;
    }
  },

  /**
   * Obtiene el total estimado de un proyecto (para KPI)
   */
  async getTotalEstimado(projectId) {
    try {
      const items = await this.getByProject(projectId);
      return items.reduce((sum, item) => sum + Number(item.importe || 0), 0);
    } catch (error) {
      console.error('[proyeccionService] Error calculating total:', error);
      return 0;
    }
  },

  /**
   * Crea una nueva proyección
   */
  async create(data) {
    try {
      const { data: result, error } = await supabase
        .from('proyecciones')
        .insert([{
          proyecto_id: data.proyecto_id,
          titulo: data.titulo,
          importe: parseFloat(data.importe) || 0,
          notas: data.notas || null
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('[proyeccionService] Error creating proyeccion:', error);
      throw error;
    }
  },

  /**
   * Actualiza una proyección existente
   */
  async update(id, data) {
    try {
      const { data: result, error } = await supabase
        .from('proyecciones')
        .update({
          titulo: data.titulo,
          importe: parseFloat(data.importe) || 0,
          notas: data.notas || null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('[proyeccionService] Error updating proyeccion:', error);
      throw error;
    }
  },

  /**
   * Eliminación lógica
   */
  async delete(id) {
    try {
      const { error } = await supabase
        .from('proyecciones')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[proyeccionService] Error deleting proyeccion:', error);
      throw error;
    }
  }
};
