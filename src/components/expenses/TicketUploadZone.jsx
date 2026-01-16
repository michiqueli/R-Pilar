
import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, X, Search, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const TicketUploadZone = ({ file, url, onFileChange, className }) => {
  const { t } = useTheme();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [zoom, setZoom] = useState(1);

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
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0]);
    }
  };

  const handleFiles = (selectedFile) => {
    // Basic validation
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      toast({ variant: 'destructive', title: t('common.error'), description: 'Formato no soportado. Use PDF, JPG, PNG.' });
      return;
    }
    // Size limit (e.g., 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({ variant: 'destructive', title: t('common.error'), description: 'Archivo demasiado grande (Max 10MB).' });
      return;
    }
    onFileChange(selectedFile);
  };

  const isImage = file ? file.type.startsWith('image/') : (url && !url.toLowerCase().endsWith('.pdf'));
  const isPdf = file ? file.type === 'application/pdf' : (url && url.toLowerCase().endsWith('.pdf'));
  const previewUrl = file ? URL.createObjectURL(file) : url;

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {!file && !url ? (
        <div 
          className={cn(
            "flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-8 transition-all cursor-pointer",
            dragActive 
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10" 
              : "border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{t('common.upload')}</h3>
          <p className="text-sm text-slate-500 max-w-[250px]">
            {t('common.drag_drop_text')} (PDF, JPG, PNG)
          </p>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleChange} 
            accept=".pdf,.jpg,.jpeg,.png,.webp" 
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col h-full bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative group">
          
          {/* Controls Overlay */}
          <div className="absolute top-4 right-4 z-20 flex gap-2">
            {isImage && (
              <>
                 <Button size="iconSm" variant="secondary" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="shadow-lg bg-white/90"><ZoomOut className="w-4 h-4"/></Button>
                 <Button size="iconSm" variant="secondary" onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="shadow-lg bg-white/90"><ZoomIn className="w-4 h-4"/></Button>
              </>
            )}
             <Button size="iconSm" variant="danger" onClick={() => onFileChange(null)} className="shadow-lg"><X className="w-4 h-4"/></Button>
          </div>

          {/* Preview Area */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-slate-200/50 dark:bg-slate-950/50 scrollbar-hide">
            {isImage ? (
               <div style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s' }}>
                 <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain shadow-sm rounded-lg" />
               </div>
            ) : (
               <div className="w-full h-full">
                  {/* Using object/embed for PDF is simpler than PDF.js for this snippet, or iframe */}
                  <iframe src={previewUrl} className="w-full h-full rounded-lg" title="PDF Preview" />
               </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="bg-white dark:bg-slate-950 p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
               <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center flex-shrink-0">
                  {isPdf ? <FileText className="w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}
               </div>
               <div className="min-w-0">
                 <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[200px]">{file ? file.name : 'Archivo remoto'}</p>
                 {file && <p className="text-xs text-slate-500">{(file.size / (1024*1024)).toFixed(2)} MB</p>}
               </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} className="whitespace-nowrap">
               {t('common.change_file')}
            </Button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleChange} 
              accept=".pdf,.jpg,.jpeg,.png,.webp" 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketUploadZone;
