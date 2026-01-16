import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
   ArrowLeft, Upload, FileText, X, Save,
   DollarSign, Image as ImageIcon, Loader2,
   TrendingDown, TrendingUp, ChevronLeft, ChevronRight, CheckCircle2, Plus, Minus
} from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import DatePickerInput from '@/components/ui/DatePickerInput';
import { cn } from '@/lib/utils';

// Supabase and Services
import { supabase } from '@/lib/customSupabaseClient';
import { cuentaService } from '@/services/cuentaService';
import { adjuntosService } from '@/services/adjuntosService';
import { formatCurrencyARS, formatCurrencyUSD } from '@/lib/formatUtils';

// PDF Preview Imports
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF Worker
// Using unpkg CDN for the worker is the most reliable way to avoid Vite build issues
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const NewMovementPage = () => {
   const { t } = useTranslation();
   const navigate = useNavigate();
   const { toast } = useToast();
   const [searchParams] = useSearchParams();
   const fileInputRef = useRef(null);

   // URL Params
   const paramCuentaId = searchParams.get('cuenta_id');
   const paramProjectId = searchParams.get('project_id');
   const paramInvestorId = searchParams.get('investor_id');
   const paramType = searchParams.get('type');

   // State
   const [loading, setLoading] = useState(false);
   const [catalogsLoading, setCatalogsLoading] = useState(true);
   const [accounts, setAccounts] = useState([]);
   const [projects, setProjects] = useState([]);
   const [providers, setProviders] = useState([]);
   const [investors, setInvestors] = useState([]);

   // File State
   const [selectedFile, setSelectedFile] = useState(null);
   const [previewUrl, setPreviewUrl] = useState(null);
   const [isDragOver, setIsDragOver] = useState(false);
   const [fileType, setFileType] = useState(null);

   // PDF State
   const [numPages, setNumPages] = useState(null);
   const [pageNumber, setPageNumber] = useState(1);
   const [pdfScale, setPdfScale] = useState(1.0);

   // Text Selection & Mapping State
   const [selectionMenu, setSelectionMenu] = useState(null);
   const [mappedFields, setMappedFields] = useState({});

   // Form State
   const [type, setType] = useState(paramType || 'GASTO');
   const [formData, setFormData] = useState({
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0],
      estado: 'CONFIRMADO',
      cuenta_id: paramCuentaId || '',
      project_id: paramProjectId || '',
      provider_id: '',
      inversionista_id: paramInvestorId || '',
      monto_ars: '',
      valor_usd: '0',
      monto_usd: 0,
      iva_incluido: false,
      iva_porcentaje: '21',
      neto: 0,
      notas: ''
   });

   // Init
   useEffect(() => {
      fetchCatalogs();
   }, []);

   // Update form if URL params change
   useEffect(() => {
      if (paramType) setType(paramType);
   }, [paramType]);

   const fetchCatalogs = async () => {
      setCatalogsLoading(true);
      try {
         const [accData, projRes, provRes, invRes] = await Promise.all([
            cuentaService.getCuentasActivas(),
            supabase.from('projects').select('id, name').eq('is_deleted', false).order('name'),
            supabase.from('providers').select('id, name').eq('is_deleted', false).order('name'),
            supabase.from('inversionistas').select('id, nombre').eq('estado', 'activo')
         ]);

         if (accData) setAccounts(accData);
         if (projRes.data) setProjects(projRes.data);
         if (provRes.data) setProviders(provRes.data);
         if (invRes.data) setInvestors(invRes.data);
      } catch (e) {
         console.error("Error loading catalogs", e);
         toast({
            variant: 'destructive',
            title: t('common.error'),
            description: t('messages.error_loading')
         });
      } finally {
         setCatalogsLoading(false);
      }
   };

   // --- File Handling ---

   const handleFileSelect = (e) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
   };

   const processFile = (file) => {
      if (file.size > 10 * 1024 * 1024) {
         toast({
            variant: 'destructive',
            title: 'Error',
            description: 'El archivo no debe superar los 10MB'
         });
         return;
      }

      setSelectedFile(file);
      setFileType(file.type);

      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setPageNumber(1);
      setSelectionMenu(null); // Clear any old menu
   };

   const handleDragOver = (e) => {
      e.preventDefault();
      setIsDragOver(true);
   };

   const handleDragLeave = (e) => {
      e.preventDefault();
      setIsDragOver(false);
   };

   const handleDrop = (e) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
   };

   const clearFile = () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(null);
      setPreviewUrl(null);
      setFileType(null);
      setNumPages(null);
      setSelectionMenu(null);
      setMappedFields({});
      if (fileInputRef.current) fileInputRef.current.value = "";
   };

   // --- PDF Logic ---

   function onDocumentLoadSuccess({ numPages }) {
      setNumPages(numPages);
   }

   // --- Text Selection & Mapping Logic ---

   const handleTextSelection = (e) => {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim().length === 0) {
         // Don't clear immediately if we are clicking inside the menu
         if (!e.target.closest('#context-menu')) {
            setSelectionMenu(null);
         }
         return;
      }

      const text = selection.toString().trim();

      // Position menu near the mouse cursor
      // We use e.clientX/Y which are viewport relative
      setSelectionMenu({
         text: text,
         x: e.clientX,
         y: e.clientY
      });
   };

   const mapTextToField = (field) => {
      if (!selectionMenu) return;
      const text = selectionMenu.text;

      let updatedData = { ...formData };
      let success = true;

      switch (field) {
         case 'monto':
            // Remove currency symbols and non-numeric characters except dots and commas
            // Simple heuristic: if comma is last separator, it's decimal (ES/AR format), else dot
            const cleanText = text.replace(/[^0-9,.]/g, '');
            let amount = 0;
            if (cleanText.includes(',') && cleanText.lastIndexOf(',') > cleanText.lastIndexOf('.')) {
               // Comma decimal
               amount = parseFloat(cleanText.replace(/\./g, '').replace(',', '.'));
            } else {
               amount = parseFloat(cleanText.replace(/,/g, ''));
            }

            if (!isNaN(amount)) {
               updatedData.monto_ars = amount;
               handleEconomicChange('monto_ars', amount, updatedData);
            } else {
               success = false;
            }
            break;

         case 'descripcion': // Concepto
            updatedData.descripcion = text;
            break;

         case 'referencia':
            const currentNotes = updatedData.notas || '';
            updatedData.notas = currentNotes ? `${currentNotes}\nRef: ${text}` : `Ref: ${text}`;
            break;

         case 'fecha':
            // Try to parse date
            const date = new Date(text);
            if (!isNaN(date.getTime())) {
               updatedData.fecha = date.toISOString().split('T')[0];
            } else {
               // Try manual parsing dd/mm/yyyy
               const parts = text.split(/[\/\-]/);
               if (parts.length === 3) {
                  // Assume dd/mm/yyyy
                  const d = parts[0];
                  const m = parts[1];
                  const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                  const constructedDate = new Date(`${y}-${m}-${d}`);
                  if (!isNaN(constructedDate.getTime())) {
                     updatedData.fecha = constructedDate.toISOString().split('T')[0];
                  } else {
                     success = false;
                  }
               } else {
                  success = false;
               }
            }
            break;

         case 'provider':
            // Fuzzy match provider name
            const provider = providers.find(p => p.name.toLowerCase().includes(text.toLowerCase()));
            if (provider) {
               updatedData.provider_id = provider.id;
            } else {
               toast({ variant: "warning", title: "Proveedor no encontrado", description: "No se encontró un proveedor exacto. Se intentó buscar: " + text });
               // We don't mark success false here to allow manual intervention, but visually we might want to fail
            }
            break;

         default:
            success = false;
      }

      if (success) {
         setFormData(updatedData);
         setMappedFields(prev => ({ ...prev, [field]: true }));
         toast({
            title: t('movimientos.textMapped'),
            description: `${t(`movimientos.${field}`)}: ${text.substring(0, 20)}...`,
            className: "bg-green-50 border-green-200"
         });
      } else {
         toast({
            variant: "destructive",
            title: "Error de mapeo",
            description: `No se pudo convertir el texto seleccionado a un formato válido para ${t(`movimientos.${field}`)}`
         });
      }

      // Clear selection
      window.getSelection().removeAllRanges();
      setSelectionMenu(null);
   };

   // --- Form Logic ---

   const handleEconomicChange = (field, value, currentState = formData) => {
      let newFormData = { ...currentState, [field]: value };

      const montoArs = parseFloat(newFormData.monto_ars) || 0;
      const valorUsd = parseFloat(newFormData.valor_usd) || 1;
      const ivaPorcentaje = parseFloat(newFormData.iva_porcentaje) || 0;

      const montoUsd = valorUsd > 0 ? montoArs / valorUsd : 0;

      let neto = montoArs;
      if (newFormData.iva_incluido) {
         neto = montoArs / (1 + (ivaPorcentaje / 100));
      }

      // Update state directly if called from event handler, or return object if helper
      if (currentState === formData) {
         setFormData({ ...newFormData, monto_usd: montoUsd, neto });
      } else {
         // If called from mapper with a temporary object
         currentState.monto_usd = montoUsd;
         currentState.neto = neto;
      }
   };

   const validate = () => {
      if (!formData.descripcion) {
         toast({ variant: 'destructive', title: t('common.error'), description: t('messages.field_required') });
         return false;
      }
      if (!formData.cuenta_id) {
         toast({ variant: 'destructive', title: t('common.error'), description: t('cuentas.requiredFields') });
         return false;
      }
      if (!formData.monto_ars || parseFloat(formData.monto_ars) <= 0) {
         toast({ variant: 'destructive', title: t('common.error'), description: t('finanzas.montoMayorCero') });
         return false;
      }
      return true;
   };

   const handleSubmit = async () => {
      if (!validate()) return;
      setLoading(true);

      try {
         // 1. Save Movement
         const payload = {
            tipo: type,
            descripcion: formData.descripcion,
            fecha: formData.fecha,
            estado: formData.estado,
            cuenta_id: formData.cuenta_id,
            proyecto_id: formData.project_id || null,
            proveedor_id: formData.provider_id || null,
            inversionista_id: formData.inversionista_id || null,
            monto_ars: parseFloat(formData.monto_ars),
            valor_usd: parseFloat(formData.valor_usd) || 0,
            monto_usd: parseFloat(formData.monto_usd) || 0,
            iva_incluido: formData.iva_incluido,
            iva_porcentaje: parseFloat(formData.iva_porcentaje) || 0,
            neto: parseFloat(formData.neto) || 0,
            notas: formData.notas
         };

         const { data, error } = await supabase
            .from('inversiones')
            .insert([payload])
            .select()
            .single();

         if (error) throw error;

         const movementId = data.id;
         console.log(data)

         // 2. Upload Attachment if exists
         if (selectedFile) {
            try {
               // Esta función ya sube el archivo Y crea el registro en movimientos_adjuntos
               await adjuntosService.uploadAdjunto(
                  selectedFile,
                  movementId
               );
               console.log('[handleSubmit] Adjunto procesado con éxito');
            } catch (uploadError) {
               console.error("Error uploading file", uploadError);
               // Usamos un toast de advertencia porque el movimiento principal SÍ se guardó
               toast({
                  variant: 'warning',
                  title: 'Advertencia',
                  description: 'Movimiento guardado pero falló la carga del archivo comprobante.'
               });
            }
         }

         toast({
            title: t('common.success'),
            description: t('messages.success_save'),
            className: 'bg-green-50 border-green-200'
         });

         // Smart Redirect
         if (paramProjectId) navigate(`/projects/${paramProjectId}`);
         else if (paramInvestorId) navigate(`/inversionistas/${paramInvestorId}`);
         else if (paramCuentaId) navigate(`/cuentas/${paramCuentaId}`);
         else navigate('/movimientos');

      } catch (error) {
         console.error("Error saving movement", error);
         toast({ variant: 'destructive', title: t('common.error'), description: error.message || t('messages.errorSave') });
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="flex h-screen bg-white dark:bg-slate-950 overflow-hidden font-sans">

         {/* LEFT COLUMN: PREVIEW & SELECTION */}
         <div
            className="hidden md:flex w-1/2 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col relative"
            onMouseUp={handleTextSelection}
         >
            {/* Botón Volver - Absoluto fuera del flujo */}
            <div className="absolute top-6 left-6 z-30">
               <Button
                  variant="outline"
                  className="bg-white/80 backdrop-blur shadow-sm hover:bg-white dark:bg-black/50 dark:hover:bg-black/70"
                  onClick={() => navigate(-1)}
               >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('common.back')}
               </Button>
            </div>

            <div className="flex-1 flex flex-col p-8 overflow-hidden relative">
               {selectedFile && previewUrl ? (
                  <div className="flex-1 flex flex-col min-h-0">

                     {/* File Action Controls (Change/Clear) */}
                     <div className="flex justify-end gap-2 mb-4">
                        <Button
                           size="sm"
                           variant="secondary"
                           onClick={() => document.getElementById('file-upload').click()}
                           className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700"
                        >
                           <Upload className="w-3 h-3 mr-2" />
                           {t('movimientos.changeFile')}
                        </Button>
                        <Button
                           size="sm"
                           variant="destructive"
                           onClick={clearFile}
                           className="shadow-sm"
                        >
                           <X className="w-3 h-3 mr-2" />
                           {t('movimientos.clearFile')}
                        </Button>
                     </div>

                     {/* Document Render Area */}
                     <div className="flex-1 overflow-auto bg-slate-200/50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-700 shadow-inner">
                        {fileType?.includes('pdf') ? (
                           <div className="flex justify-center p-6 min-h-full">
                              <Document
                                 file={selectedFile}
                                 onLoadSuccess={onDocumentLoadSuccess}
                                 loading={
                                    <div className="flex flex-col items-center gap-2 p-10">
                                       <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                       <span className="text-sm text-slate-500">Renderizando...</span>
                                    </div>
                                 }
                              >
                                 <Page
                                    pageNumber={pageNumber}
                                    scale={pdfScale}
                                    renderTextLayer={true}
                                    renderAnnotationLayer={true}
                                    className="shadow-2xl"
                                 />
                              </Document>
                           </div>
                        ) : (
                           <div className="flex items-center justify-center min-h-full p-6">
                              <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain shadow-lg rounded-md" />
                           </div>
                        )}
                     </div>

                     {/* PDF Tools Bar (Zoom & Navigation) */}
                     {fileType?.includes('pdf') && numPages && (
                        <div className="mt-4 flex items-center justify-center gap-6 bg-white dark:bg-slate-900 py-2 px-6 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 mx-auto w-fit">
                           {/* Pagination */}
                           <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-6">
                              <Button
                                 variant="ghost" size="icon" className="h-8 w-8"
                                 disabled={pageNumber <= 1}
                                 onClick={() => setPageNumber(prev => prev - 1)}
                              >
                                 <ChevronLeft className="w-4 h-4" />
                              </Button>
                              <span className="text-sm font-semibold tabular-nums px-2 min-w-[100px] text-center">
                                 {t('movimientos.pageOf', { current: pageNumber, total: numPages })}
                              </span>
                              <Button
                                 variant="ghost" size="icon" className="h-8 w-8"
                                 disabled={pageNumber >= numPages}
                                 onClick={() => setPageNumber(prev => prev + 1)}
                              >
                                 <ChevronRight className="w-4 h-4" />
                              </Button>
                           </div>
                           {/* Zoom */}
                           <div className="flex items-center gap-1">
                              <Button
                                 variant="ghost" size="icon" className="h-8 w-8"
                                 onClick={() => setPdfScale(prev => Math.max(prev - 0.2, 0.5))}
                              >
                                 <Minus className="w-4 h-4" />
                              </Button>
                              <span className="text-sm font-mono font-medium min-w-[45px] text-center">
                                 {Math.round(pdfScale * 100)}%
                              </span>
                              <Button
                                 variant="ghost" size="icon" className="h-8 w-8"
                                 onClick={() => setPdfScale(prev => Math.min(prev + 0.2, 3.0))}
                              >
                                 <Plus className="w-4 h-4" />
                              </Button>
                           </div>
                        </div>
                     )}

                     {/* Selection Menu (Contextual) */}
                     {selectionMenu && (
                        <div
                           id="context-menu"
                           className="fixed z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-1 w-56 animate-in fade-in zoom-in-95 duration-100"
                           style={{ top: selectionMenu.y + 10, left: selectionMenu.x }}
                        >
                           <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 border-b border-slate-100 dark:border-slate-700 mb-1">
                              {t('movimientos.mapTo')}
                           </div>
                           <button onClick={() => mapTextToField('provider')} className="w-full text-left px-2 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded flex items-center gap-2">
                              <span className="w-4 h-4 flex items-center justify-center">🏢</span> {t('movimientos.provider')}
                           </button>
                           <button onClick={() => mapTextToField('monto')} className="w-full text-left px-2 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded flex items-center gap-2">
                              <span className="w-4 h-4 flex items-center justify-center">💲</span> {t('movimientos.amount')}
                           </button>
                           <button onClick={() => mapTextToField('descripcion')} className="w-full text-left px-2 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded flex items-center gap-2">
                              <span className="w-4 h-4 flex items-center justify-center">📝</span> {t('movimientos.concept')}
                           </button>
                           <button onClick={() => mapTextToField('fecha')} className="w-full text-left px-2 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded flex items-center gap-2">
                              <span className="w-4 h-4 flex items-center justify-center">📅</span> {t('movimientos.date')}
                           </button>
                           <button onClick={() => mapTextToField('referencia')} className="w-full text-left px-2 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded flex items-center gap-2">
                              <span className="w-4 h-4 flex items-center justify-center">📌</span> {t('movimientos.reference')}
                           </button>
                        </div>
                     )}
                  </div>
               ) : (
                  /* Empty State / Upload Zone */
                  <div
                     className={`w-full max-w-md aspect-square border-3 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 transition-all cursor-pointer group mx-auto my-auto
                  ${isDragOver
                           ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 scale-105'
                           : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900/20'
                        }`}
                     onDragOver={handleDragOver}
                     onDragLeave={handleDragLeave}
                     onDrop={handleDrop}
                     onClick={() => fileInputRef.current?.click()}
                  >
                     <input
                        ref={fileInputRef}
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={handleFileSelect}
                     />
                     <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-blue-500">
                        <Upload className="w-10 h-10" />
                     </div>
                     <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                        {t('movimientos.drag_drop_title')}
                     </h3>
                     <p className="text-slate-500 dark:text-slate-400 text-center mb-6 max-w-xs">
                        {t('movimientos.drag_drop_subtitle')}
                     </p>
                     <Button className="rounded-full px-8 pointer-events-none">
                        {t('movimientos.select_file')}
                     </Button>
                  </div>
               )}
            </div>
         </div>

         {/* RIGHT COLUMN: FORM */}
         <div className="w-full md:w-1/2 flex flex-col h-full bg-white dark:bg-slate-950">
            <div className="h-16 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
               <div className="md:hidden">
                  <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                     <ArrowLeft className="w-5 h-5" />
                  </Button>
               </div>
               <div>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                     {t('movimientos.new_title')}
                  </h1>
                  <p className="text-xs text-slate-500">
                     {t('movimientos.new_subtitle')}
                  </p>
               </div>
               <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
                  <Button
                     onClick={handleSubmit}
                     disabled={loading}
                     className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
                  >
                     {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                     {!loading && <Save className="w-4 h-4 mr-2" />}
                     {t('common.save')}
                  </Button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10">
               <div className="max-w-2xl mx-auto space-y-8">

                  {/* Mobile File Upload Trigger */}
                  <div className="md:hidden">
                     <Button
                        variant="outline"
                        className="w-full h-20 border-dashed border-2 flex flex-col gap-2"
                        onClick={() => fileInputRef.current?.click()}
                     >
                        <Upload className="w-5 h-5" />
                        {selectedFile ? selectedFile.name : t('movimientos.select_file')}
                     </Button>
                  </div>

                  {/* Movement Type */}
                  <div className="space-y-3">
                     <Label>{t('movimientos.type')}</Label>
                     <div className="grid grid-cols-4 gap-3">
                        {['GASTO', 'INGRESO', 'INVERSION', 'DEVOLUCION'].map((tType) => (
                           <button
                              key={tType}
                              onClick={() => setType(tType)}
                              className={`flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-xl text-sm font-bold transition-all border shadow-sm
                           ${type === tType
                                    ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900 ring-offset-2 dark:bg-white dark:text-slate-900'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
                                 }
                           `}
                           >
                              {tType === 'GASTO' || tType === 'DEVOLUCION' ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                              {t(`finanzas.${tType.toLowerCase()}`)}
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Main Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="col-span-2 space-y-2 relative">
                        <div className="flex justify-between">
                           <Label>{t('movimientos.description')} <span className="text-red-500">*</span></Label>
                           {mappedFields.descripcion && <CheckCircle2 className="w-4 h-4 text-green-500 animate-in fade-in" />}
                        </div>
                        <Input
                           value={formData.descripcion}
                           onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                           placeholder="Ej: Pago de proveedores..."
                           className={cn(
                              "text-lg font-medium",
                              mappedFields.descripcion && "border-green-400 bg-green-50 dark:bg-green-900/10"
                           )}
                        />
                     </div>

                     <div className="space-y-2">
                        <Label>{t('movimientos.account')} <span className="text-red-500">*</span></Label>
                        <Select
                           value={formData.cuenta_id}
                           onValueChange={(val) => setFormData({ ...formData, cuenta_id: val })}
                        >
                           <SelectTrigger>
                              <SelectValue placeholder={catalogsLoading ? t('common.loading') : t('finanzas.seleccionarCuenta')} />
                           </SelectTrigger>
                           <SelectContent>
                              {accounts.map(acc => (
                                 <SelectItem key={acc.id} value={acc.id}>{acc.titulo} ({acc.moneda})</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>

                     <div className="space-y-2">
                        <div className="flex justify-between">
                           <Label>{t('common.date')}</Label>
                           {mappedFields.fecha && <CheckCircle2 className="w-4 h-4 text-green-500 animate-in fade-in" />}
                        </div>
                        <div className={cn(mappedFields.fecha && "ring-1 ring-green-400 rounded-md")}>
                           <DatePickerInput
                              date={formData.fecha ? new Date(formData.fecha) : null}
                              onSelect={(d) => setFormData({ ...formData, fecha: d ? d.toISOString().split('T')[0] : '' })}
                           />
                        </div>
                     </div>

                     {/* Dynamic Partner Field */}
                     <div className="space-y-2 col-span-2 md:col-span-1">
                        {(type === 'INVERSION' || type === 'DEVOLUCION') ? (
                           <>
                              <Label>{t('finanzas.inversor')}</Label>
                              <Select
                                 value={formData.inversionista_id}
                                 onValueChange={(val) => setFormData({ ...formData, inversionista_id: val })}
                              >
                                 <SelectTrigger>
                                    <SelectValue placeholder={t('finanzas.seleccionarInversor')} />
                                 </SelectTrigger>
                                 <SelectContent>
                                    {investors.map(inv => (
                                       <SelectItem key={inv.id} value={inv.id}>{inv.nombre}</SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                           </>
                        ) : (
                           <>
                              <div className="flex justify-between">
                                 <Label>{t('common.provider')}</Label>
                                 {mappedFields.provider && <CheckCircle2 className="w-4 h-4 text-green-500 animate-in fade-in" />}
                              </div>
                              <div className={cn(mappedFields.provider && "ring-1 ring-green-400 rounded-md")}>
                                 <Select
                                    value={formData.provider_id}
                                    onValueChange={(val) => setFormData({ ...formData, provider_id: val })}
                                 >
                                    <SelectTrigger>
                                       <SelectValue placeholder={t('movimientos.select_provider')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                       {providers.map(prov => (
                                          <SelectItem key={prov.id} value={prov.id}>{prov.name}</SelectItem>
                                       ))}
                                    </SelectContent>
                                 </Select>
                              </div>
                           </>
                        )}
                     </div>

                     <div className="space-y-2 col-span-2 md:col-span-1">
                        <Label>{t('finanzas.proyecto')}</Label>
                        <Select
                           value={formData.project_id}
                           onValueChange={(val) => setFormData({ ...formData, project_id: val })}
                        >
                           <SelectTrigger>
                              <SelectValue placeholder={t('movimientos.select_project')} />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="none">Sin Proyecto</SelectItem>
                              {projects.map(p => (
                                 <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                  </div>

                  {/* Economic Section */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                     <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400 font-bold uppercase text-xs tracking-wider">
                        <DollarSign className="w-4 h-4" />
                        <h3>{t('movimientos.detalle_economico')}</h3>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                           <div className="flex justify-between">
                              <Label className="font-bold">{t('finanzas.montoARS')} <span className="text-red-500">*</span></Label>
                              {mappedFields.monto && <CheckCircle2 className="w-4 h-4 text-green-500 animate-in fade-in" />}
                           </div>
                           <Input
                              type="number"
                              value={formData.monto_ars}
                              onChange={(e) => handleEconomicChange('monto_ars', e.target.value)}
                              className={cn(
                                 "font-mono text-lg font-bold",
                                 mappedFields.monto && "border-green-400 bg-green-50 dark:bg-green-900/10"
                              )}
                              placeholder="0.00"
                           />
                        </div>

                        <div className="space-y-2">
                           <Label>{t('finanzas.valorUSD')}</Label>
                           <Input
                              type="number"
                              value={formData.valor_usd}
                              onChange={(e) => handleEconomicChange('valor_usd', e.target.value)}
                              className="font-mono"
                           />
                        </div>

                        <div className="space-y-2">
                           <Label>{t('finanzas.montoUSD')}</Label>
                           <div className="h-10 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 font-mono text-slate-500 flex items-center">
                              {formatCurrencyUSD(formData.monto_usd)}
                           </div>
                        </div>
                     </div>

                     <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                           <div className="flex items-center gap-2">
                              <Switch
                                 checked={formData.iva_incluido}
                                 onCheckedChange={(c) => handleEconomicChange('iva_incluido', c)}
                              />
                              <Label className="cursor-pointer" onClick={() => handleEconomicChange('iva_incluido', !formData.iva_incluido)}>
                                 {t('finanzas.ivaIncluido')}
                              </Label>
                           </div>
                           {formData.iva_incluido && (
                              <div className="flex items-center gap-2 w-24">
                                 <Input
                                    type="number"
                                    value={formData.iva_porcentaje}
                                    onChange={(e) => handleEconomicChange('iva_porcentaje', e.target.value)}
                                    className="h-8"
                                 />
                                 <span className="text-sm text-slate-500">%</span>
                              </div>
                           )}
                        </div>
                        <div className="text-right">
                           <span className="text-xs text-slate-500 uppercase font-bold mr-3">{t('finanzas.neto')}:</span>
                           <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                              {formatCurrencyARS(formData.neto)}
                           </span>
                        </div>
                     </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                     <div className="flex justify-between">
                        <Label>{t('common.notes')}</Label>
                        {mappedFields.referencia && <CheckCircle2 className="w-4 h-4 text-green-500 animate-in fade-in" />}
                     </div>
                     <textarea
                        className={cn(
                           "w-full h-24 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none",
                           mappedFields.referencia && "border-green-400 bg-green-50 dark:bg-green-900/10"
                        )}
                        value={formData.notas}
                        onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                        placeholder={t('movimientos.notes_placeholder')}
                     />
                  </div>

                  <div className="pt-4 pb-20 md:pb-0">
                     <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 h-12 text-lg shadow-lg shadow-blue-600/20"
                     >
                        {loading ? (
                           <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              {t('common.saving')}
                           </>
                        ) : (
                           <>
                              <Save className="w-5 h-5 mr-2" />
                              {t('movimientos.save_movimiento')}
                           </>
                        )}
                     </Button>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
export default NewMovementPage;