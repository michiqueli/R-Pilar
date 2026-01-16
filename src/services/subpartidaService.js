
import { supabase } from '@/lib/customSupabaseClient';

export const subpartidaService = {
  /**
   * Create a new subpartida
   */
  async createSubpartida(data) {
    const { data: newSub, error } = await supabase
      .from('subpartidas')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return newSub;
  },

  /**
   * Get subpartidas for a specific parent partida
   */
  async getSubpartidas(partidaId) {
    if (!partidaId) return [];
    
    const { data, error } = await supabase
      .from('subpartidas')
      .select('*')
      .eq('partida_id', partidaId)
      .order('id', { ascending: true }); // Using ID or specific order column

    if (error) throw error;
    return data || [];
  },

  /**
   * Update subpartida
   */
  async updateSubpartida(id, updates) {
    const { data, error } = await supabase
      .from('subpartidas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete subpartida
   */
  async deleteSubpartida(id) {
    const { error } = await supabase
      .from('subpartidas')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};
