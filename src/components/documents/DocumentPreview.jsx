
import React from 'react';
import { X, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { tokens } from '@/lib/designTokens';
import { useTheme } from '@/contexts/ThemeProvider';
import { documentService } from '@/services/documentService';

const DocumentPreview = ({ isOpen, onClose, document }) => {
  const { t } = useTheme();

  if (!isOpen || !document) return null;

  const isPdf = document.mime_type === 'application/pdf';
  const isImage = document.mime_type?.startsWith('image/');

  const handleDownload = () => {
    documentService.downloadDocument(document.file_url, document.file_name);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-slate-900 w-full max-w-[1000px] h-[80vh] flex flex-col shadow-2xl overflow-hidden relative"
          style={{ borderRadius: tokens.radius.modal }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3">
               <div className={`p-2 rounded-lg ${isPdf ? 'bg-red-50 text-red-600' : isImage ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                 {isPdf ? <FileText className="w-5 h-5" /> : isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
               </div>
               <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">{document.title}</h2>
                  <p className="text-xs text-slate-500">{document.file_name} • {(document.file_size / 1024 / 1024).toFixed(2)} MB</p>
               </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 bg-slate-100 dark:bg-slate-950 overflow-hidden relative flex items-center justify-center p-4">
             {isPdf ? (
                <iframe 
                  src={`${document.file_url}#toolbar=0`} 
                  className="w-full h-full rounded-lg shadow-sm bg-white" 
                  title="PDF Viewer"
                />
             ) : isImage ? (
                <img 
                  src={document.file_url} 
                  alt={document.title} 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
             ) : (
                <div className="text-center p-10 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                   <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                      <FileText className="w-10 h-10" />
                   </div>
                   <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Vista previa no disponible</h3>
                   <p className="text-slate-500 mb-6 max-w-xs mx-auto">Este tipo de archivo no se puede visualizar directamente aquí. Por favor descárgalo para verlo.</p>
                   <Button onClick={handleDownload} variant="primary" className="rounded-full">
                      <Download className="w-4 h-4 mr-2" /> {t('common.download')}
                   </Button>
                </div>
             )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 flex items-center justify-end gap-3">
             <Button variant="outline" onClick={onClose} className="rounded-full px-6">
               {t('common.close')}
             </Button>
             <Button variant="primary" onClick={handleDownload} className="rounded-full px-8 shadow-lg shadow-blue-200 dark:shadow-blue-900/20">
               <Download className="w-4 h-4 mr-2" /> {t('common.download')}
             </Button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DocumentPreview;
