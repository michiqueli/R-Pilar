import { supabase } from '@/lib/customSupabaseClient';

export const cuentasService = {
  async getCuentasActivas() {
    try {
      // Fetch active accounts. Assuming 'estado' column exists or just fetching all non-deleted
      const { data, error } = await supabase
        .from('cuentas')
        .select('*')
        .eq('is_deleted', false)
        // If 'estado' column exists and you use 'ACTIVA' or 'activa', add filter here:
        // .eq('estado', 'activa') 
        .order('titulo', { ascending: true });

      if (error) {
        console.error("Error fetching active accounts:", error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error("Error in getCuentasActivas:", error);
      return [];
    }
  },

  async getCuentaById(id) {
    try {
      const { data, error } = await supabase
        .from('cuentas')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error("Error fetching account by ID:", error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error("Error in getCuentaById:", error);
      return null;
    }
  }
};