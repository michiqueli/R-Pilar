
import { supabase } from '@/lib/customSupabaseClient';

export const workItemService = {
  async getWorkItems(projectId) {
    if (!projectId) return [];
    const { data, error } = await supabase
      .from('work_items')
      .select('id, name, description, weight, estimated_budget, progress, order, status, is_system, project_id, budget')
      .eq('project_id', projectId)
      .order('order', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async createWorkItem(projectId, item) {
    // Get max order to append
    const { data: maxOrderData } = await supabase
      .from('work_items')
      .select('order')
      .eq('project_id', projectId)
      .order('order', { ascending: false })
      .limit(1);
    
    const nextOrder = (maxOrderData?.[0]?.order || 0) + 1;

    const { data, error } = await supabase
      .from('work_items')
      .insert([{
        project_id: projectId,
        name: item.name,
        description: item.description,
        weight: item.weight || 1,
        estimated_budget: item.estimated_budget || 0,
        progress: item.progress || 0,
        status: 'active', // Ensure default status
        order: nextOrder
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateWorkItem(id, updates) {
    const { data, error } = await supabase
      .from('work_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
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
  },

  async updateOrder(items) {
    const updates = items.map(item => 
      supabase.from('work_items').update({ order: item.order }).eq('id', item.id)
    );
    await Promise.all(updates);
  },

  async getTemplates() {
    const { data, error } = await supabase
      .from('work_item_templates')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async applyTemplate(projectId, templateId) {
    const { data: template, error: tError } = await supabase
      .from('work_item_templates')
      .select('*')
      .eq('id', templateId)
      .maybeSingle();
    
    if (tError) throw tError;
    if (!template || !template.items) return;

    const newItems = template.items.map((item, index) => ({
      project_id: projectId,
      name: item.name,
      description: item.description,
      weight: item.weight || 1,
      estimated_budget: 0,
      progress: 0,
      status: 'active',
      order: index + 1
    }));

    if (newItems.length > 0) {
      const { error } = await supabase.from('work_items').insert(newItems);
      if (error) throw error;
    }
  },

  calculateCosts(workItemId, expenses) {
    if (!expenses) return { actual: 0 };
    const relatedExpenses = expenses.filter(e => e.work_item_id === workItemId && !e.is_deleted);
    const actual = relatedExpenses.reduce((sum, e) => sum + (parseFloat(e.amount_ars || e.amount || 0)), 0);
    return { actual };
  }
};
