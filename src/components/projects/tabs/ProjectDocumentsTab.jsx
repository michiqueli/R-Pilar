import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { documentService } from '@/services/documentService';
import { useToast } from '@/components/ui/use-toast';
import DocumentsList from '@/components/documents/DocumentsList';
import DocumentUploadModal from '@/components/documents/DocumentUploadModal';

const ProjectDocumentsTab = ({ projectId }) => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await documentService.getDocuments({ projectId });
      setDocuments(data || []);
    } catch (error) {
       console.error(error);
       toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los documentos.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchDocuments();
  }, [projectId]);

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Documentación del Proyecto</h3>
          <Button 
             variant="primary" 
             size="sm" 
             className="rounded-full px-4"
             onClick={() => setIsModalOpen(true)}
          >
             <Plus className="w-4 h-4 mr-2" /> Subir Documento
          </Button>
       </div>

       <DocumentsList 
          documents={documents} 
          loading={loading} 
          onRefresh={fetchDocuments}
          emptyMessage="Este proyecto no tiene documentos aún."
       />

       <DocumentUploadModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchDocuments}
          projectId={projectId}
       />
    </div>
  );
};

export default ProjectDocumentsTab;