
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, ExternalLink, Calendar, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/dateUtils';
import IncomeModal from '@/components/incomes/IncomeModal';
import usePageTitle from '@/hooks/usePageTitle';
import { incomeService } from '@/services/incomeService';

function IncomeDetailPage() {
  usePageTitle('Detalle del ingreso');
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [income, setIncome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchIncomeData = async () => {
    try {
      setLoading(true);
      const data = await incomeService.getIncomeById(id);
      setIncome(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      navigate('/incomes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomeData();
  }, [id]);

  if (loading || !income) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  return (
    <>
      <div className="p-8 max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/incomes')} className="mb-6 pl-0 text-slate-600">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Incomes
        </Button>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{income.description}</h1>
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Calendar className="w-4 h-4" /> {formatDate(income.income_date)}
              </div>
            </div>
            <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
              <Edit className="w-4 h-4 mr-2" /> Edit Income
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Amount</p>
              <p className="text-xl font-bold text-green-700">{income.currency} {income.amount}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">VAT Amount</p>
              <p className="font-medium text-slate-900">{income.vat_amount || 0}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Project</p>
              <p className="font-medium text-slate-900">{income.projects?.name}</p>
            </div>
             <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Account</p>
              {income.accounts ? (
                <p className="font-medium text-slate-900">{income.accounts.name}</p>
              ) : (
                <p className="font-medium text-red-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Account Deleted
                </p>
              )}
            </div>
            {income.inversionistas && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Inversionista</p>
                <p className="font-medium text-blue-600">{income.inversionistas.nombre}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 mb-6 pt-6 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Receipt Note / Invoice #</p>
              <p className="font-medium text-slate-900">{income.receipt_note || '-'}</p>
            </div>
          </div>

          {income.attachment_url && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <a 
                href={income.attachment_url} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center text-blue-600 hover:underline text-sm"
              >
                <ExternalLink className="w-4 h-4 mr-2" /> View Attachment
              </a>
            </div>
          )}
        </div>
      </div>

      <IncomeModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchIncomeData}
        income={income}
      />
    </>
  );
}

export default IncomeDetailPage;
