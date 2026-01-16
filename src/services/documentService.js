
import { supabase } from '@/lib/customSupabaseClient';

export const documentService = {
  
  async uploadDocument({ file, title, type, clientId, projectId, visibleInClient }) {
    // 1. Upload to Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    // Organize by project or client if possible, otherwise flat or date-based
    const path = projectId ? `projects/${projectId}/${fileName}` : (clientId ? `clients/${clientId}/${fileName}` : `general/${fileName}`);
    
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(path, file);

    if (uploadError) throw uploadError;

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(path);

    // 3. Create DB Record
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error: dbError } = await supabase
      .from('documents')
      .insert([
        {
          title,
          type,
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          client_id: clientId || null,
          project_id: projectId || null,
          visible_in_client: visibleInClient || false,
          uploaded_by: user?.id
        }
      ])
      .select()
      .single();

    if (dbError) throw dbError;
    return data;
  },

  async getDocuments({ clientId, projectId, includeClientVisible = false }) {
    // Removed the invalid relationship 'uploaded_by_user:uploaded_by(...)'
    // because there is no foreign key constraint on 'uploaded_by' to auth.users in the public schema provided.
    let query = supabase
      .from('documents')
      .select(`*`) 
      .order('created_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    } else if (clientId) {
      if (includeClientVisible) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.eq('client_id', clientId);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return data;
  },

  async deleteDocument(id) {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  downloadDocument(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
