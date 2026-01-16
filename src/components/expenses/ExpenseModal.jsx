
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { useTheme } from '@/contexts/ThemeProvider';
import TicketUploadZone from './TicketUploadZone';
import ExpenseForm from './ExpenseForm';

const ExpenseModal = ({ isOpen, onClose, onSuccess, expense = null, projectId = null }) => {
  const { t } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  // Initial State
  const initialData = {
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
    project_id: projectId || '',
    work_item_id: '', // Added field
    account_id: '',
    provider_id: '',
    
    // Currency & Amounts
    currency: 'ARS',
    amount: '', // Input face value
    amount_original: null, // USD/EUR original
    amount_ars: 0, // Final calculated ARS
    fx_rate: null,
    fx_date: null,

    vat_included: true,
    vat_rate: 21,
    net_amount: 0,
    vat_amount: 0,
    total_final_amount: 0,
    
    receipt_note: '',
    attachment_url: '',
    payment_status_id: '', 
    expense_type_id: ''   
  };

  const [formData, setFormData] = useState(initialData);

  // Initialize Data on Open
  useEffect(() => {
    if (isOpen) {
      if (expense) {
        setFormData({
          expense_date: expense.expense_date,
          description: expense.description,
          project_id: expense.project_id || '',
          work_item_id: expense.work_item_id || '', // Pre-fill work_item_id
          account_id: expense.account_id || '',
          provider_id: expense.provider_id || '',
          
          currency: expense.currency || 'ARS',
          amount: expense.amount_original || expense.amount, // Prefer original input if available (face value)
          
          fx_rate: expense.fx_rate,
          fx_date: expense.fx_date,
          amount_original: expense.amount_original,
          amount_ars: expense.amount_ars || expense.amount, 
          
          vat_included: expense.vat_included ?? true,
          vat_rate: expense.vat_rate ?? 21,
          net_amount: expense.net_amount || 0,
          vat_amount: expense.vat_amount || 0,
          total_final_amount: expense.amount || 0, 
          
          receipt_note: expense.receipt_note || '',
          attachment_url: expense.attachment_url || '',
          payment_status_id: expense.payment_status_id,
          expense_type_id: expense.expense_type_id
        });
      } else {
        setFormData(initialData);
        fetchDefaults();
      }
      setFile(null);
    }
  }, [isOpen, expense]);

  const fetchDefaults = async () => {
    const { data: status } = await supabase.from('catalog_payment_status').select('id').eq('name', 'PENDIENTE').single();
    const { data: type } = await supabase.from('catalog_expense_type').select('id').limit(1).single();
    setFormData(prev => ({
       ...prev, 
       payment_status_id: status?.id || prev.payment_status_id,
       expense_type_id: type?.id || prev.expense_type_id 
    }));
  };

  const handleSubmit = async () => {
    if (!formData.description) return toast({ variant: 'destructive', title: t('common.error'), description: 'La descripción es obligatoria' });
    if (!formData.amount || formData.amount <= 0) return toast({ variant: 'destructive', title: t('common.error'), description: 'El monto es obligatorio' });
    if (!formData.account_id) return toast({ variant: 'destructive', title: t('common.error'), description: 'La cuenta es obligatoria' });
    
    // Validate FX
    if (formData.currency !== 'ARS' && (!formData.fx_rate || formData.fx_rate <= 0)) {
       return toast({ variant: 'destructive', title: t('common.error'), description: 'Debes ingresar una cotización válida para moneda extranjera.' });
    }

    setLoading(true);
    try {
      let attachmentUrl = formData.attachment_url;

      // Upload File
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `expenses/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('expenses').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('expenses').getPublicUrl(filePath);
        attachmentUrl = publicUrlData.publicUrl;
      }

      // Payload
      const payload = {
        expense_date: formData.expense_date,
        description: formData.description,
        project_id: formData.project_id || null,
        work_item_id: formData.work_item_id || null, // Include work_item_id
        account_id: formData.account_id,
        provider_id: formData.provider_id || null,
        currency: formData.currency,
        
        // --- Amounts Logic ---
        amount: formData.total_final_amount, 
        amount_original: formData.amount_original,
        amount_ars: formData.amount_ars,
        fx_rate: formData.fx_rate,
        fx_date: formData.fx_date,
        
        // VAT Breakdown
        net_amount: formData.net_amount,
        vat_amount: formData.vat_amount,
        vat_rate: formData.vat_rate,
        vat_included: formData.vat_included,
        
        receipt_note: formData.receipt_note,
        attachment_url: attachmentUrl,
        
        payment_status_id: formData.payment_status_id, 
        expense_type_id: formData.expense_type_id, 

        updated_at: new Date().toISOString()
      };

      if (expense) {
        const { error } = await supabase.from('expenses').update(payload).eq('id', expense.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('expenses').insert([{ ...payload, is_deleted: false }]);
        if (error) throw error;
      }

      toast({ title: t('common.success'), description: t('messages.success_saved') });
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('common.error'), description: error.message });
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
            className="bg-white dark:bg-slate-900 w-full max-w-[1200px] h-[90vh] md:h-auto md:max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800"
            style={{ borderRadius: '20px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {expense ? t('expenses.edit_expense') : t('expenses.new_expense')}
                </h2>
                <Chip 
                  label={expense ? 'Edición' : t('status.draft')} 
                  variant="warning" 
                  size="sm"
                />
              </div>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Layout */}
            <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row">
               
               {/* Left: Upload Zone (40%) */}
               <div className="w-full md:w-[40%] bg-slate-50 dark:bg-slate-950/50 p-6 border-r border-slate-100 dark:border-slate-800 h-[300px] md:h-auto hidden md:block">
                  <TicketUploadZone 
                     file={file} 
                     url={formData.attachment_url} 
                     onFileChange={setFile}
                  />
               </div>

               {/* Right: Form (60%) */}
               <div className="w-full md:w-[60%] p-6 md:p-8 overflow-y-auto bg-white dark:bg-slate-900 relative">
                  <ExpenseForm 
                     formData={formData} 
                     setFormData={setFormData} 
                  />
               </div>

            </div>

            {/* Sticky Footer */}
            <div className="border-t border-slate-100 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 flex items-center justify-end gap-3 sticky bottom-0 z-10">
              <Button 
                variant="outline" 
                onClick={onClose} 
                className="rounded-full px-6 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                disabled={loading}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSubmit} 
                loading={loading}
                className="rounded-full px-8 shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
              >
                {t('button.save_expense')}
              </Button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ExpenseModal;
