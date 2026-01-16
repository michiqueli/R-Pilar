
import { supabase } from '@/lib/customSupabaseClient';

export const adjuntosService = {
  /**
   * Uploads a file to storage and creates a record in movimientos_adjuntos table
   * @param {File} file 
   * @param {string} movimientoId 
   */
  async uploadAdjunto(file, movimientoId) {
    console.log('[adjuntosService] Uploading file for movement:', movimientoId, file.name);

    // 1. Validate File
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de archivo no permitido. Solo PDF, JPG y PNG.');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('El archivo excede el tamaño máximo de 10MB.');
    }

    try {
      // 2. Upload to Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${movimientoId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('movimientos_comprobantes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('movimientos_comprobantes')
        .getPublicUrl(filePath);

      // 4. Save Metadata to DB
      const { data: adjunto, error: dbError } = await supabase
        .from('movimientos_adjuntos')
        .insert([{
          movimiento_id: movimientoId,
          archivo_url: publicUrl,
          archivo_nombre: file.name,
          archivo_tipo: file.type,
          archivo_tamano: file.size
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      console.log('[adjuntosService] Upload success:', adjunto);
      return adjunto;

    } catch (error) {
      console.error('[adjuntosService] Upload failed:', error);
      throw error;
    }
  },

  /**
   * Helper to upload file to storage without creating DB record yet (for new movements)
   */
  async uploadFileToStorageOnly(file) {
    console.log('[adjuntosService] Uploading temporary file:', file.name);
     // 1. Validate File
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de archivo no permitido. Solo PDF, JPG y PNG.');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('El archivo excede el tamaño máximo de 10MB.');
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `temp/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('movimientos_comprobantes')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('movimientos_comprobantes')
        .getPublicUrl(fileName);

      return {
        archivo_url: publicUrl,
        archivo_nombre: file.name,
        archivo_tipo: file.type,
        archivo_tamano: file.size
      };
    } catch (error) {
      console.error('[adjuntosService] Temp upload failed:', error);
      throw error;
    }
  },

  /**
   * Creates just the DB record for an already uploaded file
   */
  async createAdjuntoRecord(adjuntoData, movimientoId) {
    try {
      const { data, error } = await supabase
        .from('movimientos_adjuntos')
        .insert([{
          movimiento_id: movimientoId,
          archivo_url: adjuntoData.archivo_url,
          archivo_nombre: adjuntoData.archivo_nombre,
          archivo_tipo: adjuntoData.archivo_tipo,
          archivo_tamano: adjuntoData.archivo_tamano
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
       console.error('[adjuntosService] DB record creation failed:', error);
       throw error;
    }
  },

  /**
   * Fetches all attachments for a movement
   */
  async getAdjuntos(movimientoId) {
    try {
      const { data, error } = await supabase
        .from('movimientos_adjuntos')
        .select('*')
        .eq('movimiento_id', movimientoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[adjuntosService] Fetch failed:', error);
      throw error;
    }
  },

  /**
   * Deletes a single attachment
   */
  async deleteAdjunto(adjuntoId, archivoUrl) {
    console.log('[adjuntosService] Deleting adjunto:', adjuntoId);
    try {
      // 1. Delete from DB
      const { error: dbError } = await supabase
        .from('movimientos_adjuntos')
        .delete()
        .eq('id', adjuntoId);

      if (dbError) throw dbError;

      // 2. Delete from Storage
      if (archivoUrl) {
        // Extract path from URL
        const urlObj = new URL(archivoUrl);
        const path = urlObj.pathname.split('/movimientos_comprobantes/')[1];
        if (path) {
           const { error: storageError } = await supabase.storage
            .from('movimientos_comprobantes')
            .remove([decodeURIComponent(path)]);
           
           if (storageError) console.warn('Storage delete warning:', storageError);
        }
      }

      return true;
    } catch (error) {
      console.error('[adjuntosService] Delete failed:', error);
      throw error;
    }
  },

  /**
   * Deletes all attachments for a movement
   */
  async deleteAdjuntoByMovimiento(movimientoId) {
    try {
      const adjuntos = await this.getAdjuntos(movimientoId);
      for (const adj of adjuntos) {
        await this.deleteAdjunto(adj.id, adj.archivo_url);
      }
      return true;
    } catch (error) {
       console.error('[adjuntosService] Delete all failed:', error);
       throw error;
    }
  }
};
