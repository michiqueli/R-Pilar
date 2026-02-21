
import { supabase } from '@/lib/customSupabaseClient';

/* 
   ------------------------------------------------------------------------------------------------
   SERVICE: plantillasService
   Manages the templates system (Plantillas de Obra).
   ------------------------------------------------------------------------------------------------
*/

export const plantillasService = {

  // --------------------------------------------------------------------------------------------
  // PLANTILLAS (HEADERS)
  // --------------------------------------------------------------------------------------------

  async getPlantillas() {
    try {
      console.log("📚 Fetching plantillas...");
      const { data, error } = await supabase
        .from('plantillas_obra')
        .select(`
          *,
          plantilla_partidas (
            *,
            plantilla_sub_partidas (*)
          )
        `)
        .order('nombre');

      if (error) {
        console.error("❌ Error fetching plantillas:", error);
        return [];
      }

      if (data) {
        data.forEach(plantilla => {
          if (plantilla.plantilla_partidas) {
            plantilla.plantilla_partidas.sort((a, b) => (a.orden || 0) - (b.orden || 0));
            plantilla.plantilla_partidas.forEach(partida => {
              if (partida.plantilla_sub_partidas) {
                partida.plantilla_sub_partidas.sort((a, b) => (a.orden || 0) - (b.orden || 0));
              }
            });
          }
        });
      }

      console.log(`✅ Loaded ${data.length} plantillas.`);
      return data || [];
    } catch (err) {
      console.error("💥 Unexpected error in getPlantillas:", err);
      return [];
    }
  },

  async getPlantillaById(id) {
    if (!id) return null;
    try {
      const { data, error } = await supabase
        .from('plantillas_obra')
        .select(`
          *,
          plantilla_partidas (
            *,
            plantilla_sub_partidas (*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error(`❌ Error fetching plantilla ${id}:`, err);
      return null;
    }
  },

  async createPlantilla(data) {
    try {
      const { data: newPlantilla, error } = await supabase
        .from('plantillas_obra')
        .insert([{
          nombre: data.nombre,
          descripcion: data.descripcion,
          categoria: data.categoria || 'OTROS',
          icono: data.icono || '📋'
        }])
        .select()
        .single();
      
      if (error) throw error;
      return newPlantilla;
    } catch (error) {
      console.error("❌ Error creating plantilla:", error);
      throw error;
    }
  },

  async updatePlantilla(id, data) {
    try {
      const { data: updated, error } = await supabase
        .from('plantillas_obra')
        .update({
          nombre: data.nombre,
          descripcion: data.descripcion,
          categoria: data.categoria,
          icono: data.icono,
          updated_at: new Date()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    } catch (error) {
      console.error("❌ Error updating plantilla:", error);
      throw error;
    }
  },

  async duplicatePlantilla(id) {
    try {
      const original = await this.getPlantillaById(id);
      if (!original) throw new Error("Plantilla original no encontrada");

      const { data: newPlantilla, error: errHead } = await supabase
        .from('plantillas_obra')
        .insert([{
          nombre: `${original.nombre} (Copia)`,
          descripcion: original.descripcion,
          categoria: original.categoria,
          icono: original.icono
        }])
        .select()
        .single();
      
      if (errHead) throw errHead;

      if (original.plantilla_partidas && original.plantilla_partidas.length > 0) {
        for (const partida of original.plantilla_partidas) {
          const { data: newPartida, error: errPartida } = await supabase
            .from('plantilla_partidas')
            .insert({
              plantilla_id: newPlantilla.id,
              nombre: partida.nombre,
              descripcion: partida.descripcion,
              orden: partida.orden,
              presupuesto_base: partida.presupuesto_base
            })
            .select()
            .single();
          
          if (errPartida) { console.error("Error duplicating partida", errPartida); continue; }

          if (partida.plantilla_sub_partidas && partida.plantilla_sub_partidas.length > 0) {
             const subsToInsert = partida.plantilla_sub_partidas.map(sub => ({
                plantilla_partida_id: newPartida.id,
                nombre: sub.nombre,
                descripcion: sub.descripcion,
                orden: sub.orden,
                presupuesto_base: sub.presupuesto_base
             }));

             const { error: errSub } = await supabase
                .from('plantilla_sub_partidas')
                .insert(subsToInsert);
             
             if (errSub) console.error("Error duplicating sub-partidas", errSub);
          }
        }
      }

      return newPlantilla;
    } catch (error) {
      console.error("❌ Error duplicating plantilla:", error);
      throw error;
    }
  },

  async deletePlantilla(id) {
    try {
      const { error } = await supabase
        .from('plantillas_obra')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("❌ Error deleting plantilla:", error);
      throw error;
    }
  },

  // --------------------------------------------------------------------------------------------
  // PARTIDAS (ITEMS)
  // --------------------------------------------------------------------------------------------

  async getPartidasByPlantilla(plantillaId) {
    try {
      const { data, error } = await supabase
        .from('plantilla_partidas')
        .select(`
          *,
          plantilla_sub_partidas (*)
        `)
        .eq('plantilla_id', plantillaId)
        .order('orden', { ascending: true });

      if (error) throw error;

      // Sort sub-partidas
      if (data) {
        data.forEach(partida => {
          if (partida.plantilla_sub_partidas) {
            partida.plantilla_sub_partidas.sort((a, b) => (a.orden || 0) - (b.orden || 0));
          }
        });
      }

      return data || [];
    } catch (error) {
      console.error("❌ Error getting partidas:", error);
      return [];
    }
  },

  async addPartidaToPlantilla(plantillaId, data) {
    try {
      const { data: existing } = await supabase
        .from('plantilla_partidas')
        .select('orden')
        .eq('plantilla_id', plantillaId)
        .order('orden', { ascending: false })
        .limit(1);
      
      const nextOrder = existing && existing.length > 0 ? (existing[0].orden + 1) : 1;

      const { data: newPartida, error } = await supabase
        .from('plantilla_partidas')
        .insert([{
          plantilla_id: plantillaId,
          nombre: data.nombre,
          descripcion: data.descripcion,
          orden: nextOrder
        }])
        .select()
        .single();

      if (error) throw error;
      return newPartida;
    } catch (error) {
      console.error("❌ Error adding partida:", error);
      throw error;
    }
  },

  async updatePartidaPlantilla(id, data) {
    try {
      const { data: updated, error } = await supabase
        .from('plantilla_partidas')
        .update({
          nombre: data.nombre,
          descripcion: data.descripcion,
          updated_at: new Date()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    } catch (error) {
      console.error("❌ Error updating partida:", error);
      throw error;
    }
  },

  async deletePartidaPlantilla(id) {
    try {
      const { error } = await supabase
        .from('plantilla_partidas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("❌ Error deleting partida:", error);
      throw error;
    }
  },

  // --------------------------------------------------------------------------------------------
  // SUB-PARTIDAS (NEW)
  // --------------------------------------------------------------------------------------------

  /**
   * Get sub-partidas for a specific partida
   */
  async getSubPartidasByPartida(partidaId) {
    try {
      const { data, error } = await supabase
        .from('plantilla_sub_partidas')
        .select('*')
        .eq('plantilla_partida_id', partidaId)
        .order('orden', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("❌ Error getting sub-partidas:", error);
      return [];
    }
  },

  /**
   * Add a sub-partida to a partida
   */
  async addSubPartida(partidaId, data) {
    try {
      // Get max order
      const { data: existing } = await supabase
        .from('plantilla_sub_partidas')
        .select('orden')
        .eq('plantilla_partida_id', partidaId)
        .order('orden', { ascending: false })
        .limit(1);
      
      const nextOrder = existing && existing.length > 0 ? (existing[0].orden + 1) : 1;

      const { data: newSub, error } = await supabase
        .from('plantilla_sub_partidas')
        .insert([{
          plantilla_partida_id: partidaId,
          nombre: data.nombre,
          descripcion: data.descripcion || null,
          presupuesto_base: parseFloat(data.presupuesto_base) || 0,
          orden: nextOrder
        }])
        .select()
        .single();

      if (error) throw error;
      return newSub;
    } catch (error) {
      console.error("❌ Error adding sub-partida:", error);
      throw error;
    }
  },

  /**
   * Update a sub-partida
   */
  async updateSubPartida(id, data) {
    try {
      const updatePayload = {
        nombre: data.nombre,
        updated_at: new Date()
      };
      if (data.descripcion !== undefined) updatePayload.descripcion = data.descripcion;
      if (data.presupuesto_base !== undefined) updatePayload.presupuesto_base = parseFloat(data.presupuesto_base) || 0;

      const { data: updated, error } = await supabase
        .from('plantilla_sub_partidas')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    } catch (error) {
      console.error("❌ Error updating sub-partida:", error);
      throw error;
    }
  },

  /**
   * Delete a sub-partida
   */
  async deleteSubPartida(id) {
    try {
      const { error } = await supabase
        .from('plantilla_sub_partidas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("❌ Error deleting sub-partida:", error);
      throw error;
    }
  },

  // --------------------------------------------------------------------------------------------
  // APPLICATION LOGIC
  // --------------------------------------------------------------------------------------------

  async loadPlantillaToProject(proyectoId, plantillaId) {
    const template = await this.getPlantillaById(plantillaId);
    if (!template) throw new Error("Plantilla not found");

    if (!template.plantilla_partidas || template.plantilla_partidas.length === 0) {
      return true;
    }

    const sortedPartidas = template.plantilla_partidas.sort((a, b) => (a.orden || 0) - (b.orden || 0));

    try {
      for (const tPartida of sortedPartidas) {
        const { data: newPartida, error: errPartida } = await supabase
          .from('work_items')
          .insert({
            proyecto_id: proyectoId,
            nombre: tPartida.nombre,
            descripcion: tPartida.descripcion,
            presupuesto: tPartida.presupuesto_base || 0,
            coste_asignado: 0,
            progreso: 0,
            estado: 'Activo',
          })
          .select()
          .single();

        if (errPartida) { console.error("❌ Error creating work_item:", errPartida); continue; }

        if (tPartida.plantilla_sub_partidas && tPartida.plantilla_sub_partidas.length > 0) {
          const sortedSub = tPartida.plantilla_sub_partidas.sort((a, b) => (a.orden || 0) - (b.orden || 0));
          
          const subItemsPayload = sortedSub.map(tSub => ({
            partida_id: newPartida.id,
            nombre: tSub.nombre,
            presupuesto: tSub.presupuesto_base || 0,
            avance_pct: 0,
            costo_acumulado: 0,
            orden: tSub.orden
          }));

          const { error: errSub } = await supabase
            .from('subpartidas')
            .insert(subItemsPayload);

          if (errSub) console.error("❌ Error creating subpartidas:", errSub);
        }
      }

      return true;
    } catch (error) {
      console.error("❌ Error in loadPlantillaToProject:", error);
      throw error;
    }
  }
};
