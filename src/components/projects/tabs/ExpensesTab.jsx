
import React, { useState } from 'react';
import { Plus, Calendar, Tag, Trash2, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ExpenseModal from '@/components/projects/modals/ExpenseModal';
import { formatDate } from '@/lib/dateUtils';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import FilterPopover from '@/components/projects/FilterPopover';

function ExpensesTab({ projectId, expenses, currency, onRefresh }) {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [filters, setFilters] = useState({ expense_type: [], payment_status: [] });

  const handleEdit = (expense) => {
    setExpenseToEdit(expense);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const userConfirmed = window.confirm('Are you sure you want to delete this expense?');
    if (!userConfirmed) return;
    try {
      const { error } = await supabase
        .from('project_expenses')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Expense deleted' });
      onRefresh();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const filteredExpenses = expenses.filter(e => {
    const typeMatch = filters.expense_type.length === 0 || filters.expense_type.includes(e.expense_type);
    const statusMatch = filters.payment_status.length === 0 || filters.payment_status.includes(e.payment_status);
    return typeMatch && statusMatch;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-slate-900">Expenses</h2>
          <FilterPopover 
            filters={filters} 
            onFiltersChange={setFilters} 
            type="expenses" 
          />
        </div>
        <Button onClick={() => { setExpenseToEdit(null); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>

      <div className="space-y-3">
        {filteredExpenses.map((expense, index) => (
          <motion.div
            key={expense.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow flex justify-between group"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-1">{expense.description}</h3>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(expense.expense_date)}</div>
                {expense.expense_type && <div className="flex items-center gap-1"><Tag className="w-4 h-4" />{expense.expense_type.replace(/_/g, ' ')}</div>}
                {expense.payment_status && <span className={`px-2 py-0.5 rounded text-xs ${expense.payment_status === 'PAGADO' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{expense.payment_status}</span>}
              </div>
            </div>
            <div className="text-right flex items-center gap-4">
              <p className="text-xl font-bold text-red-600">-{expense.currency} {expense.amount}</p>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(expense)}><Edit className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(expense.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </motion.div>
        ))}
        {filteredExpenses.length === 0 && <p className="text-center text-slate-500 py-8">No expenses found</p>}
      </div>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={onRefresh}
        projectId={projectId}
        defaultCurrency={currency}
        expenseToEdit={expenseToEdit}
      />
    </div>
  );
}

export default ExpensesTab;
