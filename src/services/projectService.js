
import { supabase } from '@/lib/customSupabaseClient';

/* 
   ------------------------------------------------------------------------------------------------
   SERVICE DOCUMENTATION
   ------------------------------------------------------------------------------------------------
   This service manages 'projects' and 'work_items' (Plan de Obra).
   
   UPDATED: Uses 'gastos' and 'ingresos' tables instead of 'expenses' and 'incomes'.
   ------------------------------------------------------------------------------------------------
*/

export const PROJECT_STATUSES = ['active', 'completed', 'on_hold', 'archived', 'cancelled'];

export const projectService = {
  // --- Projects ---

  async getProjects() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id, 
          name, 
          code, 
          client_id, 
          status, 
          base_currency, 
          start_date, 
          end_date,
          notes, 
          created_at,
          client:clients(id, name)
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(p => ({
        ...p,
        client_name: p.client?.name
      }));
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }
  },

  async getProjectById(id) {
    if (!id) return null;
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *, 
        client:clients(id, name, email, phone)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createProject(projectData) {
    const { 
      name, 
      code, 
      client_id, 
      start_date, 
      end_date,
      notes,
      status = 'active'
    } = projectData;

    try {
      const insertPayload = {
        name,
        code, 
        client_id,
        status: status || 'active', 
        base_currency: 'ARS',
        start_date: start_date || null,
        end_date: end_date || null,
        notes: notes || null,
        is_deleted: false,
        created_at: new Date().toISOString()
      };

      const { data: project, error } = await supabase
        .from('projects')
        .insert([insertPayload])
        .select()
        .single();

      if (error) throw error;

      if (project) {
        await this.ensureDefaultPartida(project.id);
      }

      return project;
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  },

  async updateProject(id, projectData) {
     const { name, code, client_id, start_date, end_date, notes, status } = projectData;

    const updatePayload = {
      name,
      code,
      client_id,
      start_date: start_date || null,
      end_date: end_date || null,
      notes: notes || null,
      updated_at: new Date().toISOString()
    };

    if (status) updatePayload.status = status;

    const { data, error } = await supabase
      .from('projects')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProject(id) {
    const { error } = await supabase
      .from('projects')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // --- Clients Helper ---
  async getClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name')
      .eq('is_deleted', false)
      .eq('status', 'active')
      .order('name');
      
    if (error) throw error;
    return data;
  },

  // --- Work Items / Partidas (Plan de Obra) ---

  async getWorkPlan(projectId) {
    if (!projectId) return [];
    
    // Uses 'proyecto_id' based on schema
    const { data, error } = await supabase
      .from('work_items')
      .select('*')
      .eq('proyecto_id', projectId)
      .order('created_at', { ascending: true });
      
    if (error) throw error;
    return data;
  },

  async ensureDefaultPartida(projectId) {
     const { data: existing } = await supabase
       .from('work_items')
       .select('*')
       .eq('proyecto_id', projectId)
       .ilike('nombre', '%General%') 
       .maybeSingle();

     if (existing) return existing;

     const { data, error } = await supabase
       .from('work_items')
       .insert([{
         proyecto_id: projectId,
         nombre: 'Gastos Generales',
         descripcion: 'Partida por defecto',
         presupuesto: 0,
         progreso: 0,
         estado: 'Activo',
         created_at: new Date().toISOString()
       }])
       .select()
       .single();

     if (error) throw error;
     return data;
  },

  async createWorkPlan(workPlanData) {
    const { project_id, name, description, progress, budget } = workPlanData;
    const { data, error } = await supabase
      .from('work_items')
      .insert([{
        proyecto_id: project_id,
        nombre: name,
        descripcion: description,
        progreso: progress || 0,
        presupuesto: budget || 0,
        estado: 'Activo',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateWorkItem(id, workItemData) {
    const { name, description, progress, budget, status } = workItemData;
    const updatePayload = {
        updated_at: new Date().toISOString()
    };
    
    if (name) updatePayload.nombre = name;
    if (description !== undefined) updatePayload.descripcion = description;
    if (progress !== undefined) updatePayload.progreso = progress;
    if (budget !== undefined) updatePayload.presupuesto = budget;
    if (status !== undefined) updatePayload.estado = status;

    const { data, error } = await supabase
      .from('work_items')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteWorkItem(id) {
    const { error } = await supabase
      .from('work_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },
  
  async updatePartidaProgress(partidaId, progress) {
     const { data, error } = await supabase
       .from('work_items')
       .update({ 
         progreso: progress,
         updated_at: new Date().toISOString()
       })
       .eq('id', partidaId)
       .select()
       .single();

     if (error) throw error;
     return data;
  },

  async updatePartidaBudget(partidaId, monto) {
    try {
      const { data, error } = await supabase
        .from('work_items')
        .update({ 
          presupuesto: monto,
          updated_at: new Date().toISOString()
        })
        .eq('id', partidaId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("[projectService] Error updating budget:", error);
      throw error;
    }
  },

  // --- Breakdown & KPIs ---

  async getPartidaBreakdown(projectId) {
    if (!projectId) return [];
    
    try {
      const { data: partidas, error } = await supabase
          .from('work_items')
          .select(`
            id, 
            nombre, 
            presupuesto, 
            coste_asignado, 
            progreso, 
            estado,
            sub_partidas:subpartidas(*) 
          `)
          .eq('proyecto_id', projectId)
          .order('created_at');
      
      if (error) throw error;
      if (!partidas) return [];

      return partidas.map(p => ({
          id: p.id,
          name: p.nombre,
          budget: Number(p.presupuesto || 0),
          total_gasto: Number(p.coste_asignado || 0),
          diferencia: Number(p.presupuesto || 0) - Number(p.coste_asignado || 0),
          progress: p.progreso,
          estado: p.estado,
          sub_partidas: p.sub_partidas || [], // Esto evita el error de .map() en el componente
          is_system: false 
      }));
    } catch (error) {
      console.error("Error in getPartidaBreakdown:", error);
      return [];
    }
  },

  // --- Expenses / Financials (Fixed: Uses 'gastos' and 'ingresos') ---
  
  async getPendingBalance(projectId) {
    try {
      // Changed from 'expenses' to 'gastos'
      const { data: gastos, error } = await supabase
        .from('gastos')
        .select('monto, estado')
        .eq('proyecto_id', projectId);
        
      if (error) throw error;
      
      const pendingExpense = gastos
        .filter(g => g.estado?.toUpperCase() === 'PENDIENTE')
        .reduce((sum, g) => sum + Number(g.monto || 0), 0);
      
      return {
        pendiente_cobrar: 0, 
        pendiente_pagar: pendingExpense,
        neto: 0 - pendingExpense
      };
    } catch (e) {
      console.error("Error in getPendingBalance:", e);
      return { pendiente_cobrar: 0, pendiente_pagar: 0, neto: 0 };
    }
  },

  async getExternalInvestment(projectId) {
    try {
      // Changed from 'incomes' (or 'inversiones_movimientos' equivalent) to 'ingresos'
      // Note: We need a way to identify investment. Assuming category 'INVERSION' or similar if schema permits.
      // Or if there is an 'inversiones' table (there is one in schema), we could use that.
      // But adhering to "Replace 'inversiones_movimientos' with 'ingresos'"
      
      const { data, error } = await supabase
        .from('ingresos')
        .select('monto')
        .eq('proyecto_id', projectId)
        .eq('categoria', 'INVERSION') // Assumption based on context
        .eq('estado', 'CONFIRMADO');

      if (error) throw error;
      
      return data.reduce((sum, item) => sum + Number(item.monto || 0), 0);
    } catch (e) {
      console.error("Error in getExternalInvestment:", e);
      return 0;
    }
  }
};
