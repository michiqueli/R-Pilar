
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, DollarSign, Percent, UploadCloud, FileText, Trash2, ArrowUpCircle, ArrowDownCircle, AlertTriangle, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/ThemeProvider';
import { tokens } from '@/lib/designTokens';
import { supabase } from '@/lib/customSupabaseClient';
import DatePickerInput from '@/components/ui/DatePickerInput';
import { movimientoService } from '@/services/movimientoService';
import { projectService } from '@/services/projectService';
import { investorService } from '@/services/investorService';
import { formatDate, formatCurrencyARS, formatCurrencyUSD } from '@/lib/formatUtils';

const MovimientoModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  movimiento = null, 
  initialType = 'gasto', 
  initialProjectId = null 
}) => {
  const { t } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Catalogs
  const [projects, setProjects] = useState([]);
  const [partidas, setPartidas] = useState([]);
  const [providers, setProviders] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [existingFileUrl, setExistingFileUrl] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    type: 'gasto', // gasto | ingreso | INVERSION_RECIBIDA | DEVOLUCION_INVERSION
    projectId: '',
    partidaId: '',
    providerId: '',
    accountId: '',
    inversionistaId: '',
    categoryId: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'Pendiente', 
    amount_ars: '',
    fx_rate: '1500', 
    vat_included: false,
    vat_percent: '21',
  });

  // Calculated State
  const [calculated, setCalculated] = useState({
    net_amount: 0,
    vat_amount: 0,
    total_amount: 0,
    usd_amount: 0
  });

  useEffect(() => {
    if (isOpen) {
      fetchCatalogs();
      if (movimiento) {
        initializeEditMode(movimiento);
      } else {
        initializeCreateMode();
      }
    } else {
      setSelectedFile(null);
      setExistingFileUrl(null);
      setPartidas([]);
    }
  }, [isOpen, movimiento, initialType, initialProjectId]);

  useEffect(() => {
    if (formData.projectId) {
      fetchPartidasForProject(formData.projectId);
    } else {
      setPartidas([]);
      setFormData(prev => ({ ...prev, partidaId: '' }));
    }
  }, [formData.projectId]);

  useEffect(() => {
    calculateAmounts();
  }, [formData.amount_ars, formData.fx_rate, formData.vat_included, formData.vat_percent]);

  const initializeCreateMode = () => {
    setFormData({
      type: initialType === 'gasto' || initialType === 'ingreso' ? initialType : initialType,
      projectId: initialProjectId || '',
      partidaId: '',
      providerId: '',
      accountId: '',
      inversionistaId: '',
      categoryId: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      status: 'Pendiente',
      amount_ars: '',
      fx_rate: '1500', 
      vat_included: false,
      vat_percent: '21',
    });
    setExistingFileUrl(null);
    setSelectedFile(null);
  };

  const initializeEditMode = (mov) => {
    setFormData({
      type: mov.tipo_movimiento || mov.type,
      projectId: mov.project_id || mov.projectId || '',
      partidaId: mov.partidaId || mov.work_item_id || '',
      providerId: mov.provider_id || mov.responsibleId || '',
      accountId: mov.account_id || mov.responsibleId || '',
      inversionistaId: mov.inversionista_id || '',
      categoryId: mov.expense_type_id || mov.categoryId || '',
      description: mov.description || '',
      date: mov.date || mov.expense_date || mov.income_date,
      notes: mov.notes || '',
      status: mov.status || 'Pendiente',
      amount_ars: mov.amount_ars || mov.amount || '',
      fx_rate: mov.fx_rate || '1500',
      vat_included: mov.vat_included || false,
      vat_percent: mov.vat_percent || '21'
    });
    setExistingFileUrl(mov.comprobante_url || null);
    setSelectedFile(null);
  };

  const fetchCatalogs = async () => {
    const [projs, provs, accs, cats, invs] = await Promise.all([
      supabase.from('projects').select('id, name').eq('is_deleted', false).order('name'),
      supabase.from('providers').select('id, name').eq('is_deleted', false).order('name'),
      supabase.from('accounts').select('id, name').eq('is_deleted', false).order('name'),
      supabase.from('catalog_expense_type').select('id, name').eq('is_active', true),
      investorService.getInvestors()
    ]);
    
    setProjects(projs.data || []);
    setProviders(provs.data || []);
    setAccounts(accs.data || []);
    setExpenseTypes(cats.data || []);
    setInvestors(invs || []);
  };

  const fetchPartidasForProject = async (projId) => {
    try {
      const data = await projectService.getProjectPartidas(projId);
      setPartidas(data || []);
    } catch (err) {
      console.error("Error loading partidas", err);
    }
  };

  const calculateAmounts = () => {
    const amount = parseFloat(formData.amount_ars) || 0;
    const rate = parseFloat(formData.fx_rate) || 1;
    const vatPct = parseFloat(formData.vat_percent) || 0;
    
    let net = 0;
    let vat = 0;
    let total = 0;

    if (formData.vat_included) {
      total = amount;
      net = total / (1 + (vatPct / 100));
      vat = total - net;
    } else {
      net = amount;
      vat = net * (vatPct / 100);
      total = net + vat;
    }

    setCalculated({
      net_amount: net,
      vat_amount: vat,
      total_amount: total,
      usd_amount: rate > 0 ? total / rate : 0
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    validateAndSetFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    if (!file) return;
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast({ variant: 'destructive', title: t('common.error'), description: 'Formato no válido. Solo PDF, JPG, PNG.' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: 'destructive', title: t('common.error'), description: 'Archivo demasiado grande. Máximo 10MB.' });
      return;
    }
    setSelectedFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeExistingFile = async () => {
    if (window.confirm('¿Eliminar comprobante existente?')) {
        setExistingFileUrl(null); 
    }
  };

  const handleSubmit = async () => {
    if (!formData.projectId) return toast({ variant: 'destructive', title: 'Error', description: t('movimientos.project_required') });
    if (!formData.description.trim()) return toast({ variant: 'destructive', title: 'Error', description: t('movimientos.description_required') });
    if (!formData.amount_ars || parseFloat(formData.amount_ars) <= 0) return toast({ variant: 'destructive', title: 'Error', description: t('movimientos.amount_invalid') });
    
    // Type specific validation
    if ((formData.type === 'INVERSION_RECIBIDA' || formData.type === 'DEVOLUCION_INVERSION') && !formData.inversionistaId) {
        return toast({ variant: 'destructive', title: 'Error', description: 'El inversionista es obligatorio' });
    }
    
    setLoading(true);
    try {
      let finalPartidaId = formData.partidaId;
      
      if (formData.type === 'gasto' && !finalPartidaId) {
          const defaultPartida = await projectService.ensureDefaultPartida(formData.projectId);
          if (defaultPartida) {
              finalPartidaId = defaultPartida.id;
          }
      }

      let finalFileUrl = existingFileUrl;
      if (selectedFile) {
        finalFileUrl = await movimientoService.uploadComprobante(selectedFile);
      }

      const payload = {
        type: formData.type,
        tipo_movimiento: formData.type,
        projectId: formData.projectId,
        partidaId: finalPartidaId,
        description: formData.description,
        amount: calculated.total_amount, 
        amount_ars: parseFloat(formData.amount_ars),
        category: formData.categoryId,
        responsible: formData.type === 'gasto' ? formData.providerId : formData.accountId,
        // Inversionista logic handled in service via inversionista_id field
        inversionista_id: formData.inversionistaId,
        date: formData.date,
        notes: formData.notes,
        status: formData.status,
        fx_rate: parseFloat(formData.fx_rate),
        usd_amount: calculated.usd_amount,
        vat_percent: parseFloat(formData.vat_percent),
        vat_included: formData.vat_included,
        net_amount: calculated.net_amount,
        vat_amount: calculated.vat_amount,
        comprobante_url: finalFileUrl
      };

      if (movimiento) {
        await movimientoService.updateMovimiento(movimiento.id, payload);
        toast({ title: t('common.success'), description: t('movimientos.updated') });
      } else {
        await movimientoService.createMovimiento(payload);
        toast({ title: t('common.success'), description: t('movimientos.created') });
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('common.error'), description: error.message || 'Error al guardar' });
    } finally {
      setLoading(false);
    }
  };

  const isGasto = formData.type === 'gasto';
  const isInversion = formData.type === 'INVERSION_RECIBIDA';
  const isDevolucion = formData.type === 'DEVOLUCION_INVERSION';
  const isInvestmentType = isInversion || isDevolucion;

  const getTypeColor = () => {
      if (isGasto || isDevolucion) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      if (isInversion) return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400';
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  };

  const getTypeIcon = () => {
      if (isGasto || isDevolucion) return <ArrowDownCircle className="w-3 h-3"/>;
      if (isInversion) return <Briefcase className="w-3 h-3"/>;
      return <ArrowUpCircle className="w-3 h-3"/>;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 w-full max-w-[800px] shadow-2xl flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800 h-[90vh]"
            style={{ borderRadius: tokens.radius.modal }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10">
              <div className="flex items-center gap-3">
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                   {movimiento ? t('movimientos.edit_movimiento') : t('movimientos.new_movimiento')}
                 </h2>
                 <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getTypeColor()}`}>
                   {getTypeIcon()}
                   {formData.type === 'INVERSION_RECIBIDA' ? 'Inversión' : formData.type === 'DEVOLUCION_INVERSION' ? 'Devolución' : formData.type.toUpperCase()}
                 </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/50 custom-scrollbar">
              
              {/* Type Selector */}
              <div className="space-y-2">
                 <Label>Tipo de Movimiento</Label>
                 <select
                   className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                   value={formData.type}
                   onChange={(e) => setFormData({...formData, type: e.target.value})}
                 >
                   <option value="ingreso">Ingreso</option>
                   <option value="gasto">Gasto</option>
                   <option value="INVERSION_RECIBIDA">Inversión Recibida</option>
                   <option value="DEVOLUCION_INVERSION">Devolución de Inversión</option>
                 </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label>Proyecto <span className="text-red-500">*</span></Label>
                    <select
                      className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
                      value={formData.projectId}
                      onChange={(e) => setFormData({...formData, projectId: e.target.value})}
                      disabled={!!initialProjectId}
                    >
                      <option value="">Seleccionar Proyecto</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                 </div>
                 
                 {isGasto && (
                   <div className="space-y-2">
                      <Label>Partida</Label>
                      <select
                        className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        value={formData.partidaId}
                        onChange={(e) => setFormData({...formData, partidaId: e.target.value})}
                        disabled={!formData.projectId}
                      >
                        <option value="">
                             {partidas.length === 0 && formData.projectId 
                               ? 'Sin partidas disponibles (Gastos Generales)' 
                               : 'Seleccionar Partida (Opcional)'}
                        </option>
                        {partidas.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                   </div>
                 )}

                 {isInvestmentType && (
                    <div className="space-y-2">
                        <Label>Inversionista <span className="text-red-500">*</span></Label>
                        <select
                          className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          value={formData.inversionistaId}
                          onChange={(e) => setFormData({...formData, inversionistaId: e.target.value})}
                        >
                          <option value="">Seleccionar Inversionista</option>
                          {investors.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                        </select>
                    </div>
                 )}

                 {!isGasto && !isInvestmentType && (
                    <div className="space-y-2">
                       <Label>Cuenta / Destino</Label>
                       <select
                         className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                         value={formData.accountId}
                         onChange={(e) => setFormData({...formData, accountId: e.target.value})}
                       >
                         <option value="">Seleccionar Cuenta</option>
                         {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                       </select>
                    </div>
                 )}
              </div>

              <div className="space-y-4">
                 <div className="space-y-2">
                    <Label>{t('common.description')} <span className="text-red-500">*</span></Label>
                    <textarea
                      className="w-full min-h-[80px] rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y transition-all"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Descripción del movimiento..."
                    />
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label>{t('common.date')}</Label>
                       <DatePickerInput
                         date={formData.date ? new Date(formData.date) : null}
                         onSelect={(d) => setFormData({...formData, date: d ? d.toISOString().split('T')[0] : ''})}
                         className="w-full h-11"
                       />
                    </div>
                    
                    {isGasto && (
                       <div className="space-y-2">
                          <Label>Proveedor (Opcional)</Label>
                          <select
                            className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.providerId}
                            onChange={(e) => setFormData({...formData, providerId: e.target.value})}
                          >
                            <option value="">Seleccionar Proveedor</option>
                            {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                       </div>
                    )}
                    
                    {(isGasto || isDevolucion) && (
                       <div className="space-y-2">
                          <Label>Estado</Label>
                          <select
                            className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                          >
                            <option value="Pendiente">Pendiente</option>
                            <option value="Pagado">Pagado</option>
                            <option value="Cancelado">Cancelado</option>
                          </select>
                       </div>
                    )}

                    {(!isGasto && !isDevolucion) && (
                       <div className="space-y-2">
                          <Label>Estado</Label>
                          <select
                            className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                          >
                            <option value="Pendiente">Pendiente</option>
                            <option value="Cobrado">Cobrado</option>
                            <option value="Cancelado">Cancelado</option>
                          </select>
                       </div>
                    )}
                 </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-sm">
                 <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900 dark:text-white">Detalle Económico</h3>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                       <Label className="text-xs uppercase font-bold text-slate-500">Monto Total (ARS) <span className="text-red-500">*</span></Label>
                       <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.amount_ars}
                            onChange={(e) => setFormData({...formData, amount_ars: e.target.value})}
                            placeholder="0.00"
                            className="pl-8 text-lg font-bold h-12"
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-xs uppercase font-bold text-slate-500">Valor USD (ARS/USD)</Label>
                       <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-400 font-bold">U$</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.fx_rate}
                            onChange={(e) => setFormData({...formData, fx_rate: e.target.value})}
                            className="pl-9 h-12"
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-xs uppercase font-bold text-slate-500">Monto (USD)</Label>
                       <div className="w-full h-12 px-3 flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-sm font-semibold text-slate-600 dark:text-slate-400">
                          {formatCurrencyUSD(calculated.usd_amount)}
                       </div>
                    </div>
                 </div>

                 <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />

                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-2">
                          <Label htmlFor="vat-toggle" className="text-sm cursor-pointer select-none">IVA Incluido</Label>
                          <Switch 
                             id="vat-toggle"
                             checked={formData.vat_included}
                             onCheckedChange={(checked) => setFormData({...formData, vat_included: checked})}
                          />
                       </div>
                       <div className="w-24 relative">
                          <Input
                             type="number"
                             value={formData.vat_percent}
                             onChange={(e) => setFormData({...formData, vat_percent: e.target.value})}
                             className="h-9 pr-7 text-sm"
                          />
                          <Percent className="absolute right-2 top-2.5 w-3 h-3 text-slate-400" />
                       </div>
                    </div>
                    <div className="text-right">
                       <span className="text-xs text-slate-500 uppercase font-bold mr-2">Neto:</span>
                       <span className="font-mono font-medium">{formatCurrencyARS(calculated.net_amount)}</span>
                    </div>
                 </div>
              </div>

              <div className="space-y-2">
                <Label>Comprobante ({t('common.optional')})</Label>
                {existingFileUrl && !selectedFile ? (
                   <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                            <FileText className="w-5 h-5" />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Comprobante Adjunto</span>
                            <a href={existingFileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">Ver archivo</a>
                         </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={removeExistingFile} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                         <Trash2 className="w-4 h-4" />
                      </Button>
                   </div>
                ) : (
                  <div 
                    className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all ${
                       selectedFile 
                         ? 'border-green-300 bg-green-50 dark:bg-green-900/10 dark:border-green-800' 
                         : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900'
                    }`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                  >
                     <input
                       type="file"
                       ref={fileInputRef}
                       onChange={handleFileSelect}
                       className="hidden"
                       accept=".pdf,.jpg,.jpeg,.png"
                     />
                     
                     {selectedFile ? (
                        <div className="flex flex-col items-center gap-2">
                           <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2">
                              <FileText className="w-6 h-6" />
                           </div>
                           <p className="text-sm font-medium text-green-700 dark:text-green-400">{selectedFile.name}</p>
                           <p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                           <Button variant="ghost" size="sm" onClick={removeFile} className="mt-2 text-red-500 hover:bg-red-50 h-8">
                              Eliminar selección
                           </Button>
                        </div>
                     ) : (
                        <div className="flex flex-col items-center gap-3 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                           <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                              <UploadCloud className="w-6 h-6" />
                           </div>
                           <div>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Arrastra un archivo aquí o haz click</p>
                              <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG (Max 10MB)</p>
                           </div>
                        </div>
                     )}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 flex items-center justify-end gap-3 shrink-0 z-10">
              <Button variant="outline" onClick={onClose} className="rounded-full px-6" disabled={loading}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={loading}
                className="rounded-full px-8 shadow-lg shadow-blue-500/20"
              >
                <Save className="w-4 h-4 mr-2" />
                {t('movimientos.save_movimiento')}
              </Button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MovimientoModal;
