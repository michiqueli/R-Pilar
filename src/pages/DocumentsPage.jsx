
import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeProvider';
import { useToast } from '@/components/ui/use-toast';
import { documentService } from '@/services/documentService';
import DocumentsList from '@/components/documents/DocumentsList';
import DocumentUploadModal from '@/components/documents/DocumentUploadModal';
import usePageTitle from '@/hooks/usePageTitle';

const DocumentsPage = () => {
  usePageTitle('Documentos');
  const { t } = useTheme();
  const { toast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await documentService.getDocuments({});
      setDocuments(data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: 'Error al cargar documentos.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <>
      <div className="p-8 max-w-7xl mx-auto min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('nav.documents')}</h1>
            <p className="text-slate-500 mt-1">Gestión centralizada de archivos y documentación.</p>
          </div>
          <Button 
            variant="primary" 
            className="rounded-full shadow-lg shadow-blue-200 dark:shadow-blue-900/20 px-6"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('common.new')} Documento
          </Button>
        </div>

        <DocumentsList 
          documents={documents} 
          loading={loading}
          onRefresh={fetchDocuments}
          emptyMessage="No hay documentos globales cargados."
        />
      </div>

      <DocumentUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchDocuments}
      />
    </>
  );
};

export default DocumentsPage;
