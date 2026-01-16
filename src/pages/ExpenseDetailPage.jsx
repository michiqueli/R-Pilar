
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, Edit, Download, Paperclip, LayoutTemplate } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/ThemeProvider';
import ExpenseModal from '@/components/expenses/ExpenseModal';
import { formatDate } from '@/lib/dateUtils';
import FilePreview from '@/components/ui/FilePreview';
import { tokens } from '@/lib/designTokens';
import usePageTitle from '@/hooks/usePageTitle';

function ExpenseDetailPage() {
  usePageTitle('Detalle del gasto');
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTheme();
  
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [workItemName, setWorkItemName] = useState(null);

  const fetchExpense = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          projects (id, name),
          accounts (id, name),
          providers (id, name),
          catalog_expense_type (name),
          catalog_payment_status (name),
          inversionistas (id, nombre)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setExpense(data);
      
      // Fetch Work Item Name if exists
      if (data.work_item_id) {
         const { data: wi } = await supabase.from('work_items').select('name').eq('id', data.work_item_id).single();
         if (wi) setWorkItemName(wi.name);
      }

    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar el gasto.' });
      navigate('/expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpense();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando...</div>;
  if (!expense) return null;

  return (
    <>
      <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div>
                <div className="flex items-center text-sm text-slate-500 mb-1">
                   <span onClick={() => navigate('/expenses')} className="cursor-pointer hover:text-slate-900">Gastos</span>
                   <ChevronRight className="w-4 h-4 mx-2" />
                   <span>Detalle</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{expense.description}</h1>
             </div>
             <Button variant="secondary" onClick={() => setIsEditModalOpen(true)} className="rounded-full">
                <Edit className="w-4 h-4 mr-2" /> Editar Gasto
             </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             
             {/* Left: Main Info */}
             <div className="md:col-span-2 space-y-6">
                <div className="bg-white dark:bg-slate-900 p-6 border border-slate-100 dark:border-slate-800 shadow-sm" style={{ borderRadius: tokens.radius.card }}>
                   <div className="grid grid-cols-2 gap-6 mb-6">
                      <div>
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</label>
                         <p className="text-slate-900 dark:text-white font-medium mt-1">{formatDate(expense.expense_date)}</p>
                      </div>
                      <div>
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Comprobante</label>
                         <p className="text-slate-900 dark:text-white font-medium mt-1">{expense.receipt_note || '-'}</p>
                      </div>
                      <div>
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proyecto</label>
                         <p className="text-slate-900 dark:text-white font-medium mt-1 cursor-pointer hover:text-blue-600" onClick={() => expense.projects && navigate(`/projects/${expense.projects.id}`)}>
                            {expense.projects?.name || '-'}
                         </p>
                      </div>
                      <div>
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cuenta</label>
                         <p className="text-slate-900 dark:text-white font-medium mt-1">{expense.accounts?.name || '-'}</p>
                      </div>
                      <div>
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proveedor</label>
                         <p className="text-slate-900 dark:text-white font-medium mt-1">{expense.providers?.name || '-'}</p>
                      </div>
                      {expense.inversionistas && (
                        <div>
                           <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inversionista</label>
                           <p className="text-slate-900 dark:text-white font-medium mt-1 text-blue-600">{expense.inversionistas.nombre}</p>
                        </div>
                      )}
                      <div>
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</label>
                         <div className="mt-1">
                           <Chip label={expense.catalog_payment_status?.name} variant={expense.catalog_payment_status?.name} />
                         </div>
                      </div>
                   </div>

                   {workItemName && (
                     <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg text-blue-600 dark:text-blue-200">
                           <LayoutTemplate className="w-5 h-5" />
                        </div>
                        <div>
                           <label className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">Imputado a Partida</label>
                           <p className="text-blue-900 dark:text-white font-medium">{workItemName}</p>
                        </div>
                     </div>
                   )}
                </div>

                {/* Amounts Breakdown */}
                <div className="bg-white dark:bg-slate-900 p-6 border border-slate-100 dark:border-slate-800 shadow-sm" style={{ borderRadius: tokens.radius.card }}>
                   <h3 className="font-bold text-slate-900 dark:text-white mb-4">Desglose Financiero</h3>
                   <div className="space-y-3">
                      <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-lg">
                         <span className="text-slate-500">Monto Neto</span>
                         <span className="font-mono text-slate-900 dark:text-white">{expense.currency} {expense.net_amount}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-lg">
                         <span className="text-slate-500">IVA ({expense.vat_rate}%)</span>
                         <span className="font-mono text-slate-900 dark:text-white">{expense.vat_amount}</span>
                      </div>
                      <div className="flex justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                         <span className="font-bold text-blue-900 dark:text-blue-100">Total</span>
                         <span className="font-bold font-mono text-blue-900 dark:text-white text-lg">
                            {expense.currency} {expense.amount}
                         </span>
                      </div>
                   </div>
                   {expense.currency !== 'ARS' && (
                      <div className="mt-4 text-xs text-slate-500 text-right">
                         Cotización: 1 {expense.currency} = {expense.fx_rate} ARS • Total ARS: $ {expense.amount_ars}
                      </div>
                   )}
                </div>
             </div>

             {/* Right: Attachment */}
             <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 p-6 border border-slate-100 dark:border-slate-800 shadow-sm h-full flex flex-col" style={{ borderRadius: tokens.radius.card }}>
                   <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                     <Paperclip className="w-4 h-4" /> Adjunto
                   </h3>
                   
                   {expense.attachment_url ? (
                      <div className="flex-1 flex flex-col">
                         <div className="flex-1 bg-slate-100 rounded-lg overflow-hidden relative group min-h-[200px] mb-4">
                            <FilePreview url={expense.attachment_url} />
                         </div>
                         <Button 
                           variant="outline" 
                           className="w-full"
                           onClick={() => window.open(expense.attachment_url, '_blank')}
                         >
                            <Download className="w-4 h-4 mr-2" /> Descargar
                         </Button>
                      </div>
                   ) : (
                      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic border-2 border-dashed border-slate-200 rounded-xl min-h-[200px]">
                         Sin comprobante adjunto
                      </div>
                   )}
                </div>
             </div>

          </div>
        </div>
      </div>

      <ExpenseModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchExpense}
        expense={expense}
      />
    </>
  );
}

export default ExpenseDetailPage;
