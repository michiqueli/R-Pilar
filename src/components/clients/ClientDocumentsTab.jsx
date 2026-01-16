
import React, { useState, useEffect } from 'react';
import { Plus, FileText, Download, Trash2, Eye, File } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import ClientDocumentModal from './ClientDocumentModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ClientDocumentsTab = ({ clientId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_documents')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los documentos' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) fetchDocuments();
  }, [clientId]);

  const handleDelete = async (doc) => {
    if (!window.confirm('¿Estás seguro de eliminar este documento?')) return;
    try {
      // 1. Delete from storage if path exists
      if (doc.storage_path) {
         const { error: storageError } = await supabase.storage.from('documents').remove([doc.storage_path]);
         if (storageError) console.error("Storage delete error:", storageError);
      }
      
      // 2. Delete DB record
      const { error } = await supabase.from('client_documents').delete().eq('id', doc.id);
      if (error) throw error;

      toast({ title: 'Éxito', description: 'Documento eliminado' });
      fetchDocuments();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Documentación</h3>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="rounded-full shadow-sm"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Subir Documento
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
           <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
           <p className="text-slate-500">No hay documentos subidos</p>
        </div>
      ) : (
        <div className="overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Documento</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoría</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                        <File className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white line-clamp-1 max-w-[200px]" title={doc.title}>
                        {doc.title}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {doc.category || 'Otro'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                    {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: es })}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a 
                        href={doc.file_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver / Descargar"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button 
                        onClick={() => handleDelete(doc)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ClientDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchDocuments}
        clientId={clientId}
      />
    </div>
  );
};

export default ClientDocumentsTab;
