
import React, { useState } from 'react';
import { Plus, Calendar, Trash2, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import IncomeModal from '@/components/projects/modals/IncomeModal';
import { formatDate } from '@/lib/dateUtils';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

function IncomeTab({ projectId, income, currency, onRefresh }) {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [incomeToEdit, setIncomeToEdit] = useState(null);

  const handleEdit = (item) => {
    setIncomeToEdit(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const userConfirmed = window.confirm('Are you sure you want to delete this income?');
    if (!userConfirmed) return;
    try {
      const { error } = await supabase
        .from('project_income')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Income deleted' });
      onRefresh();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Income</h2>
        <Button onClick={() => { setIncomeToEdit(null); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Income
        </Button>
      </div>

      <div className="space-y-3">
        {income.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow flex justify-between group"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-1">{item.description}</h3>
              <div className="flex items-center gap-1 text-sm text-slate-500">
                <Calendar className="w-4 h-4" />
                {formatDate(item.income_date)}
              </div>
            </div>
            <div className="text-right flex items-center gap-4">
              <p className="text-xl font-bold text-green-600">+{item.currency} {item.amount}</p>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}><Edit className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </motion.div>
        ))}
        {income.length === 0 && <p className="text-center text-slate-500 py-8">No income found</p>}
      </div>

      <IncomeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={onRefresh}
        projectId={projectId}
        defaultCurrency={currency}
        incomeToEdit={incomeToEdit}
      />
    </div>
  );
}

export default IncomeTab;
