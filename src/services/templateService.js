
import { supabase } from '@/lib/customSupabaseClient';

export const templateService = {
  async getTemplates() {
    // Get both predefined and user's custom templates
    const { data: { user } } = await supabase.auth.getUser();
    
    let query = supabase
      .from('templates')
      .select(`
        *,
        items:template_items(*)
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
      
    // If we want to filter strictly by user OR predefined, we can do logic here
    // Currently RLS policy is open, but good practice to filter in query if needed
    
    const { data, error } = await query;
    if (error) throw error;
    
    // Sort items by order
    data.forEach(t => {
      if (t.items) t.items.sort((a, b) => (a.order || 0) - (b.order || 0));
    });

    return data;
  },

  async getPredefinedTemplates() {
    const { data, error } = await supabase
      .from('templates')
      .select('*, items:template_items(*)')
      .eq('is_predefined', true)
      .eq('is_deleted', false);
      
    if (error) throw error;
    return data;
  },
  
  async getCustomTemplates(userId) {
     if (!userId) return [];
     const { data, error } = await supabase
      .from('templates')
      .select('*, items:template_items(*)')
      .eq('user_id', userId)
      .eq('is_deleted', false);
      
    if (error) throw error;
    return data;
  },

  async createTemplate(templateData) {
    const { name, type, items, user_id } = templateData;
    
    // 1. Create Template
    const { data: template, error: tmplError } = await supabase
      .from('templates')
      .insert([{
        name,
        type,
        is_predefined: false,
        user_id,
        is_deleted: false
      }])
      .select()
      .single();
      
    if (tmplError) throw tmplError;
    
    // 2. Create Items
    if (items && items.length > 0) {
      const itemsToInsert = items.map((item, index) => ({
        template_id: template.id,
        name: item.name,
        description: item.description,
        order: index + 1
      }));
      
      const { error: itemsError } = await supabase
        .from('template_items')
        .insert(itemsToInsert);
        
      if (itemsError) throw itemsError;
    }
    
    return template;
  },

  async updateTemplate(id, templateData) {
    const { name, type, items } = templateData;
    
    // 1. Update Template
    const { error: tmplError } = await supabase
      .from('templates')
      .update({ name, type, updated_at: new Date() })
      .eq('id', id);
      
    if (tmplError) throw tmplError;
    
    // 2. Replace Items (Delete all and re-insert is simplest for this scope)
    const { error: delError } = await supabase
      .from('template_items')
      .delete()
      .eq('template_id', id);
      
    if (delError) throw delError;
    
    if (items && items.length > 0) {
      const itemsToInsert = items.map((item, index) => ({
        template_id: id,
        name: item.name,
        description: item.description,
        order: index + 1
      }));
      
      const { error: itemsError } = await supabase
        .from('template_items')
        .insert(itemsToInsert);
        
      if (itemsError) throw itemsError;
    }
    
    return true;
  },

  async deleteTemplate(id) {
    const { error } = await supabase
      .from('templates')
      .update({ is_deleted: true })
      .eq('id', id);
      
    if (error) throw error;
    return true;
  }
};
