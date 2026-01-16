
import { supabase } from '@/lib/customSupabaseClient';

export const partidasService = {
  /**
   * Fetch Partidas (Work Items) for a specific project
   * Maps 'partidas' concept to 'work_items' table
   */
  async getPartidasByProyecto(proyectoId) {
    if (!proyectoId) return [];
    console.log('Fetching partidas for project:', proyectoId);

    try {
      // Using work_items table as 'Partidas'
      const { data, error } = await supabase
        .from('work_items')
        .select('*')
        .eq('proyecto_id', proyectoId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching partidas:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Unexpected error in getPartidasByProyecto:', error);
      return [];
    }
  },

  /**
   * Fetch Subpartidas for a specific partida
   */
  async getSubpartidasByPartida(partidaId) {
    if (!partidaId) return [];
    console.log('Fetching subpartidas for partida:', partidaId);

    try {
      const { data, error } = await supabase
        .from('subpartidas')
        .select('*')
        .eq('partida_id', partidaId)
        .order('orden', { ascending: true });

      if (error) {
        console.error('Error fetching subpartidas:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Unexpected error in getSubpartidasByPartida:', error);
      return [];
    }
  },

  /**
   * Get single Partida by ID
   */
  async getPartidaById(partidaId) {
    if (!partidaId) return null;
    try {
      const { data, error } = await supabase
        .from('work_items')
        .select('*')
        .eq('id', partidaId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching partida:', error);
      return null;
    }
  },

  /**
   * Get single Subpartida by ID
   */
  async getSubpartidaById(subpartidaId) {
    if (!subpartidaId) return null;
    try {
      const { data, error } = await supabase
        .from('subpartidas')
        .select('*')
        .eq('id', subpartidaId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching subpartida:', error);
      return null;
    }
  }
};
