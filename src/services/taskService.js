
import { supabase } from '@/lib/customSupabaseClient';

// Helper to sanitize dates
const toNullableDate = (dateStr) => {
  if (!dateStr || dateStr.trim() === '') return null;
  return dateStr;
};

export const taskService = {
  async getTasks({ projectId, estado }) {
    console.log(`📚 taskService: Fetching tasks for project ${projectId}`);
    try {
      let query = supabase
        .from('tareas')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (projectId) query = query.eq('proyecto_id', projectId);
      if (estado && estado !== 'TODAS') query = query.eq('estado', estado);

      const { data, error } = await query;
      
      if (error) {
        console.error("❌ taskService: Error fetching tasks:", error);
        throw error;
      }
      
      console.log(`✅ taskService: Found ${data?.length || 0} tasks`);
      return data || [];
    } catch (error) {
      console.error("💥 taskService: Unexpected error in getTasks", error);
      throw error;
    }
  },

  async createTask(task) {
    console.log("✨ taskService: Creating task:", task);
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('tareas')
        .insert([{
          nombre: task.title,
          descripcion: task.description,
          proyecto_id: task.project_id,
          asignado_a: task.assigned_to,
          fecha_vencimiento: toNullableDate(task.due_date), // FIX: Sanitize date
          estado: 'PENDIENTE',
          prioridad: task.priority || 'MEDIA',
          fecha_creacion: now,
          fecha_actualizacion: now
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("❌ taskService: Error creating task:", error);
      throw error;
    }
  },

  async updateTask(id, updates) {
    console.log(`✏️ taskService: Updating task ${id}:`, updates);
    try {
      const dbUpdates = {
        nombre: updates.title,
        descripcion: updates.description,
        proyecto_id: updates.project_id,
        asignado_a: updates.assigned_to,
        fecha_vencimiento: toNullableDate(updates.due_date), // FIX: Sanitize date
        estado: updates.status,
        prioridad: updates.priority,
        fecha_actualizacion: new Date().toISOString()
      };

      // Remove undefined keys
      Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);

      const { data, error } = await supabase
        .from('tareas')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("❌ taskService: Error updating task:", error);
      throw error;
    }
  },

  async deleteTask(id) {
    console.log(`🗑️ taskService: Deleting task ${id}`);
    try {
      const { error } = await supabase
        .from('tareas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("❌ taskService: Error deleting task:", error);
      throw error;
    }
  }
};
