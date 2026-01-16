
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, UploadCloud, FileText, Calendar, Hash, Plus, Trash2, DollarSign, AlertCircle, Info, CheckCircle2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Chip } from '@/components/ui/Chip';
import { Card } from '@/components/ui/Card';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import ProviderModal from '@/components/providers/ProviderModal';
import { ExchangeRateService } from '@/services/ExchangeRateService';
import { cn } from '@/lib/utils';

// --- Helper Functions ---

const formatCurrency = (amount, currency = 'ARS') => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount);
};

const calculateLineTotal = (quantity, unitPrice, vatRate) => {
  const qty = parseFloat(quantity) || 0;
  const price = parseFloat(unitPrice) || 0;
  const vat = parseFloat(vatRate) || 0;

  if (qty <= 0 || price <= 0) {
    return { subtotalLine: 0, vatLine: 0, totalLine: 0 };
  }

  const subtotalLine = qty * price;
  const vatLine = subtotalLine * (vat / 100);
  const totalLine = subtotalLine + vatLine;

  return { subtotalLine, vatLine, totalLine };
};

const calculateTotals = (items) => {
  let subtotal = 0;
  let vatAmount = 0;
  let total = 0;

  items.forEach(item => {
    const { subtotalLine, vatLine, totalLine } = calculateLineTotal(item.quantity, item.unit_price, item.vat_rate);
    subtotal += subtotalLine;
    vatAmount += vatLine;
    total += totalLine;
  });

  return { subtotal, vatAmount, total };
};

const PAYMENT_METHODS = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transf.' },
  { value: 'TARJETA', label: 'Tarjeta' },
  { value: 'MERCADO_PAGO', label: 'MP' },
];

// --- Sub-components ---

const InsightCard = ({ type, message }) => {
  const isWarning = type === 'warning';
  const Icon = isWarning ? AlertCircle : Info;
  const bgClass = isWarning ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-blue-50 border-blue-100 text-blue-800';
  const iconClass = isWarning ? 'text-amber-600' : 'text-blue-600';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className={cn("flex items-start gap-3 p-3 rounded-xl border text-sm shadow-sm", bgClass)}
    >
      <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", iconClass)} />
      <span className="font-medium leading-tight">{message}</span>
    </motion.div>
  );
};

// --- Main Component ---

function PurchaseModal({ isOpen, onClose, onSuccess, projectId, defaultCurrency = 'ARS', existingPurchase = null }) {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  
  // Data states
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [fetchingRate, setFetchingRate] = useState(false);

  // Form State
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileType, setFileType] = useState(null); // 'image' or 'pdf'

  const [formData, setFormData] = useState({
    provider_id: '',
    invoice_number: '',
    issue_date: new Date().toISOString().split('T')[0],
    payment_method: 'TRANSFERENCIA',
    currency: defaultCurrency,
    status: 'BORRADOR',
    expected_total: '',
    // New: stored rate info
    exchange_rate_usd_ars: 0,
    exchange_rate_date: new Date().toISOString().split('T')[0],
  });

  // Items State
  const [items, setItems] = useState([
    { id: 1, description: '', quantity: 1, unit_price: 0, vat_rate: 21, total: 0 }
  ]);

  // Derived State: Totals
  const totals = useMemo(() => calculateTotals(items), [items]);

  // Derived State: Calculated Currency Equivalents
  const currencyTotals = useMemo(() => {
     const rate = formData.exchange_rate_usd_ars || 0;
     const currentTotal = totals.total;

     if (rate <= 0) return { main: currentTotal, reference: 0, referenceLabel: '' };

     if (formData.currency === 'ARS') {
       return {
         main: currentTotal,
         reference: currentTotal / rate,
         referenceLabel: 'USD'
       };
     } else {
       return {
         main: currentTotal,
         reference: currentTotal * rate,
         referenceLabel: 'ARS'
       };
     }
  }, [totals.total, formData.currency, formData.exchange_rate_usd_ars]);


  // Derived State: Insights
  const insights = useMemo(() => {
    const list = [];
    
    // 1. Expected Total Mismatch
    const expected = parseFloat(formData.expected_total);
    if (!isNaN(expected) && expected > 0) {
      const diff = Math.abs(totals.total - expected);
      const threshold = expected * 0.02; // 2% tolerance
      if (diff > threshold) {
        list.push({
          id: 'mismatch',
          type: 'warning',
          message: `El total calculado (${formatCurrency(totals.total, formData.currency)}) no coincide con el esperado (${formatCurrency(expected, formData.currency)}).`
        });
      }
    }

    // 2. Missing Invoice Number for traceable methods
    if (['TRANSFERENCIA', 'TARJETA', 'MERCADO_PAGO'].includes(formData.payment_method) && !formData.invoice_number) {
      list.push({
        id: 'missing-invoice',
        type: 'warning',
        message: 'Falta ingresar el N° de factura para este método de pago.'
      });
    }

    // 3. Incomplete Rows
    if (items.some(i => !i.description.trim())) {
      list.push({
        id: 'incomplete-rows',
        type: 'info',
        message: 'Hay filas sin descripción. Se recomienda completarlas.'
      });
    }

    return list;
  }, [formData.expected_total, formData.payment_method, formData.invoice_number, formData.currency, items, totals.total]);

  // --- Effects ---

  useEffect(() => {
    if (isOpen) {
      fetchProviders();
      
      if (existingPurchase) {
        // Load existing
        // (Implementation omitted for brevity in this task unless requested, assuming 'New Purchase' mostly, 
        // but if editing, we would populate fields here and importantly set exchange rate from DB)
        // If existing purchase has rate, use it. Else fetch today's.
        if (existingPurchase.exchange_rate_usd_ars) {
           setExchangeRate(existingPurchase.exchange_rate_usd_ars);
           setFormData(prev => ({
             ...prev, 
             exchange_rate_usd_ars: existingPurchase.exchange_rate_usd_ars,
             exchange_rate_date: existingPurchase.exchange_rate_date
           }));
        } else {
          fetchExchangeRate();
        }
      } else {
        // New Purchase
        setFile(null);
        setPreviewUrl(null);
        setFileType(null);
        setFormData({
          provider_id: '',
          invoice_number: '',
          issue_date: new Date().toISOString().split('T')[0],
          payment_method: 'TRANSFERENCIA',
          currency: defaultCurrency,
          status: 'BORRADOR',
          expected_total: '',
          exchange_rate_usd_ars: 0,
          exchange_rate_date: new Date().toISOString().split('T')[0],
        });
        setItems([{ id: 1, description: '', quantity: 1, unit_price: 0, vat_rate: 21, total: 0 }]);
        fetchExchangeRate();
      }
    }
  }, [isOpen, defaultCurrency, existingPurchase]);

  // --- Data Fetching ---

  const fetchProviders = async () => {
    const { data } = await supabase
      .from('providers')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    setProviders(data || []);
  };

  const fetchExchangeRate = async () => {
    setFetchingRate(true);
    try {
      const rate = await ExchangeRateService.getExchangeRateUSDtoARS();
      setExchangeRate(rate);
      setFormData(prev => ({
        ...prev,
        exchange_rate_usd_ars: rate,
        exchange_rate_date: new Date().toISOString().split('T')[0]
      }));
    } catch (error) {
      console.error("Rate fetch error", error);
      toast({ variant: "destructive", title: "Error cotización", description: "No se pudo obtener la cotización automática." });
    } finally {
      setFetchingRate(false);
    }
  };

  // --- Logic ---

  const handleProviderChange = (providerId) => {
    setFormData(prev => ({ ...prev, provider_id: providerId }));
  };

  const handleItemChange = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        const { totalLine } = calculateLineTotal(updatedItem.quantity, updatedItem.unit_price, updatedItem.vat_rate);
        updatedItem.total = totalLine;
        return updatedItem;
      }
      return item;
    }));
  };

  const addItem = () => {
    const lastVat = items.length > 0 ? items[items.length - 1].vat_rate : 21;
    setItems(prev => [
      ...prev,
      { id: Date.now(), description: '', quantity: 1, unit_price: 0, vat_rate: lastVat, total: 0 }
    ]);
  };

  const removeItem = (id) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // --- File Handling ---

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) { 
      toast({ variant: 'destructive', title: 'Archivo muy grande', description: 'El máximo permitido es 10MB' });
      return;
    }

    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    if (selectedFile.type === 'application/pdf') {
      setFileType('pdf');
    } else if (selectedFile.type.startsWith('image/')) {
      setFileType('image');
    } else {
      setFileType('other');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
       const droppedFile = e.dataTransfer.files[0];
       if (droppedFile.size > 10 * 1024 * 1024) {
        toast({ variant: 'destructive', title: 'Archivo muy grande', description: 'El máximo permitido es 10MB' });
        return;
      }
      setFile(droppedFile);
      setPreviewUrl(URL.createObjectURL(droppedFile));
       if (droppedFile.type === 'application/pdf') {
        setFileType('pdf');
      } else if (droppedFile.type.startsWith('image/')) {
        setFileType('image');
      } else {
        setFileType('other');
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // --- Submission ---

  const handleSubmit = async (targetStatus = 'CONFIRMADO') => {
    if (!formData.provider_id) {
      toast({ variant: 'destructive', title: 'Falta información', description: 'Debes seleccionar un proveedor.' });
      return;
    }
    if (!formData.issue_date) {
      toast({ variant: 'destructive', title: 'Falta información', description: 'La fecha de emisión es obligatoria.' });
      return;
    }
    if (totals.total <= 0) {
      toast({ variant: 'destructive', title: 'Error en montos', description: 'El total de la compra no puede ser cero.' });
      return;
    }

    setLoading(true);
    try {
      let attachmentUrl = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `purchases/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('objects')
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage.from('objects').getPublicUrl(filePath);
        attachmentUrl = publicUrlData.publicUrl;
      }

      // Calculate final storage values
      const finalTotalArs = formData.currency === 'ARS' ? totals.total : (totals.total * formData.exchange_rate_usd_ars);
      const finalTotalUsdRef = formData.currency === 'USD' ? totals.total : (totals.total / (formData.exchange_rate_usd_ars || 1));

      const payload = {
        project_id: projectId,
        provider_id: formData.provider_id,
        description: items.length > 0 ? items[0].description + (items.length > 1 ? ` (+${items.length - 1} items)` : '') : 'Nueva Compra',
        amount: totals.total,
        currency: formData.currency,
        expense_date: formData.issue_date,
        vat_amount: totals.vatAmount,
        receipt_note: formData.invoice_number,
        payment_status: targetStatus === 'CONFIRMADO' ? 'PAGADO' : 'A_PAGAR',
        expense_type: 'MATERIAL', 
        attachment_url: attachmentUrl,
        // New Multi-currency fields
        exchange_rate_usd_ars: formData.exchange_rate_usd_ars,
        exchange_rate_date: formData.exchange_rate_date,
        total_ars: finalTotalArs,
        total_usd_reference: finalTotalUsdRef,
        
        notes: JSON.stringify({ 
          items, 
          payment_method: formData.payment_method,
          expected_total: formData.expected_total
        })
      };

      const { error } = await supabase.from('project_expenses').insert([payload]);
      if (error) throw error;

      toast({ 
        title: targetStatus === 'CONFIRMADO' ? 'Compra confirmada' : 'Borrador guardado', 
        description: targetStatus === 'CONFIRMADO' ? 'La compra ha sido registrada correctamente.' : 'Puedes continuar editando más tarde.' 
      });
      onSuccess();
      onClose();

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error al guardar', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 w-full max-w-[95vw] h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Nueva Compra</h2>
                <Chip 
                  label={formData.status} 
                  variant={formData.status === 'BORRADOR' ? 'warning' : 'success'} 
                  size="sm" 
                  className="font-bold tracking-wide"
                />
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Content: 2 Columns */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* Left Column: Preview (40%) */}
              <div className="hidden md:flex w-[40%] bg-slate-50 dark:bg-slate-950/50 border-r border-slate-100 dark:border-slate-800 p-6 flex-col relative">
                {!file ? (
                  <div 
                    className="flex-1 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center p-8 transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-900/50"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Sube tu factura</h3>
                    <p className="text-sm text-slate-500 max-w-[250px] mb-6">
                      Arrastra y suelta tu archivo aquí, o haz clic para buscar.
                    </p>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden" 
                      accept=".pdf,image/*" 
                      onChange={handleFileSelect}
                    />
                    <Button onClick={() => fileInputRef.current?.click()} variant="secondary" className="rounded-full px-6">
                      Seleccionar archivo
                    </Button>
                    <p className="text-xs text-slate-400 mt-6 font-medium">
                      PDF, PNG, JPG (Máx. 10MB)
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden relative flex items-center justify-center">
                    <button 
                      onClick={() => { setFile(null); setPreviewUrl(null); }}
                      className="absolute top-4 right-4 z-10 bg-white/90 text-red-500 p-2 rounded-full shadow-sm hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    {fileType === 'image' && (
                      <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                    )}
                    {fileType === 'pdf' && (
                      <div className="text-center p-6">
                        <FileText className="w-16 h-16 text-red-500 mx-auto mb-3" />
                        <p className="font-medium text-slate-900 dark:text-white">{file.name}</p>
                        <p className="text-sm text-slate-500 mt-1">Vista previa de PDF no disponible</p>
                        <a href={previewUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                          Abrir en nueva pestaña
                        </a>
                      </div>
                    )}
                    {fileType === 'other' && (
                      <div className="text-center">
                        <FileText className="w-16 h-16 text-slate-400 mx-auto mb-3" />
                        <p className="font-medium">{file.name}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Form (60%) */}
              <div className="w-full md:w-[60%] overflow-y-auto p-6 md:p-8 bg-white dark:bg-slate-900">
                <div className="max-w-3xl mx-auto space-y-8">
                  
                  {/* Section 1: Main Data */}
                  <section>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                      <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                      Datos Principales
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div className="col-span-2 md:col-span-1">
                        <Label className="text-slate-700 dark:text-slate-300">Proveedor *</Label>
                        <div className="flex gap-2">
                          <select
                            className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                            value={formData.provider_id}
                            onChange={(e) => handleProviderChange(e.target.value)}
                          >
                            <option value="">Seleccionar proveedor...</option>
                            {providers.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                          <Button 
                            type="button" 
                            size="icon" 
                            variant="secondary" 
                            className="flex-shrink-0 h-11 w-11 rounded-xl"
                            onClick={() => setIsProviderModalOpen(true)}
                          >
                            <Plus className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>

                      <div className="col-span-2 md:col-span-1">
                         <Label className="text-slate-700 dark:text-slate-300">N° Factura</Label>
                         <div className="relative">
                           <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                           <Input 
                             className="pl-10 h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                             placeholder="0001-00001234"
                             value={formData.invoice_number}
                             onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
                           />
                         </div>
                      </div>

                      <div className="col-span-2 md:col-span-1">
                        <Label className="text-slate-700 dark:text-slate-300">Fecha de Emisión *</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input 
                            type="date"
                            className="pl-10 h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                            value={formData.issue_date}
                            onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="col-span-2 md:col-span-1">
                        <Label className="text-slate-700 dark:text-slate-300">Moneda</Label>
                        <div className="relative flex items-center gap-2">
                           <div className="relative flex-1">
                             <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                             <select
                                className="flex h-11 w-full pl-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                value={formData.currency}
                                onChange={(e) => setFormData({...formData, currency: e.target.value})}
                             >
                               <option value="ARS">ARS</option>
                               <option value="USD">USD</option>
                             </select>
                           </div>
                           
                           {/* Exchange Rate Mini Info */}
                           <div className="bg-slate-100 dark:bg-slate-800 h-11 px-3 rounded-xl flex flex-col justify-center min-w-[100px] border border-slate-200 dark:border-slate-700">
                              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Cotización</span>
                              <div className="flex items-center gap-1">
                                {fetchingRate ? (
                                  <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
                                ) : (
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                    ${formData.exchange_rate_usd_ars}
                                  </span>
                                )}
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <Label className="text-slate-700 dark:text-slate-300 mb-2 block">Método de Pago</Label>
                      <SegmentedControl 
                        options={PAYMENT_METHODS}
                        value={formData.payment_method}
                        onChange={(val) => setFormData({...formData, payment_method: val})}
                        className="w-full bg-slate-50 dark:bg-slate-950 p-1.5"
                      />
                    </div>
                  </section>

                  {/* Section 2: Items Details */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                       <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                        Detalle de Ítems
                      </h3>
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        <Plus className="w-4 h-4 mr-1" /> Crear Producto
                      </Button>
                    </div>

                    <Card className="overflow-hidden border border-slate-200 shadow-sm p-0 rounded-xl mb-4">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="py-3 px-4 font-semibold text-slate-600 w-[40%]">Descripción</th>
                            <th className="py-3 px-2 font-semibold text-slate-600 w-[10%] text-center">Cant.</th>
                            <th className="py-3 px-2 font-semibold text-slate-600 w-[15%] text-right">Precio Unit.</th>
                            <th className="py-3 px-2 font-semibold text-slate-600 w-[10%] text-right">IVA %</th>
                            <th className="py-3 px-4 font-semibold text-slate-600 w-[20%] text-right">Total ({formData.currency})</th>
                            <th className="py-3 px-2 w-[5%]"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {items.map((item) => (
                            <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                              <td className="p-2 pl-4">
                                <input 
                                  type="text" 
                                  className="w-full bg-transparent border-none focus:ring-0 p-0 font-medium placeholder-slate-400"
                                  placeholder="Ej. Materiales de construcción"
                                  value={item.description}
                                  onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                />
                              </td>
                              <td className="p-2 text-center">
                                <input 
                                  type="number" 
                                  min="1"
                                  className="w-full bg-slate-50 dark:bg-slate-900 rounded-md border-none focus:ring-1 focus:ring-blue-500 p-1 text-center h-8"
                                  value={item.quantity}
                                  onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                />
                              </td>
                              <td className="p-2 text-right">
                                <input 
                                  type="number" 
                                  min="0"
                                  step="0.01"
                                  className="w-full bg-slate-50 dark:bg-slate-900 rounded-md border-none focus:ring-1 focus:ring-blue-500 p-1 text-right h-8"
                                  value={item.unit_price}
                                  onChange={(e) => handleItemChange(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                />
                              </td>
                              <td className="p-2 text-right">
                                <select 
                                  className="bg-transparent border-none focus:ring-0 text-right p-0 pr-2 text-slate-600 cursor-pointer"
                                  value={item.vat_rate}
                                  onChange={(e) => handleItemChange(item.id, 'vat_rate', parseFloat(e.target.value))}
                                >
                                  <option value="0">0%</option>
                                  <option value="10.5">10.5%</option>
                                  <option value="21">21%</option>
                                  <option value="27">27%</option>
                                </select>
                              </td>
                              <td className="p-2 pr-4 text-right font-medium text-slate-900 dark:text-white">
                                {formatCurrency(item.total, formData.currency)}
                              </td>
                              <td className="p-2 text-center">
                                <button 
                                  onClick={() => removeItem(item.id)}
                                  className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="p-2 bg-slate-50/50 border-t border-slate-100">
                        <Button onClick={addItem} variant="ghost" size="sm" className="w-full text-slate-500 hover:text-blue-600">
                          <Plus className="w-4 h-4 mr-2" /> Agregar fila
                        </Button>
                      </div>
                    </Card>
                  </section>

                  {/* Section 3: Totals & Insights */}
                  <section className="flex flex-col md:flex-row gap-8 justify-between pt-2">
                     {/* Left: Insights Area */}
                     <div className="flex-1 space-y-3">
                        <AnimatePresence>
                          {insights.map(insight => (
                            <InsightCard key={insight.id} type={insight.type} message={insight.message} />
                          ))}
                          {insights.length === 0 && totals.total > 0 && (
                            <motion.div 
                              initial={{ opacity: 0 }} 
                              animate={{ opacity: 1 }}
                              className="flex items-center gap-2 text-sm text-green-600 p-3 bg-green-50 border border-green-100 rounded-xl"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                              <span className="font-medium">Todo parece correcto.</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                     </div>

                     {/* Right: Totals Calculation */}
                     <div className="w-full md:w-80 space-y-3 bg-slate-50/50 dark:bg-slate-950/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                       <div className="flex justify-between text-sm text-slate-500">
                         <span>Subtotal</span>
                         <span>{formatCurrency(totals.subtotal, formData.currency)}</span>
                       </div>
                       <div className="flex justify-between text-sm text-slate-500">
                         <span>IVA Total</span>
                         <span>{formatCurrency(totals.vatAmount, formData.currency)}</span>
                       </div>
                       
                       <div className="my-2 border-t border-slate-200 dark:border-slate-800 border-dashed"></div>

                       <div className="flex justify-between items-center">
                         <span className="font-bold text-slate-900 dark:text-white text-lg">Total</span>
                         <span className="font-bold text-2xl text-blue-600">{formatCurrency(totals.total, formData.currency)}</span>
                       </div>
                       
                       {/* Multi-currency Reference Display */}
                       <div className="text-right text-xs text-slate-500 font-medium -mt-2">
                         {formData.currency === 'ARS' ? (
                           <span>Equivalente: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(currencyTotals.reference)} USD</span>
                         ) : (
                            <span>Equivalente: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(currencyTotals.reference)} ARS</span>
                         )}
                       </div>

                       <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                         <Label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Total Esperado (Control)</Label>
                         <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00"
                            className="h-9 bg-white dark:bg-slate-900 text-right font-medium"
                            value={formData.expected_total}
                            onChange={(e) => setFormData({...formData, expected_total: e.target.value})}
                         />
                       </div>
                     </div>
                  </section>

                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 flex items-center justify-end gap-3 z-10">
               <Button variant="ghost" onClick={onClose} disabled={loading}>
                 Cancelar
               </Button>
               <Button 
                 variant="secondary" 
                 onClick={() => handleSubmit('BORRADOR')} 
                 disabled={loading}
                 className="rounded-full"
               >
                 Guardar Borrador
               </Button>
               <Button 
                 variant="primary" 
                 onClick={() => handleSubmit('CONFIRMADO')} 
                 loading={loading}
                 className="rounded-full px-8 shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
               >
                 Confirmar Compra
               </Button>
            </div>

          </motion.div>
        </div>
      )}

      {/* Nested Modals */}
      <ProviderModal 
        isOpen={isProviderModalOpen}
        onClose={() => setIsProviderModalOpen(false)}
        onSuccess={() => {
          setIsProviderModalOpen(false);
          fetchProviders();
        }}
      />
    </AnimatePresence>
  );
}

export default PurchaseModal;
