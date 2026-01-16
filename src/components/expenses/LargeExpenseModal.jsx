
import React, { useState, useEffect, useRef } from 'react';
import { X, UploadCloud, Plus, AlertCircle, Calendar, RefreshCw, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Chip } from '@/components/ui/Chip';
import { Switch } from '@/components/ui/switch';
import { tokens } from '@/lib/designTokens';
import { ExchangeRateService } from '@/services/ExchangeRateService';
import FilePreview from '@/components/ui/FilePreview';
import VatSummary from '@/components/expenses/VatSummary';
import ProviderModal from '@/components/providers/ProviderModal';

function LargeExpenseModal({ isOpen, onClose, onSuccess, expense = null }) {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  
  // -- Data State --
  const [catalogs, setCatalogs] = useState({
    projects: [],
    accounts: [],
    providers: [],
    expenseTypes: [],
    paymentStatuses: []
  });

  // -- Form State --
  const [loading, setLoading] = useState(false);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [file, setFile] = useState(null);
  
  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
    project_id: '',
    account_id: '',
    expense_type_id: '',
    payment_status_id: '',
    provider_id: '',
    receipt_note: '',
    attachment_url: '',
    
    // Amounts & Currency
    currency: 'ARS',
    amount: '', // The input amount (face value)
    
    // VAT Logic
    vat_included: false,
    vat_rate: 21,
    
    // Exchange Rate
    exchange_rate_usd_ars: '', // Stored as string for input, converted to number for logic
    exchange_rate_date: new Date().toISOString().split('T')[0],
  });

  // -- Calculated Values --
  const [calculations, setCalculations] = useState({
    net: 0,
    vat: 0,
    total: 0
  });

  // -- Init --
  useEffect(() => {
    if (isOpen) {
      fetchCatalogs();
      if (expense) {
        setFormData({
          expense_date: expense.expense_date,
          description: expense.description,
          project_id: expense.project_id || '',
          account_id: expense.account_id || '',
          expense_type_id: expense.expense_type_id || '',
          payment_status_id: expense.payment_status_id || '',
          provider_id: expense.provider_id || '',
          receipt_note: expense.receipt_note || '',
          attachment_url: expense.attachment_url || '',
          currency: expense.currency || 'ARS',
          amount: expense.amount || '', // Assuming amount is the face value
          vat_included: expense.vat_included || false,
          vat_rate: expense.vat_rate !== null ? expense.vat_rate : 21,
          exchange_rate_usd_ars: expense.exchange_rate_usd_ars || '',
          exchange_rate_date: expense.exchange_rate_date || new Date().toISOString().split('T')[0],
        });
        setFile(null); // Reset file on edit init, user sees url
      } else {
        // Reset for new
        setFormData({
          expense_date: new Date().toISOString().split('T')[0],
          description: '',
          project_id: '',
          account_id: '',
          expense_type_id: '',
          payment_status_id: '',
          provider_id: '',
          receipt_note: '',
          attachment_url: '',
          currency: 'ARS',
          amount: '',
          vat_included: false,
          vat_rate: 21,
          exchange_rate_usd_ars: '',
          exchange_rate_date: new Date().toISOString().split('T')[0],
        });
        setFile(null);
      }
    }
  }, [isOpen, expense]);

  const fetchCatalogs = async () => {
    const [projects, accounts, providers, types, statuses] = await Promise.all([
      supabase.from('projects').select('id, name, base_currency').eq('is_deleted', false),
      supabase.from('accounts').select('id, name').eq('is_active', true).eq('is_deleted', false),
      supabase.from('providers').select('id, name').eq('is_active', true).eq('is_deleted', false),
      supabase.from('catalog_expense_type').select('id, name').eq('is_active', true).eq('is_deleted', false),
      supabase.from('catalog_payment_status').select('id, name').eq('is_active', true).eq('is_deleted', false)
    ]);

    setCatalogs({
      projects: projects.data || [],
      accounts: accounts.data || [],
      providers: providers.data || [],
      expenseTypes: types.data || [],
      paymentStatuses: statuses.data || []
    });
  };

  // -- Logic: Currency & Rate --
  useEffect(() => {
    if (formData.currency === 'USD' && !expense) {
       // Only fetch automatically if it's a NEW expense. 
       // For edits, we preserve the stored rate unless user changes currency now.
       // However, here we just check if rate is empty to avoid overwriting manual edits during creation.
       if (!formData.exchange_rate_usd_ars) {
         fetchRate();
       }
    }
  }, [formData.currency]);

  const fetchRate = async () => {
    try {
      const rate = await ExchangeRateService.getUsdArsRate();
      setFormData(prev => ({ 
        ...prev, 
        exchange_rate_usd_ars: rate,
        exchange_rate_date: new Date().toISOString().split('T')[0]
      }));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error cotización', description: 'No se pudo obtener cotización automática.' });
    }
  };

  // -- Logic: VAT Calculation --
  useEffect(() => {
    const rawAmount = parseFloat(formData.amount) || 0;
    const rate = parseFloat(formData.vat_rate) || 0;
    
    let net = 0;
    let vat = 0;
    let total = 0;

    if (formData.vat_included) {
      // Amount is Total
      total = rawAmount;
      if (rate === 0) {
        net = total;
        vat = 0;
      } else {
        net = total / (1 + (rate / 100));
        vat = total - net;
      }
    } else {
      // Amount is Net
      net = rawAmount;
      vat = net * (rate / 100);
      total = net + vat;
    }

    setCalculations({ net, vat, total });
  }, [formData.amount, formData.vat_included, formData.vat_rate]);

  // -- Handlers --

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.expense_date) return toast({ variant: 'destructive', title: 'Error', description: 'Fecha requerida' });
    if (!formData.description) return toast({ variant: 'destructive', title: 'Error', description: 'Descripción requerida' });
    if (!formData.project_id) return toast({ variant: 'destructive', title: 'Error', description: 'Proyecto requerido' });
    if (!formData.account_id) return toast({ variant: 'destructive', title: 'Error', description: 'Cuenta requerida' });
    if (!formData.expense_type_id) return toast({ variant: 'destructive', title: 'Error', description: 'Tipo requerido' });
    if (!formData.payment_status_id) return toast({ variant: 'destructive', title: 'Error', description: 'Estado requerido' });
    if (!formData.amount || parseFloat(formData.amount) <= 0) return toast({ variant: 'destructive', title: 'Error', description: 'Monto inválido' });

    setLoading(true);
    try {
      let attachmentUrl = formData.attachment_url;

      // Upload file if present
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `expenses/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('objects').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('objects').getPublicUrl(filePath);
        attachmentUrl = publicUrlData.publicUrl;
      }

      // Prepare Payload
      // 'amount' in DB usually stores the final total face value in the recorded currency
      // We will store calculation results in respective columns
      
      const payload = {
        expense_date: formData.expense_date,
        description: formData.description,
        project_id: formData.project_id,
        account_id: formData.account_id,
        expense_type_id: formData.expense_type_id,
        payment_status_id: formData.payment_status_id,
        provider_id: formData.provider_id || null,
        receipt_note: formData.receipt_note,
        attachment_url: attachmentUrl,
        
        currency: formData.currency,
        amount: calculations.total, // Total Face Value in 'currency'
        
        // New Fields
        amount_original: parseFloat(formData.amount), // The input value (could be net or total depending on included flag, but usually tracked for reference)
        net_amount: calculations.net,
        vat_amount: calculations.vat,
        vat_rate: formData.vat_rate,
        vat_included: formData.vat_included,
        
        // Exchange Rate Logic
        exchange_rate_usd_ars: formData.currency === 'USD' ? parseFloat(formData.exchange_rate_usd_ars) : null,
        exchange_rate_date: formData.currency === 'USD' ? formData.exchange_rate_date : null,
        amount_ars: formData.currency === 'ARS' 
          ? calculations.total 
          : (calculations.total * (parseFloat(formData.exchange_rate_usd_ars) || 0)),

        updated_at: new Date().toISOString()
      };

      if (expense) {
        const { error } = await supabase.from('expenses').update(payload).eq('id', expense.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('expenses').insert([{ ...payload, is_deleted: false }]);
        if (error) throw error;
      }

      toast({ title: 'Éxito', description: 'Gasto guardado correctamente' });
      onSuccess();
      onClose();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
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
            className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[90vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {expense ? 'Editar Gasto' : 'Nuevo Gasto'}
                </h2>
                {expense && (
                  <Chip 
                    label={catalogs.paymentStatuses.find(s => s.id === formData.payment_status_id)?.name || 'BORRADOR'} 
                    variant={catalogs.paymentStatuses.find(s => s.id === formData.payment_status_id)?.name === 'PAGADO' ? 'success' : 'warning'} 
                  />
                )}
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Layout */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* Left Column: Preview (40%) */}
              <div className="hidden lg:flex w-[40%] bg-slate-50 dark:bg-slate-950/50 border-r border-slate-100 dark:border-slate-800 p-6 flex-col relative">
                {(!file && !formData.attachment_url) ? (
                  <div 
                    className="flex-1 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center p-8 transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-900/50 cursor-pointer"
                    onDrop={handleFileDrop}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Sube tu factura</h3>
                    <p className="text-sm text-slate-500 max-w-[250px] mb-6">
                      Arrastra y suelta aquí o haz clic para buscar.
                    </p>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setFile(e.target.files[0])} accept="image/*,.pdf" />
                  </div>
                ) : (
                  <div className="flex-1 relative h-full">
                    <FilePreview 
                      file={file} 
                      url={formData.attachment_url} 
                      onRemove={() => { setFile(null); setFormData(prev => ({...prev, attachment_url: ''})); }}
                      onReplace={() => fileInputRef.current?.click()}
                    />
                     <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setFile(e.target.files[0])} accept="image/*,.pdf" />
                  </div>
                )}
              </div>

              {/* Right Column: Form (60%) */}
              <div className="w-full lg:w-[60%] overflow-y-auto p-6 lg:p-10 bg-white dark:bg-slate-900">
                <div className="max-w-2xl mx-auto space-y-8">
                  
                  {/* Basic Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label>Fecha de Gasto <span className="text-red-500">*</span></Label>
                       <div className="relative">
                         <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                         <Input 
                            type="date" 
                            value={formData.expense_date} 
                            onChange={(e) => handleChange('expense_date', e.target.value)}
                            className="pl-10"
                         />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <Label>Comprobante #</Label>
                       <Input 
                          placeholder="0001-00000000" 
                          value={formData.receipt_note} 
                          onChange={(e) => handleChange('receipt_note', e.target.value)}
                        />
                    </div>
                    <div className="col-span-full space-y-2">
                       <Label>Descripción <span className="text-red-500">*</span></Label>
                       <Input 
                          placeholder="Ej. Compra de materiales para obra" 
                          value={formData.description} 
                          onChange={(e) => handleChange('description', e.target.value)}
                        />
                    </div>
                  </div>

                  {/* Classification Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label>Proyecto <span className="text-red-500">*</span></Label>
                       <select 
                          className="flex h-[42px] w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                          value={formData.project_id}
                          onChange={(e) => handleChange('project_id', e.target.value)}
                       >
                         <option value="">Seleccionar...</option>
                         {catalogs.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <Label>Cuenta <span className="text-red-500">*</span></Label>
                       <select 
                          className="flex h-[42px] w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                          value={formData.account_id}
                          onChange={(e) => handleChange('account_id', e.target.value)}
                       >
                         <option value="">Seleccionar...</option>
                         {catalogs.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                       </select>
                    </div>
                     <div className="space-y-2">
                       <Label>Tipo de Gasto <span className="text-red-500">*</span></Label>
                       <select 
                          className="flex h-[42px] w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                          value={formData.expense_type_id}
                          onChange={(e) => handleChange('expense_type_id', e.target.value)}
                       >
                         <option value="">Seleccionar...</option>
                         {catalogs.expenseTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <Label>Estado de Pago <span className="text-red-500">*</span></Label>
                       <select 
                          className="flex h-[42px] w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                          value={formData.payment_status_id}
                          onChange={(e) => handleChange('payment_status_id', e.target.value)}
                       >
                         <option value="">Seleccionar...</option>
                         {catalogs.paymentStatuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                       </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Proveedor</Label>
                    <div className="flex gap-2">
                       <select 
                          className="flex h-[42px] w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                          value={formData.provider_id}
                          onChange={(e) => handleChange('provider_id', e.target.value)}
                       >
                         <option value="">Opcional...</option>
                         {catalogs.providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                       </select>
                       <Button variant="secondary" size="icon" className="flex-shrink-0" onClick={() => setIsProviderModalOpen(true)}>
                         <Plus className="w-4 h-4" />
                       </Button>
                    </div>
                  </div>

                  {/* Attach URL (Optional) */}
                  {!file && (
                     <div className="space-y-2">
                       <Label>URL Adjunto (Si no hay archivo)</Label>
                       <div className="relative">
                         <Paperclip className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                         <Input 
                            placeholder="https://..." 
                            value={formData.attachment_url} 
                            onChange={(e) => handleChange('attachment_url', e.target.value)}
                            className="pl-10"
                          />
                       </div>
                    </div>
                  )}

                  {/* Financial Section */}
                  <div className="bg-slate-50/80 dark:bg-slate-950/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                      Montos e Impuestos
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Moneda <span className="text-red-500">*</span></Label>
                        <div className="flex bg-white dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-800">
                          {['ARS', 'USD'].map(curr => (
                            <button
                              key={curr}
                              type="button"
                              onClick={() => handleChange('currency', curr)}
                              className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${
                                formData.currency === curr 
                                  ? 'bg-blue-50 text-blue-600 shadow-sm' 
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              {curr}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Monto <span className="text-red-500">*</span></Label>
                        <Input 
                           type="number" 
                           step="0.01" 
                           placeholder="0.00"
                           value={formData.amount}
                           onChange={(e) => handleChange('amount', e.target.value)}
                           className="font-bold text-lg"
                        />
                      </div>
                    </div>

                    {/* Exchange Rate Logic */}
                    {formData.currency === 'USD' && (
                       <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center gap-3">
                          <div className="flex-1">
                             <Label className="text-xs text-blue-800 mb-1">Tipo de Cambio (ARS/USD)</Label>
                             <div className="flex items-center gap-2">
                               <Input 
                                  type="number" 
                                  className="h-8 text-sm bg-white"
                                  value={formData.exchange_rate_usd_ars}
                                  onChange={(e) => handleChange('exchange_rate_usd_ars', e.target.value)}
                                />
                                <Button type="button" size="iconSm" variant="ghost" onClick={fetchRate} title="Actualizar cotización">
                                   <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                                </Button>
                             </div>
                          </div>
                          <div className="text-xs text-blue-600 max-w-[150px]">
                            <p>Calculado: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(calculations.total * (parseFloat(formData.exchange_rate_usd_ars) || 0))}</p>
                          </div>
                       </div>
                    )}

                    {/* VAT Logic */}
                    <div className="space-y-4 pt-2">
                       <div className="flex items-center justify-between">
                          <Label className="mb-0">Incluye IVA en el monto?</Label>
                          <Switch 
                             checked={formData.vat_included}
                             onCheckedChange={(checked) => handleChange('vat_included', checked)}
                          />
                       </div>
                       
                       <div className="space-y-2">
                          <Label>Alícuota IVA</Label>
                          <div className="flex gap-2 flex-wrap">
                            {[0, 10.5, 21, 27].map(rate => (
                               <button
                                 key={rate}
                                 type="button"
                                 onClick={() => handleChange('vat_rate', rate)}
                                 className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                                    formData.vat_rate === rate 
                                      ? 'border-blue-600 bg-blue-50 text-blue-700' 
                                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                 }`}
                               >
                                 {rate === 0 ? 'Exento' : `${rate}%`}
                               </button>
                            ))}
                          </div>
                       </div>

                       {/* Summary Card */}
                       <VatSummary 
                          netAmount={calculations.net}
                          vatAmount={calculations.vat}
                          totalAmount={calculations.total}
                          currency={formData.currency}
                          vatIncluded={formData.vat_included}
                       />
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 flex items-center justify-end gap-3 z-10">
               <Button variant="secondary" onClick={onClose} className="rounded-full px-6" disabled={loading}>
                 Cancelar
               </Button>
               <Button 
                 variant="primary" 
                 onClick={handleSubmit} 
                 loading={loading}
                 className="rounded-full px-8 shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
               >
                 Guardar Gasto
               </Button>
            </div>

          </motion.div>
        </div>
      )}

      <ProviderModal 
        isOpen={isProviderModalOpen} 
        onClose={() => setIsProviderModalOpen(false)}
        onSuccess={() => { setIsProviderModalOpen(false); fetchCatalogs(); }}
      />
    </AnimatePresence>
  );
}

export default LargeExpenseModal;
