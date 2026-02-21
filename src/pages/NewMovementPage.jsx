import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
   ArrowLeft, Upload, FileText, X, Save,
   DollarSign, Image as ImageIcon, Loader2,
   TrendingDown, TrendingUp, ChevronLeft, ChevronRight, CheckCircle2, Plus, Minus, RefreshCw
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
import { format } from 'date-fns';

import { supabase } from '@/lib/customSupabaseClient';
import { cuentaService } from '@/services/cuentaService';
import { adjuntosService } from '@/services/adjuntosService';
import { recurrenciaService } from '@/services/recurrenciaService';
import { formatCurrencyARS, formatCurrencyUSD } from '@/lib/formatUtils';

import MultiProjectSelect from '@/components/movimientos/MultiProjectSelect';
import RecurrenciaConfig from '@/components/movimientos/RecurrenciaConfig';

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const NewMovementPage = () => {
   const { t } = useTranslation();
   const navigate = useNavigate();
   const { toast } = useToast();
   const [searchParams] = useSearchParams();
   const fileInputRef = useRef(null);

   const paramId = searchParams.get('id');
   const paramCuentaId = searchParams.get('cuenta_id');
   const paramProjectId = searchParams.get('project_id');
   const paramInvestorId = searchParams.get('investor_id');
   const paramType = searchParams.get('type');

   const [loading, setLoading] = useState(false);
   const [catalogsLoading, setCatalogsLoading] = useState(true);

   const [accounts, setAccounts] = useState([]);
   const [projects, setProjects] = useState([]);
   const [providers, setProviders] = useState([]);
   const [investors, setInvestors] = useState([]);
   const [clients, setClients] = useState([]);

   const [selectedFile, setSelectedFile] = useState(null);
   const [previewUrl, setPreviewUrl] = useState(null);
   const [isDragOver, setIsDragOver] = useState(false);
   const [fileType, setFileType] = useState(null);
   const [numPages, setNumPages] = useState(null);
   const [pageNumber, setPageNumber] = useState(1);
   const [pdfScale, setPdfScale] = useState(1.0);

   const [selectionMenu, setSelectionMenu] = useState(null);
   const [mappedFields, setMappedFields] = useState({});

   const [type, setType] = useState(paramType || 'GASTO');
   const [formData, setFormData] = useState({
      descripcion: '',
      fecha: format(new Date(), 'yyyy-MM-dd'),
      estado: 'PENDIENTE',
      cuenta_id: paramCuentaId || '',
      project_ids: paramProjectId ? [paramProjectId] : [],
      provider_id: '',
      client_id: '',
      inversionista_id: paramInvestorId || '',
      monto_ars: '',
      valor_usd: '0',
      monto_usd: 0,
      iva_incluido: false,
      iva_porcentaje: '20',
      neto: 0,
      notas: ''
   });

   const [esRecurrente, setEsRecurrente] = useState(false);
   const [frecuencia, setFrecuencia] = useState('mensual');
   const [fechaLimite, setFechaLimite] = useState(null);

   useEffect(() => { fetchCatalogs(); }, []);

   useEffect(() => {
      if (paramId) fetchMovementData(paramId);
   }, [paramId]);

   useEffect(() => {
      if (!paramId) fetchDolarHoy();
   }, [paramId]);

   const fetchDolarHoy = async () => {
      try {
         const response = await fetch('https://dolarapi.com/v1/dolares/oficial');
         const data = await response.json();
         if (data && data.venta) {
            const valorVenta = data.venta;
            setFormData(prev => {
               const montoArs = parseFloat(prev.monto_ars) || 0;
               const montoUsd = valorVenta > 0 ? montoArs / valorVenta : 0;
               return { ...prev, valor_usd: valorVenta.toString(), monto_usd: parseFloat(montoUsd.toFixed(2)) };
            });
            toast({ title: "Dólar Oficial Actualizado", description: `Cotización al día: $${valorVenta}`, className: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" });
         }
      } catch (error) { console.error("Error obteniendo valor del dólar:", error); }
   };

   const fetchMovementData = async (id) => {
      setLoading(true);
      try {
         const { data, error } = await supabase.from('inversiones').select('*').eq('id', id).single();
         if (error) throw error;

         if (data) {
            setType(data.tipo);
            const { data: linkedProjects } = await supabase
               .from('movimientos_proyecto')
               .select('project_id')
               .eq('movimiento_id', id);

            const projectIds = linkedProjects?.map(lp => lp.project_id) || [];
            if (projectIds.length === 0 && data.proyecto_id) {
               projectIds.push(data.proyecto_id);
            }

            setFormData({
               descripcion: data.descripcion || '',
               fecha: data.fecha,
               estado: data.estado || 'CONFIRMADO',
               cuenta_id: data.cuenta_id || '',
               project_ids: projectIds,
               provider_id: data.proveedor_id || '',
               client_id: data.cliente_id || '',
               inversionista_id: data.inversionista_id || '',
               monto_ars: data.monto_ars,
               valor_usd: data.valor_usd || 0,
               monto_usd: data.monto_usd || 0,
               iva_incluido: data.iva_incluido || false,
               iva_porcentaje: data.iva_porcentaje || 21,
               neto: data.neto || 0,
               notas: data.notas || ''
            });

            setEsRecurrente(data.es_recurrente || false);
            setFrecuencia(data.frecuencia || 'mensual');
            setFechaLimite(data.fecha_limite || null);
         }
      } catch (error) {
         console.error("Error fetching movement:", error);
         toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar el movimiento.' });
      } finally { setLoading(false); }
   };

   const fetchCatalogs = async () => {
      setCatalogsLoading(true);
      try {
         const [accData, projRes, provRes, invRes, cliRes] = await Promise.all([
            cuentaService.getCuentasActivas(),
            supabase.from('projects').select('id, name').eq('is_deleted', false).order('name'),
            supabase.from('providers').select('id, name').eq('is_deleted', false).order('name'),
            supabase.from('inversionistas').select('id, nombre').eq('estado', 'activo'),
            supabase.from('clients').select('id, name').eq('is_deleted', false).eq('status', 'active').order('name')
         ]);
         if (accData) setAccounts(accData);
         if (projRes.data) setProjects(projRes.data);
         if (provRes.data) setProviders(provRes.data);
         if (invRes.data) setInvestors(invRes.data);
         if (cliRes.data) setClients(cliRes.data);
      } catch (e) { console.error("Error loading catalogs", e); }
      finally { setCatalogsLoading(false); }
   };

   const handleFileSelect = (e) => { const file = e.target.files?.[0]; if (file) processFile(file); };
   const processFile = (file) => {
      if (file.size > 10 * 1024 * 1024) { toast({ variant: 'destructive', title: 'Error', description: 'Max 10MB' }); return; }
      setSelectedFile(file); setFileType(file.type);
      const objectUrl = URL.createObjectURL(file); setPreviewUrl(objectUrl); setPageNumber(1); setSelectionMenu(null);
   };
   const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
   const handleDragLeave = (e) => { e.preventDefault(); setIsDragOver(false); };
   const handleDrop = (e) => { e.preventDefault(); setIsDragOver(false); const file = e.dataTransfer.files?.[0]; if (file) processFile(file); };
   const clearFile = () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(null); setPreviewUrl(null); setFileType(null); setNumPages(null); setSelectionMenu(null); setMappedFields({});
      if (fileInputRef.current) fileInputRef.current.value = "";
   };
   function onDocumentLoadSuccess({ numPages }) { setNumPages(numPages); }

   const handleTextSelection = (e) => {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim().length === 0) { if (!e.target.closest('#context-menu')) setSelectionMenu(null); return; }
      setSelectionMenu({ text: selection.toString().trim(), x: e.clientX, y: e.clientY });
   };

   const mapTextToField = (field) => {
      if (!selectionMenu) return;
      const text = selectionMenu.text;
      let updatedData = { ...formData };
      let success = true;
      switch (field) {
         case 'monto':
            const cleanText = text.replace(/[^0-9,.]/g, '');
            let amount = 0;
            if (cleanText.includes(',') && cleanText.lastIndexOf(',') > cleanText.lastIndexOf('.')) {
               amount = parseFloat(cleanText.replace(/\./g, '').replace(',', '.'));
            } else { amount = parseFloat(cleanText.replace(/,/g, '')); }
            if (!isNaN(amount)) { updatedData.monto_ars = amount; handleEconomicChange('monto_ars', amount, updatedData); }
            else success = false;
            break;
         case 'descripcion': updatedData.descripcion = text; break;
         case 'fecha':
            const date = new Date(text);
            if (!isNaN(date.getTime())) updatedData.fecha = format(date, 'yyyy-MM-dd');
            else success = false;
            break;
         default: success = false;
      }
      if (success) { setFormData(updatedData); setMappedFields(prev => ({ ...prev, [field]: true })); toast({ title: "Texto mapeado", className: "bg-green-50" }); }
      window.getSelection().removeAllRanges(); setSelectionMenu(null);
   };

   const handleEconomicChange = (field, value, currentState = formData) => {
      let newFormData = { ...currentState, [field]: value };
      const montoArs = parseFloat(newFormData.monto_ars) || 0;
      const valorUsd = parseFloat(newFormData.valor_usd) || 0;
      const ivaPorcentaje = parseFloat(newFormData.iva_porcentaje) || 0;
      const montoUsd = valorUsd > 0 ? montoArs / valorUsd : 0;
      let neto = montoArs;
      if (newFormData.iva_incluido) { neto = montoArs / (1 + (ivaPorcentaje / 100)); }
      const finalData = { ...newFormData, monto_usd: montoUsd, neto: parseFloat(neto.toFixed(2)) };
      setFormData(finalData);
   };

   const validate = () => {
      if (!formData.descripcion) { toast({ variant: 'destructive', title: 'Error', description: 'Descripción requerida' }); return false; }
      if (!formData.cuenta_id) { toast({ variant: 'destructive', title: 'Error', description: 'Cuenta requerida' }); return false; }
      if (!formData.monto_ars || parseFloat(formData.monto_ars) <= 0) { toast({ variant: 'destructive', title: 'Error', description: 'Monto debe ser mayor a 0' }); return false; }
      return true;
   };

   const handleSubmit = async () => {
      if (!validate()) return;
      setLoading(true);
      try {
         const mainProjectId = formData.project_ids.length > 0 ? formData.project_ids[0] : null;
         const payload = {
            tipo: type,
            descripcion: formData.descripcion,
            fecha: formData.fecha,
            estado: formData.estado,
            cuenta_id: formData.cuenta_id,
            proyecto_id: mainProjectId,
            proveedor_id: type === 'INGRESO' ? null : (formData.provider_id || null),
            cliente_id: type === 'INGRESO' ? (formData.client_id || null) : null,
            inversionista_id: (type === 'INVERSION' || type === 'DEVOLUCION') ? (formData.inversionista_id || null) : null,
            monto_ars: parseFloat(formData.monto_ars),
            valor_usd: parseFloat(formData.valor_usd) || 0,
            monto_usd: parseFloat(formData.monto_usd) || 0,
            iva_incluido: formData.iva_incluido,
            iva_porcentaje: parseFloat(formData.iva_porcentaje) || 0,
            neto: parseFloat(formData.neto) || 0,
            notas: formData.notas,
            es_recurrente: esRecurrente,
            frecuencia: esRecurrente ? frecuencia : null,
            fecha_limite: esRecurrente ? fechaLimite : null,
            recurrencia_activa: esRecurrente
         };

         let data, error;
         if (paramId) {
            const res = await supabase.from('inversiones').update(payload).eq('id', paramId).select().single();
            data = res.data; error = res.error;
         } else {
            const res = await supabase.from('inversiones').insert([payload]).select().single();
            data = res.data; error = res.error;
         }

         if (error) throw error;

         if (formData.project_ids.length > 0) {
            const montoTotal = parseFloat(formData.monto_ars) || 0;
            const cantProyectos = formData.project_ids.length;
            const montoPorProyecto = parseFloat((montoTotal / cantProyectos).toFixed(2));
            await supabase.from('movimientos_proyecto').delete().eq('movimiento_id', data.id);
            const links = formData.project_ids.map(projId => ({
               movimiento_id: data.id,
               project_id: projId,
               porcentaje: parseFloat((100 / cantProyectos).toFixed(2)),
               monto_prorrateado: montoPorProyecto
            }));
            await supabase.from('movimientos_proyecto').insert(links);
         }

         if (esRecurrente && !paramId) {
            try { await recurrenciaService.activarRecurrencia(data.id, frecuencia, formData.fecha, fechaLimite); } 
            catch (recError) { console.error(recError); }
         } else if (paramId && !esRecurrente) {
            try { await recurrenciaService.desactivarRecurrencia(data.id); } catch (e) {}
         }

         if (selectedFile) {
            try { await adjuntosService.uploadAdjunto(selectedFile, data.id); } catch (e) {}
         }

         toast({ title: t('common.success'), className: 'bg-green-50 border-green-200' });
         navigate(-1);
      } catch (error) {
         toast({ variant: 'destructive', title: t('common.error'), description: error.message });
      } finally { setLoading(false); }
   };

   return (
      <div className="flex h-screen bg-white dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-300">
         {/* LEFT COLUMN: PREVIEW & SELECTION */}
         <div className="hidden md:flex w-1/2 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col relative" onMouseUp={handleTextSelection}>
            <div className="absolute top-6 left-6 z-30">
               {/* BOTÓN VOLVER CORREGIDO */}
               <Button variant="outline" className="bg-white/80 dark:bg-slate-800/80 dark:text-slate-200 dark:border-slate-700 backdrop-blur shadow-sm hover:bg-white dark:hover:bg-slate-700" onClick={() => navigate(-1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> {t('common.back')}
               </Button>
            </div>
            <div className="flex-1 flex flex-col p-8 overflow-hidden relative">
               {selectedFile && previewUrl ? (
                  <div className="flex-1 flex flex-col min-h-0">
                     <div className="flex justify-end gap-2 mb-4">
                        <Button size="sm" variant="secondary" className="dark:bg-slate-800 dark:hover:bg-slate-700" onClick={() => document.getElementById('file-upload').click()}><Upload className="w-3 h-3 mr-2" /> Cambiar</Button>
                        <Button size="sm" variant="destructive" onClick={clearFile}><X className="w-3 h-3 mr-2" /> Borrar</Button>
                     </div>
                     <div className="flex-1 overflow-auto bg-slate-200/50 dark:bg-slate-950/50 rounded-lg border dark:border-slate-800 shadow-inner">
                        {fileType?.includes('pdf') ? (
                           <div className="flex justify-center p-6"><Document file={selectedFile} onLoadSuccess={onDocumentLoadSuccess}><Page pageNumber={pageNumber} scale={pdfScale} className="shadow-xl" /></Document></div>
                        ) : (
                           <div className="flex items-center justify-center min-h-full p-6"><img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain shadow-lg rounded-md" /></div>
                        )}
                     </div>
                     {selectionMenu && (
                        <div className="fixed z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border dark:border-slate-700 p-1 w-56" style={{ top: selectionMenu.y + 10, left: selectionMenu.x }}>
                           <button onClick={() => mapTextToField('monto')} className="w-full text-left px-2 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded dark:text-slate-200">💲 Monto</button>
                           <button onClick={() => mapTextToField('descripcion')} className="w-full text-left px-2 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded dark:text-slate-200">📝 Concepto</button>
                        </div>
                     )}
                  </div>
               ) : (
                  <div className="w-full max-w-md aspect-square border-3 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors mx-auto my-auto"
                     onClick={() => fileInputRef.current?.click()} onDragOver={handleDragOver} onDrop={handleDrop}>
                     <input ref={fileInputRef} id="file-upload" type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileSelect} />
                     {/* ICONO UPLOAD CORREGIDO */}
                     <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6 text-blue-500 dark:text-blue-400 transition-colors"><Upload className="w-10 h-10" /></div>
                     <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">{t('movimientos.drag_drop_title')}</h3>
                     <p className="text-slate-500 dark:text-slate-400 text-center mb-6">{t('movimientos.drag_drop_subtitle')}</p>
                     <Button className="rounded-full px-8 pointer-events-none bg-blue-600 dark:bg-blue-600">{t('movimientos.select_file')}</Button>
                  </div>
               )}
            </div>
         </div>

         {/* RIGHT COLUMN: FORM */}
         <div className="w-full md:w-1/2 flex flex-col h-full bg-white dark:bg-slate-950 border-l dark:border-slate-900">
            <div className="h-16 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
               <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                  {paramId ? 'Editar Movimiento' : t('movimientos.new_title')}
               </h1>
               <div className="flex items-center gap-2">
                  <Button variant="ghost" className="dark:text-slate-400" onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
                  <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 shadow-md shadow-blue-500/10">
                     {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                     {t('common.save')}
                  </Button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10">
               <div className="max-w-2xl mx-auto space-y-8">

                  {/* Tipo de movimiento CORREGIDO */}
                  <div className="space-y-3">
                     <Label className="dark:text-slate-300">{t('movimientos.type')}</Label>
                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {['GASTO', 'INGRESO', 'INVERSION', 'DEVOLUCION'].map((tType) => (
                           <button 
                             key={tType} 
                             onClick={() => setType(tType)} 
                             className={cn(
                               "flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs lg:text-sm font-bold transition-all border shadow-sm",
                               type === tType 
                                 ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-white scale-[1.02]' 
                                 : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                             )}
                           >
                              {tType === 'GASTO' || tType === 'DEVOLUCION' ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                              {t(`finanzas.${tType.toLowerCase()}`)}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="col-span-2 space-y-2">
                        <Label className="dark:text-slate-300">{t('movimientos.description')}</Label>
                        <Input value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} className="text-lg font-medium dark:bg-slate-900 dark:border-slate-800 dark:text-white" />
                     </div>
                     <div className="space-y-2">
                        <Label className="dark:text-slate-300">{t('movimientos.account')}</Label>
                        <Select value={formData.cuenta_id} onValueChange={(val) => setFormData({ ...formData, cuenta_id: val })}>
                           <SelectTrigger className="dark:bg-slate-900 dark:border-slate-800"><SelectValue placeholder={t('finanzas.seleccionarCuenta')} /></SelectTrigger>
                           <SelectContent>{accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.titulo}</SelectItem>)}</SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-2">
                        <Label className="dark:text-slate-300">{t('common.date')}</Label>
                        <DatePickerInput date={formData.fecha ? new Date(formData.fecha + 'T12:00:00') : null} onSelect={(d) => d && setFormData({ ...formData, fecha: format(d, 'yyyy-MM-dd') })} />
                     </div>
                     {/* ... Lógica de Cliente/Proveedor/Inversor se adapta por componentes Select hijos ... */}
                     <div className="space-y-2 col-span-2 md:col-span-1">
                        <Label className="dark:text-slate-300">Proyecto(s)</Label>
                        <MultiProjectSelect projects={projects} selectedIds={formData.project_ids} onChange={(ids) => setFormData({ ...formData, project_ids: ids })} placeholder="Seleccionar..." />
                     </div>
                  </div>

                  {/* Sección Económica Corregida */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div className="space-y-2.5">
                           <Label className="font-bold text-blue-600 dark:text-blue-400 block ml-1">Monto Total (ARS)</Label>
                           <Input type="number" value={formData.monto_ars} onChange={(e) => handleEconomicChange('monto_ars', e.target.value)} className="font-mono text-lg font-bold bg-white dark:bg-slate-950 h-12 rounded-xl shadow-sm dark:border-slate-800" placeholder="0.00" />
                        </div>
                        <div className="space-y-2.5">
                           <div className="flex items-center justify-between px-1">
                              <Label className="font-bold text-slate-700 dark:text-slate-300 text-sm">Cotización</Label>
                              <button onClick={(e) => { e.preventDefault(); fetchDolarHoy(); }} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                 <RefreshCw className="w-3 h-3" /> Actualizar
                              </button>
                           </div>
                           <Input type="number" value={formData.valor_usd} onChange={(e) => handleEconomicChange('valor_usd', e.target.value)} className="font-mono text-lg bg-white dark:bg-slate-950 h-12 rounded-xl text-center dark:border-slate-800" />
                        </div>
                        <div className="space-y-2.5">
                           <Label className="font-bold text-slate-500 dark:text-slate-400 block ml-1 text-sm">Equivalente USD</Label>
                           <div className="h-12 px-4 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono text-lg font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                              {formatCurrencyUSD(formData.monto_usd)}
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <Label className="dark:text-slate-300">Notas</Label>
                     <textarea className="w-full h-24 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-colors" value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} />
                  </div>

                  <div className="pt-4 pb-20 md:pb-0">
                     <Button onClick={handleSubmit} disabled={loading} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-full px-10 h-14 text-lg shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                        {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                        {paramId ? 'Actualizar Movimiento' : t('common.save')}
                     </Button>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
export default NewMovementPage;