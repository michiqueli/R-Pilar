
import React, { useState } from 'react';
import { X, FileText, Upload, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { ThemedSelect } from '@/components/ui/themed-components';
import { tokens } from '@/lib/designTokens';

const ClientDocumentModal = ({ isOpen, onClose, onSuccess, clientId }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Otro');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit example
        toast({ variant: 'destructive', title: 'Error', description: 'El archivo es demasiado grande (Max 5MB)' });
        return;
      }
      setFile(selectedFile);
      
      // Preview logic
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const handleSubmit = async () => {
    if (!title || !file) {
      toast({ variant: 'destructive', title: 'Error', description: 'Título y archivo son obligatorios' });
      return;
    }

    setLoading(true);
    try {
      // 1. Upload File
      const fileExt = file.name.split('.').pop();
      const fileName = `${clientId}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents') // Assuming 'documents' bucket exists
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);

      // 2. Insert Record
      const { error: insertError } = await supabase
        .from('client_documents')
        .insert([{
          client_id: clientId,
          title,
          category,
          file_url: publicUrl,
          storage_path: filePath,
          uploaded_by: user.id
        }]);

      if (insertError) throw insertError;

      toast({ title: 'Éxito', description: 'Documento subido correctamente' });
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Hubo un problema al subir el documento. Verifica si existe el bucket "documents".' });
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
            className="bg-white dark:bg-slate-900 w-full max-w-[600px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            style={{ borderRadius: tokens.radius.modal }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Subir Documento</h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-2">
                <Label>Título del Documento <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Ej. Contrato Marco 2024"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Categoría</Label>
                <ThemedSelect
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Contrato">Contrato</option>
                  <option value="Presupuesto">Presupuesto</option>
                  <option value="Factura">Factura</option>
                  <option value="Foto">Foto</option>
                  <option value="Otro">Otro</option>
                </ThemedSelect>
              </div>

              <div className="space-y-2">
                <Label>Archivo</Label>
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative cursor-pointer">
                   <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                   />
                   {preview ? (
                      <img src={preview} alt="Preview" className="h-32 object-contain mb-2 rounded-lg" />
                   ) : (
                      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mb-3">
                        <Upload className="w-6 h-6" />
                      </div>
                   )}
                   <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {file ? file.name : "Haz click o arrastra un archivo aquí"}
                   </p>
                   <p className="text-xs text-slate-500 mt-1">
                      PDF, Imágenes, Docs (Max 5MB)
                   </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={onClose} className="rounded-full px-6" disabled={loading}>
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSubmit} 
                loading={loading}
                className="rounded-full px-8 shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
              >
                Guardar Documento
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ClientDocumentModal;
