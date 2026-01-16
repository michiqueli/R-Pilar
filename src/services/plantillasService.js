
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

  /**
   * Fetch all templates with full nested structure
   */
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

      // Sort nested items by 'orden'
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

  /**
   * Fetch single template by ID
   */
  async getPlantillaById(id) {
    if (!id) return null;
    try {
      console.log(`🔍 Fetching plantilla details for: ${id}`);
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

  /**
   * Create a new template header
   */
  async createPlantilla(data) {
    console.log("✨ Creating new plantilla:", data);
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
      console.log("✅ Plantilla created successfully:", newPlantilla.id);
      return newPlantilla;
    } catch (error) {
      console.error("❌ Error creating plantilla:", error);
      throw error;
    }
  },

  /**
   * Update an existing template
   */
  async updatePlantilla(id, data) {
    console.log(`✏️ Updating plantilla ${id}:`, data);
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
      console.log("✅ Plantilla updated successfully.");
      return updated;
    } catch (error) {
      console.error("❌ Error updating plantilla:", error);
      throw error;
    }
  },

  /**
   * Duplicate a template
   */
  async duplicatePlantilla(id) {
    console.log(`👯 Duplicating plantilla ${id}...`);
    try {
      // 1. Get original data (deep)
      const original = await this.getPlantillaById(id);
      if (!original) throw new Error("Plantilla original no encontrada");

      // 2. Create new header
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

      // 3. Duplicate items
      if (original.plantilla_partidas && original.plantilla_partidas.length > 0) {
        for (const partida of original.plantilla_partidas) {
          // Insert partida
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
          
          if (errPartida) {
             console.error("Error duplicating partida", errPartida);
             continue;
          }

          // Insert sub-partidas if they exist (Deep copy)
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

      console.log("✅ Plantilla duplicated successfully.");
      return newPlantilla;

    } catch (error) {
      console.error("❌ Error duplicating plantilla:", error);
      throw error;
    }
  },

  /**
   * Delete a template
   */
  async deletePlantilla(id) {
    console.log(`🗑️ Deleting plantilla ${id}...`);
    try {
      // Note: Cascade delete should handle children if foreign keys are set up with ON DELETE CASCADE.
      // If not, we'd need to manually delete children first. Assuming DB handles constraints or simple delete for now.
      const { error } = await supabase
        .from('plantillas_obra')
        .delete()
        .eq('id', id);

      if (error) throw error;
      console.log("✅ Plantilla deleted successfully.");
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
    console.log(`📋 Fetching partidas for plantilla: ${plantillaId}`);
    try {
      const { data, error } = await supabase
        .from('plantilla_partidas')
        .select('*')
        .eq('plantilla_id', plantillaId)
        .order('orden', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("❌ Error getting partidas:", error);
      return [];
    }
  },

  async addPartidaToPlantilla(plantillaId, data) {
    console.log(`➕ Adding partida to plantilla ${plantillaId}:`, data);
    try {
      // Get max order
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
      console.log("✅ Partida added successfully.");
      return newPartida;
    } catch (error) {
      console.error("❌ Error adding partida:", error);
      throw error;
    }
  },

  async updatePartidaPlantilla(id, data) {
    console.log(`✏️ Updating partida ${id}:`, data);
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
      console.log("✅ Partida updated successfully.");
      return updated;
    } catch (error) {
      console.error("❌ Error updating partida:", error);
      throw error;
    }
  },

  async deletePartidaPlantilla(id) {
    console.log(`🗑️ Deleting partida ${id}...`);
    try {
      const { error } = await supabase
        .from('plantilla_partidas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      console.log("✅ Partida deleted successfully.");
      return true;
    } catch (error) {
      console.error("❌ Error deleting partida:", error);
      throw error;
    }
  },

  // --------------------------------------------------------------------------------------------
  // APPLICATION LOGIC
  // --------------------------------------------------------------------------------------------

  // Core Logic: Apply a template to a project
  async loadPlantillaToProject(proyectoId, plantillaId) {
    console.log(`🚀 Loading plantilla ${plantillaId} into project ${proyectoId}...`);
    
    // 1. Get the template data
    const template = await this.getPlantillaById(plantillaId);
    if (!template) {
      throw new Error("Plantilla not found");
    }

    if (!template.plantilla_partidas || template.plantilla_partidas.length === 0) {
      console.warn("⚠️ Plantilla has no partidas to import.");
      return true;
    }

    // Sort partidas to ensure insertion order
    const sortedPartidas = template.plantilla_partidas.sort((a, b) => (a.orden || 0) - (b.orden || 0));

    try {
      // 2. Iterate and create items
      for (const tPartida of sortedPartidas) {
        
        // Create Work Item (Partida)
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

        if (errPartida) {
          console.error("❌ Error creating work_item from template:", errPartida);
          continue; 
        }

        // Create Subpartidas
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

          if (errSub) {
             console.error("❌ Error creating subpartidas from template:", errSub);
          }
        }
      }

      console.log("✅ Template loaded successfully.");
      return true;

    } catch (error) {
      console.error("❌ Error in loadPlantillaToProject:", error);
      throw error;
    }
  }
};
