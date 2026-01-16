
import React, { useState, useEffect } from 'react';
import { AlignLeft, Hash } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ThemedSelect } from '@/components/ui/themed-components';
import { useTheme } from '@/contexts/ThemeProvider';
import DatePickerInput from '@/components/ui/DatePickerInput';
import SearchableResourceSelect from '@/components/ui/SearchableResourceSelect';
import ProviderQuickCreateModal from '@/components/providers/ProviderQuickCreateModal';
import FXRateInput from '@/components/ui/FXRateInput';
import { tokens } from '@/lib/designTokens';
import { workItemService } from '@/services/workItemService'; // Import service

const ExpenseForm = ({ formData, setFormData }) => {
  const { t } = useTheme();
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [initialProviderName, setInitialProviderName] = useState('');
  const [projectWorkItems, setProjectWorkItems] = useState([]); // State for items

  // -- Fetch Work Items when Project Changes --
  useEffect(() => {
    if (formData.project_id) {
       workItemService.getWorkItems(formData.project_id)
         .then(items => setProjectWorkItems(items || []))
         .catch(err => console.error(err));
    } else {
       setProjectWorkItems([]);
    }
  }, [formData.project_id]);

  // -- Currency & FX Logic --
  // When currency changes, we might need to reset or fetch FX
  const handleCurrencyChange = (newCurrency) => {
    if (newCurrency === 'ARS') {
      // Reset FX fields
      setFormData(prev => ({
        ...prev,
        currency: 'ARS',
        fx_rate: null,
        fx_date: null,
        amount_original: null,
        amount_ars: prev.amount // In ARS mode, amount is just amount
      }));
    } else {
      // Switch to USD
      setFormData(prev => ({
        ...prev,
        currency: 'USD',
        amount_original: prev.amount, // Transfer current face value to original
        amount_ars: 0, // Will be calculated by effect
      }));
    }
  };

  const handleFxChange = (rate, date) => {
    setFormData(prev => ({
      ...prev,
      fx_rate: rate,
      fx_date: date
    }));
  };

  // -- Smart Calculation Logic --
  useEffect(() => {
    const val = parseFloat(formData.amount) || 0;
    const rate = parseFloat(formData.vat_rate) || 0;
    const fx = parseFloat(formData.fx_rate) || 0;
    
    let net, vat, total;

    // 1. Calculate Face Values (in selected currency)
    if (formData.vat_included) {
      total = val;
      net = total / (1 + (rate / 100));
      vat = total - net;
    } else {
      net = val;
      vat = net * (rate / 100);
      total = net + vat;
    }

    // 2. Handle Multicurrency
    let amountArs = total;
    let amountOriginal = null;

    if (formData.currency === 'USD') {
      amountOriginal = total;
      amountArs = total * fx;
    } else {
      amountOriginal = null;
      amountArs = total;
    }

    // 3. Update State without creating loops
    setFormData(prev => {
        if (
            prev.net_amount === parseFloat(net.toFixed(2)) &&
            prev.vat_amount === parseFloat(vat.toFixed(2)) &&
            prev.total_final_amount === parseFloat(total.toFixed(2)) &&
            prev.amount_ars === parseFloat(amountArs.toFixed(2))
        ) return prev;

        return {
            ...prev,
            net_amount: parseFloat(net.toFixed(2)),
            vat_amount: parseFloat(vat.toFixed(2)),
            total_final_amount: parseFloat(total.toFixed(2)),
            amount_original: amountOriginal ? parseFloat(amountOriginal.toFixed(2)) : null,
            amount_ars: parseFloat(amountArs.toFixed(2))
        };
    });
    
  }, [formData.amount, formData.vat_rate, formData.vat_included, formData.fx_rate, formData.currency]);


  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto pr-2">
      
      {/* 1. Date & Description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
           <Label>{t('common.date')} <span className="text-red-500">*</span></Label>
           <DatePickerInput 
              date={formData.expense_date ? new Date(formData.expense_date) : null}
              onSelect={(d) => handleChange('expense_date', d ? d.toISOString().split('T')[0] : '')}
           />
        </div>
        <div className="space-y-2 md:col-span-2">
           <Label>{t('common.description')} <span className="text-red-500">*</span></Label>
           <div className="relative">
             <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
             <textarea 
               className="flex w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 pl-10 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
               placeholder="Ej. Compra de materiales"
               value={formData.description}
               onChange={(e) => handleChange('description', e.target.value)}
             />
           </div>
        </div>
      </div>

      {/* 2. Categorization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="space-y-2">
            <Label>{t('expenses.project')}</Label>
            <SearchableResourceSelect 
               table="projects"
               value={formData.project_id}
               onChange={(id) => handleChange('project_id', id)}
               placeholder="Buscar proyecto..."
            />
         </div>

         {/* Work Item Select (Only if project selected) */}
         <div className="space-y-2">
            <Label>Partida / Item de Obra</Label>
            <ThemedSelect 
              value={formData.work_item_id || ''}
              onChange={(e) => handleChange('work_item_id', e.target.value)}
              disabled={!formData.project_id || projectWorkItems.length === 0}
            >
              <option value="">-- Sin asignar --</option>
              {projectWorkItems.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </ThemedSelect>
         </div>

         <div className="space-y-2">
            <Label>{t('expenses.account')} <span className="text-red-500">*</span></Label>
            <SearchableResourceSelect 
               table="accounts"
               value={formData.account_id}
               onChange={(id) => handleChange('account_id', id)}
               placeholder="Buscar cuenta..."
            />
         </div>
         <div className="space-y-2 md:col-span-2">
            <Label>{t('expenses.provider')}</Label>
            <SearchableResourceSelect 
               table="providers"
               value={formData.provider_id}
               onChange={(id) => handleChange('provider_id', id)}
               placeholder="Buscar proveedor..."
               quickCreate
               onQuickCreate={(name) => {
                 setInitialProviderName(name);
                 setShowProviderModal(true);
               }}
            />
         </div>
      </div>

      {/* 3. Financials & Smart VAT */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-800 space-y-6" style={{ borderRadius: tokens.radius.card }}>
         <div className="flex flex-wrap items-end gap-6">
            <div className="flex-1 min-w-[140px] space-y-2">
               <Label>{t('common.currency')}</Label>
               <ThemedSelect value={formData.currency} onChange={(e) => handleCurrencyChange(e.target.value)}>
                  <option value="ARS">ARS - Peso</option>
                  <option value="USD">USD - Dólar</option>
                  <option value="EUR">EUR - Euro</option>
               </ThemedSelect>
            </div>
            <div className="flex-1 min-w-[180px] space-y-2">
               <Label>{t('expenses.total_amount')} ({formData.currency}) <span className="text-red-500">*</span></Label>
               <Input 
                  type="number" 
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  className="font-bold text-lg"
                  placeholder="0.00"
               />
            </div>
         </div>

         {/* FX Rate Input Section - Only for USD/EUR */}
         <FXRateInput 
            currency={formData.currency}
            value={formData.fx_rate}
            date={formData.fx_date}
            onRateChange={handleFxChange}
            amountOriginal={formData.total_final_amount}
            amountArs={formData.amount_ars}
         />

         <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <div className="flex items-center justify-between mb-4">
               <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                 ⚡ {t('expenses.smart_vat')}
               </span>
               <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{t('expenses.vat_included')}</span>
                  <Switch 
                     checked={formData.vat_included}
                     onCheckedChange={(c) => handleChange('vat_included', c)}
                  />
               </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
               {/* NET Card */}
               <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-xs text-slate-500 block mb-1">{t('expenses.net_amount')}</span>
                  <div className="font-medium text-slate-900 dark:text-white">
                    {formData.currency} {formData.net_amount}
                  </div>
               </div>
               
               {/* VAT Card */}
               <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm relative group">
                  <div className="flex justify-between items-center mb-1">
                     <span className="text-xs text-slate-500">{t('expenses.vat_amount')}</span>
                     <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600">{formData.vat_rate}%</span>
                  </div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    {formData.currency} {formData.vat_amount}
                  </div>
                  {/* Quick Edit Rate */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <input 
                       type="number" 
                       className="w-8 h-4 text-[10px] bg-slate-100 text-center rounded"
                       value={formData.vat_rate}
                       onChange={(e) => handleChange('vat_rate', e.target.value)}
                     />
                  </div>
               </div>

               {/* TOTAL ARS Card (The ultimate truth) */}
               <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 shadow-sm">
                  <span className="text-xs text-blue-600 dark:text-blue-300 block mb-1">Total (ARS)</span>
                  <div className="font-bold text-blue-700 dark:text-blue-200 truncate" title={formData.amount_ars}>
                    $ {formData.amount_ars}
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* 4. Extra */}
      <div className="space-y-2">
         <Label>{t('expenses.receipt')} ({t('common.optional')})</Label>
         <Input 
            icon={Hash}
            placeholder="0001-12345678"
            value={formData.receipt_note}
            onChange={(e) => handleChange('receipt_note', e.target.value)}
         />
      </div>

      <ProviderQuickCreateModal 
         isOpen={showProviderModal}
         onClose={() => setShowProviderModal(false)}
         initialName={initialProviderName}
         onSuccess={(newProvider) => handleChange('provider_id', newProvider.id)}
      />
    </div>
  );
};

export default ExpenseForm;
