
import React, { useState, useRef } from 'react';
import { Upload, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { formatFileSize, cn } from '@/lib/utils';
import { adjuntosService } from '@/services/adjuntosService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ComprobantesUpload = ({ 
  movimientoId, 
  adjuntos = [], 
  onAdjuntoAdded, 
  onAdjuntoDeleted,
  loading: parentLoading = false 
}) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (file) => {
    if (!file) return;

    setUploading(true);
    try {
      if (movimientoId) {
        // Direct upload and save if we have an ID
        const newAdjunto = await adjuntosService.uploadAdjunto(file, movimientoId);
        onAdjuntoAdded(newAdjunto);
        toast({ title: "Archivo subido correctamente" });
      } else {
        // Upload to storage only (temp) if new movement
        const tempAdjunto = await adjuntosService.uploadFileToStorageOnly(file);
        onAdjuntoAdded(tempAdjunto); // This will be just the metadata object
        toast({ title: "Archivo listo para guardar" });
      }
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Error al subir archivo", 
        description: error.message 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      await processFile(files[0]);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteClick = (adjunto) => {
    setItemToDelete(adjunto);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    const adjunto = itemToDelete;
    setItemToDelete(null);

    try {
      if (adjunto.id && movimientoId) {
         // It's a saved record
         await adjuntosService.deleteAdjunto(adjunto.id, adjunto.archivo_url);
      }
      // If it has no ID, it's a temp file in state, just remove from UI (callback handles state update)
      onAdjuntoDeleted(adjunto);
      toast({ title: "Archivo eliminado" });
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Error al eliminar", 
        description: error.message 
      });
    }
  };

  return (
    <>
      <div className="flex flex-col h-full gap-4">
        {/* Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer min-h-[160px]",
            isDragging 
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
              : "border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-700 bg-slate-50 dark:bg-slate-900/50"
          )}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            disabled={uploading || parentLoading}
          />
          
          {uploading ? (
            <div className="flex flex-col items-center animate-pulse">
              <Upload className="w-8 h-8 text-blue-500 mb-2" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Subiendo...</p>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Click para subir o arrastra aquí
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                PDF, JPG o PNG (Máx 10MB)
              </p>
            </>
          )}
        </div>

        {/* Files List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {adjuntos.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm italic">
              No hay comprobantes adjuntos
            </div>
          )}
          
          {adjuntos.map((adj, index) => {
            const isImage = adj.archivo_tipo?.startsWith('image/');
            return (
              <div 
                key={adj.id || index} 
                className="group flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                  {isImage ? (
                    <img src={adj.archivo_url} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <FileText className="w-5 h-5 text-slate-500" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <a 
                    href={adj.archivo_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate hover:text-blue-600 block"
                  >
                    {adj.archivo_nombre}
                  </a>
                  <span className="text-xs text-slate-400">
                    {adj.archivo_tamano ? formatFileSize(adj.archivo_tamano) : 'Tamaño desconocido'}
                  </span>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteClick(adj); }}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás seguro?</DialogTitle>
            <DialogDescription>
              Esta acción eliminará el archivo permanentemente. No se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemToDelete(null)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmDelete}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ComprobantesUpload;
