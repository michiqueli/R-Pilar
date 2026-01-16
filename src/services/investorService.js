import { supabase } from '@/lib/customSupabaseClient';

export const investorService = {
  // Get all investors
  async getInvestors() {
    try {
      const { data: investors, error } = await supabase
        .from('inversionistas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: investors };
    } catch (error) {
      console.error('Error in getInvestors:', error);
      return { success: false, error: error.message };
    }
  },

  // Get single investor by ID
  async getInvestorById(id) {
    try {
      const { data, error } = await supabase
        .from('inversionistas')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error in getInvestorById:', error);
      return { success: false, error: error.message };
    }
  },

  // Create new investor
  async createInvestor(investorData) {
    try {
      if (!investorData.nombre) throw new Error('El nombre es obligatorio');

      const { data, error } = await supabase
        .from('inversionistas')
        .insert([{
          nombre: investorData.nombre,
          email: investorData.email,
          telefono: investorData.telefono,
          notas: investorData.notas,
          estado: investorData.estado || 'activo',
          updated_at: new Date()
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error in createInvestor:', error);
      return { success: false, error: error.message };
    }
  },

  // Update existing investor
  async updateInvestor(id, investorData) {
    try {
      const { data, error } = await supabase
        .from('inversionistas')
        .update({
          nombre: investorData.nombre,
          email: investorData.email,
          telefono: investorData.telefono,
          notas: investorData.notas,
          estado: investorData.estado,
          updated_at: new Date()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error in updateInvestor:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete investor
  async deleteInvestor(id) {
    try {
      const { error } = await supabase
        .from('inversionistas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error in deleteInvestor:', error);
      return { success: false, error: error.message };
    }
  },

  // Create a new investment movement
  createInvestmentMovement: async (payload) => {
    try {
      // Ensure payload matches table structure exactly
      // Table columns: project_id, inversionista_id, cuenta_destino, tipo, fecha, monto_ars, cotizacion_usd, monto_usd, estado, notas
      
      const { data, error } = await supabase
        .from('inversiones_movimientos')
        .insert([payload])
        .select()
        .single();
    
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating investment movement:', error);
      throw error;
    }
  },

  // Get investments for a specific project
  async getProjectInvestments(projectId) {
    try {
      // Query the new table 'inversiones_movimientos'
      const { data, error } = await supabase
        .from('inversiones_movimientos')
        .select(`
          id,
          tipo,
          monto_ars,
          monto_usd,
          fecha,
          estado,
          notas,
          inversionista_id,
          inversionistas ( nombre )
        `)
        .eq('project_id', projectId)
        .order('fecha', { ascending: false });

      if (error) throw error;

      // Normalize data for UI
      const normalizedData = (data || []).map(item => {
        // Map database types to UI types
        // DB: 'INGRESO', 'DEVOLUCION'
        // UI: 'INVERSION_RECIBIDA', 'DEVOLUCION_INVERSION'
        let type = 'UNKNOWN';
        if (item.tipo === 'INGRESO') type = 'INVERSION_RECIBIDA';
        if (item.tipo === 'DEVOLUCION') type = 'DEVOLUCION_INVERSION';

        return {
          id: item.id,
          type: type,
          amount: item.monto_ars,
          usd_amount: item.monto_usd,
          date: item.fecha,
          investor: item.inversionistas?.nombre || 'Desconocido',
          description: item.notas,
          status: item.estado
        };
      });

      return normalizedData;
    } catch (error) {
      console.error('Error fetching project investments:', error);
      throw error;
    }
  },
  
  // Helper to link investor to project (kept for compatibility if needed, though schema handles it via FK)
  async linkInvestorToProject(investorId, projectId) {
      // Implementation depends on if there's a join table or just implicit via movements.
      // Assuming implicit via movements or separate table 'inversionista_proyectos'
      try {
          const { error } = await supabase
              .from('inversionista_proyectos')
              .insert([{ inversionista_id: investorId, project_id: projectId }]);
          
          if (error && error.code !== '23505') { // Ignore duplicate key errors
              console.error("Error linking investor:", error);
          }
      } catch (e) {
          console.warn("Link investor failed (might already exist):", e);
      }
  },

  async getInvestorProjects(investorId) {
      try {
          const { data, error } = await supabase
              .from('inversionista_proyectos')
              .select('project_id')
              .eq('inversionista_id', investorId);
          
          if (error) throw error;
          return data.map(d => ({ id: d.project_id }));
      } catch (e) {
          return [];
      }
  }
};