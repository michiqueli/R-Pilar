
import React, { useState, useEffect } from 'react';
import { Search, FileText, Download, Trash2, Eye, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { useTheme } from '@/contexts/ThemeProvider';
import { useToast } from '@/components/ui/use-toast';
import { documentService } from '@/services/documentService';
import { formatDate } from '@/lib/dateUtils';
import DocumentPreview from './DocumentPreview';
import { tokens } from '@/lib/designTokens';

const DocumentsList = ({ 
  documents, 
  onRefresh, 
  loading = false,
  emptyMessage = "No hay documentos" 
}) => {
  const { t } = useTheme();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    if (documents) {
      setFilteredDocs(
        documents.filter(doc => 
           doc.title.toLowerCase().includes(search.toLowerCase()) || 
           doc.type.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [documents, search]);

  const handleDelete = async (id) => {
    if (!window.confirm(t('messages.confirm_delete'))) return;
    try {
      await documentService.deleteDocument(id);
      toast({ title: t('common.success'), description: 'Documento eliminado' });
      onRefresh();
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: error.message });
    }
  };

  const getBadgeVariant = (type) => {
    switch (type) {
      case 'contract': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'ticket': return 'bg-green-50 text-green-700 border-green-100';
      case 'photo': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'blueprint': return 'bg-purple-50 text-purple-700 border-purple-100';
      default: return 'default';
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      contract: 'Contrato',
      ticket: 'Ticket',
      photo: 'Foto',
      blueprint: 'Plano',
      other: 'Otro'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
         <div className="flex-1 max-w-sm">
            <Input 
              icon={Search} 
              placeholder={t('common.search')} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white dark:bg-slate-900"
            />
         </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden" style={{ borderRadius: tokens.radius.card }}>
         {loading ? (
            <div className="p-12 text-center">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
               <p className="text-slate-500">{t('common.loading')}</p>
            </div>
         ) : filteredDocs.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
               <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-300">
                  <FolderOpen className="w-8 h-8" />
               </div>
               <p className="text-slate-500 font-medium">{emptyMessage}</p>
               {search && <p className="text-xs text-slate-400 mt-1">Prueba con otros términos de búsqueda</p>}
            </div>
         ) : (
            <div className="overflow-x-auto">
               <table className="w-full">
                  <thead>
                     <tr className="bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                        <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('common.title')}</th>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('common.type')}</th>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('common.date')}</th>
                        <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('common.actions')}</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                     {filteredDocs.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                           <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                 <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                                    <FileText className="w-4 h-4" />
                                 </div>
                                 <div>
                                    <p className="font-medium text-slate-900 dark:text-white line-clamp-1">{doc.title}</p>
                                    <p className="text-xs text-slate-500">{(doc.file_size / 1024 / 1024).toFixed(2)} MB</p>
                                 </div>
                              </div>
                           </td>
                           <td className="py-4 px-6">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeVariant(doc.type)}`}>
                                 {getTypeLabel(doc.type)}
                              </span>
                           </td>
                           <td className="py-4 px-6">
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                 {formatDate(doc.created_at)}
                              </p>
                              {doc.visible_in_client && (
                                 <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-0.5">
                                    <Eye className="w-3 h-3" /> Visible Cliente
                                 </span>
                              )}
                           </td>
                           <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Button 
                                    variant="ghost" 
                                    size="iconSm" 
                                    onClick={() => setPreviewDoc(doc)}
                                    title={t('common.view')}
                                 >
                                    <Eye className="w-4 h-4 text-slate-500" />
                                 </Button>
                                 <Button 
                                    variant="ghost" 
                                    size="iconSm" 
                                    onClick={() => documentService.downloadDocument(doc.file_url, doc.file_name)}
                                    title={t('common.download')}
                                 >
                                    <Download className="w-4 h-4 text-slate-500" />
                                 </Button>
                                 <Button 
                                    variant="ghost" 
                                    size="iconSm" 
                                    onClick={() => handleDelete(doc.id)}
                                    className="hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    title={t('common.delete')}
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </Button>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>

      <DocumentPreview 
         isOpen={!!previewDoc}
         onClose={() => setPreviewDoc(null)}
         document={previewDoc}
      />
    </div>
  );
};

export default DocumentsList;
