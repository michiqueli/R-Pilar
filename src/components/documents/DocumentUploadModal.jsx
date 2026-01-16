
import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { ThemedSelect } from '@/components/ui/themed-components';
import { tokens } from '@/lib/designTokens';
import { useTheme } from '@/contexts/ThemeProvider';
import { documentService } from '@/services/documentService';
import { Checkbox } from '@/components/ui/checkbox';

const DocumentUploadModal = ({ isOpen, onClose, onSuccess, projectId, clientId }) => {
  const { t } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState('other');
  const [file, setFile] = useState(null);
  const [visibleInClient, setVisibleInClient] = useState(false);

  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const validTypes = [
      'application/pdf', 
      'image/jpeg', 
      'image/png', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
    ];
    
    // Check MIME type (rough check, extension check also good practice)
    // if (!validTypes.includes(selectedFile.type)) {
    //   toast({ variant: 'destructive', title: 'Error', description: 'Formato de archivo no soportado.' });
    //   return;
    // }

    if (selectedFile.size > 50 * 1024 * 1024) { // 50MB
      toast({ variant: 'destructive', title: 'Error', description: 'El archivo excede el límite de 50MB.' });
      return;
    }

    setFile(selectedFile);
    // Auto-fill title if empty
    if (!title) {
       setTitle(selectedFile.name.split('.')[0]);
    }
  };

  const handleSubmit = async () => {
    if (!title) return toast({ variant: 'destructive', title: t('common.error'), description: 'El título es obligatorio.' });
    if (!file) return toast({ variant: 'destructive', title: t('common.error'), description: 'Debes seleccionar un archivo.' });

    setLoading(true);
    try {
      await documentService.uploadDocument({
        file,
        title,
        type,
        clientId,
        projectId,
        visibleInClient: projectId ? visibleInClient : false
      });

      toast({ title: t('common.success'), description: 'Documento subido correctamente' });
      
      // Reset
      setTitle('');
      setFile(null);
      setType('other');
      setVisibleInClient(false);
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('common.error'), description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 w-full max-w-[700px] shadow-2xl flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800"
            style={{ borderRadius: tokens.radius.modal }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Subir Documento</h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8 space-y-6 bg-slate-50/50 dark:bg-slate-950/50">
              
              {/* Title & Type Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label>{t('common.title')} <span className="text-red-500">*</span></Label>
                    <Input 
                      placeholder="Ej: Contrato de servicios" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                 </div>
                 <div className="space-y-2">
                    <Label>{t('common.type')}</Label>
                    <ThemedSelect value={type} onChange={(e) => setType(e.target.value)}>
                       <option value="contract">Contrato</option>
                       <option value="ticket">Ticket / Factura</option>
                       <option value="photo">Foto</option>
                       <option value="blueprint">Plano</option>
                       <option value="other">Otro</option>
                    </ThemedSelect>
                 </div>
              </div>

              {/* Upload Zone */}
              <div className="space-y-2">
                <Label>Archivo <span className="text-red-500">*</span></Label>
                <div 
                   className={`
                      relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer bg-white dark:bg-slate-900
                      ${dragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10" : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"}
                      ${file ? "border-green-500 bg-green-50 dark:bg-green-900/10" : ""}
                   `}
                   onDragEnter={handleDrag}
                   onDragLeave={handleDrag}
                   onDragOver={handleDrag}
                   onDrop={handleDrop}
                   onClick={() => inputRef.current?.click()}
                   style={{ minHeight: '180px' }}
                >
                   <input 
                      ref={inputRef}
                      type="file" 
                      className="hidden" 
                      onChange={handleChange}
                      accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx"
                   />
                   
                   {file ? (
                      <div className="flex flex-col items-center animate-in fade-in zoom-in">
                         <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-3">
                            <CheckCircle2 className="w-8 h-8" />
                         </div>
                         <p className="font-semibold text-slate-900 dark:text-white text-lg">{file.name}</p>
                         <p className="text-sm text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                         <Button variant="ghost" size="sm" className="mt-4 text-slate-500 hover:text-red-500" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                            Cambiar archivo
                         </Button>
                      </div>
                   ) : (
                      <>
                         <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mb-4">
                           <Upload className="w-7 h-7" />
                         </div>
                         <p className="text-lg font-medium text-slate-900 dark:text-white">
                           Arrastra tu archivo aquí o haz click
                         </p>
                         <p className="text-sm text-slate-500 mt-2">
                           PDF, JPG, PNG, DOCX, XLSX (Max 50MB)
                         </p>
                      </>
                   )}
                </div>
              </div>

              {/* Visibility Checkbox (Only for Projects) */}
              {projectId && (
                <div className="flex items-center space-x-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                   <Checkbox 
                     id="visible_client" 
                     checked={visibleInClient}
                     onCheckedChange={setVisibleInClient}
                   />
                   <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="visible_client"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Visible para el Cliente
                      </label>
                      <p className="text-xs text-slate-500">
                        Si activas esto, el cliente podrá ver este documento desde su portal.
                      </p>
                   </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 flex items-center justify-end gap-3 sticky bottom-0">
               <Button variant="outline" onClick={onClose} className="rounded-full px-6" disabled={loading}>
                 {t('common.cancel')}
               </Button>
               <Button 
                 variant="primary" 
                 onClick={handleSubmit} 
                 loading={loading}
                 className="rounded-full px-8 shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
               >
                 Subir Documento
               </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DocumentUploadModal;
