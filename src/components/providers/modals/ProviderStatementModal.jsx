import React, { useState } from 'react';
import { X, Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

function ProviderStatementModal({ isOpen, onClose, onSuccess, providerId }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    statement_month: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFileToStorage = async (fileToUpload) => {
    // Creamos una ruta organizada: /statements/ID_PROVEEDOR/timestamp_nombre.ext
    const fileExt = fileToUpload.name.split('.').pop();
    const fileName = `${providerId}/${Date.now()}.${fileExt}`;
    const filePath = `statements/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('provider_documents') // <-- Asegúrate de tener este Bucket creado en Supabase
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Obtenemos la URL pública para guardarla en la base de datos
    const { data } = supabase.storage.from('provider_documents').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast({ variant: 'destructive', title: 'Archivo requerido', description: 'Por favor selecciona un documento para subir.' });
      return;
    }

    setLoading(true);
    try {
      // 1. Subir al Storage
      const publicUrl = await uploadFileToStorage(file);

      // 2. Guardar registro en la Tabla con la URL obtenida
      const { error } = await supabase
        .from('provider_statements')
        .insert([{
          provider_id: providerId,
          statement_month: formData.statement_month,
          file_url: publicUrl, // Aquí guardamos la URL real de Supabase
          notes: formData.notes || null
        }]);

      if (error) throw error;

      toast({ title: 'Resumen guardado', description: 'El documento se subió correctamente.' });
      
      // Limpieza y cierre
      setFile(null);
      setFormData({ statement_month: new Date().toISOString().split('T')[0], notes: '' });
      onSuccess();
      onClose();
      
    } catch (error) {
      console.error("Error en upload:", error);
      toast({ variant: 'destructive', title: 'Error de subida', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/20">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Subir Resumen</h2>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Fecha */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Mes del Resumen</Label>
                <input
                  type="date"
                  required
                  value={formData.statement_month}
                  onChange={(e) => setFormData({ ...formData, statement_month: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                />
              </div>

              {/* Zona de Drop/Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Documento (PDF o Imagen)</Label>
                <div 
                  onClick={() => document.getElementById('provider-file-input').click()}
                  className={cn(
                    "relative border-2 border-dashed rounded-[20px] p-8 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group",
                    file 
                      ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10" 
                      : "border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:bg-blue-50/30"
                  )}
                >
                  <input 
                    id="provider-file-input" 
                    type="file" 
                    className="hidden" 
                    onChange={handleFileChange} 
                    accept=".pdf,image/*" 
                  />
                  
                  {file ? (
                    <>
                      <div className="bg-emerald-500 text-white p-3 rounded-2xl shadow-lg shadow-emerald-500/20">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 truncate max-w-[200px]">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-emerald-600/70 font-medium uppercase tracking-wider">Archivo seleccionado</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl text-slate-400 group-hover:text-blue-500 transition-colors">
                        <Upload className="w-7 h-7" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Seleccionar archivo</p>
                        <p className="text-xs text-slate-400">Formatos permitidos: PDF, JPG, PNG</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Notas */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Observaciones</Label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[90px] resize-none text-sm"
                  placeholder="Ej: Incluye facturas pendientes de la semana pasada..."
                />
              </div>

              {/* Footer */}
              <div className="flex gap-3 pt-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={onClose} 
                  className="flex-1 rounded-full h-12 font-bold"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 rounded-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                    </div>
                  ) : 'Subir Resumen'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ProviderStatementModal;