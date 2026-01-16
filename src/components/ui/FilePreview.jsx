
import React from 'react';
import { FileText, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const FilePreview = ({ file, url, onRemove, onReplace }) => {
  if (!file && !url) return null;

  const isPdf = file ? file.type === 'application/pdf' : url?.toLowerCase().endsWith('.pdf');
  const isImage = file ? file.type.startsWith('image/') : (url && !url.toLowerCase().endsWith('.pdf'));
  
  const fileName = file ? file.name : 'Documento adjunto';
  const fileSize = file ? (file.size / (1024 * 1024)).toFixed(2) + ' MB' : '';

  return (
    <div className="w-full h-full flex flex-col bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative group">
      {/* Remove Button Overlay */}
      <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          type="button" 
          variant="secondary" 
          size="iconSm" 
          onClick={onRemove}
          className="bg-white/90 hover:bg-red-50 text-slate-500 hover:text-red-600 shadow-sm"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex items-center justify-center bg-slate-200/50 dark:bg-slate-900/50">
        {isImage ? (
          <img 
            src={file ? URL.createObjectURL(file) : url} 
            alt="Preview" 
            className="w-full h-full object-contain p-2"
          />
        ) : isPdf ? (
          <div className="flex flex-col items-center text-slate-500 p-6 text-center">
            <FileText className="w-16 h-16 mb-2 text-red-500" />
            <p className="text-sm font-medium">{fileName}</p>
            {url && (
              <iframe 
                src={url} 
                className="w-full h-full absolute inset-0 opacity-100" 
                title="PDF Preview"
              />
            )}
            {!url && <p className="text-xs">Vista previa no disponible para PDF local</p>}
          </div>
        ) : (
          <div className="flex flex-col items-center text-slate-500">
             <FileText className="w-12 h-12 mb-2" />
             <span className="text-xs">Archivo no soportado para vista previa</span>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-white dark:bg-slate-900 p-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
        <div className="truncate max-w-[60%]">
          <span className="font-medium text-slate-700 dark:text-slate-200 block truncate">{fileName}</span>
          {fileSize && <span className="text-slate-400">{fileSize}</span>}
        </div>
        <button 
          type="button"
          onClick={onReplace} 
          className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
        >
          Reemplazar
        </button>
      </div>
    </div>
  );
};

export default FilePreview;
