
import React, { useState } from 'react';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { Card } from '@/components/ui/Card';
import ExpenseModal from '@/components/expenses/ExpenseModal';
import { formatDate } from '@/lib/dateUtils';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { tokens } from '@/lib/designTokens';

const ProjectExpensesTab = ({ projectId, expenses, currency, onRefresh }) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const filteredExpenses = expenses.filter(expense => 
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.providers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.inversionistas?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro que deseas eliminar este gasto?')) return;
    try {
      const { error } = await supabase.from('expenses').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Gasto eliminado', description: 'El gasto ha sido movido a la papelera.' });
      onRefresh();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setSelectedExpense(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:w-80">
          <Input
            placeholder="Buscar por descripción, proveedor o inversionista..."
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={handleNew} variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Gasto
        </Button>
      </div>

      <Card className="overflow-hidden border border-slate-200 p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">Descripción</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((expense, index) => (
                <motion.tr
                  key={expense.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="font-medium text-slate-900">{expense.description}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {expense.providers?.name || expense.inversionistas?.nombre}
                    </div>
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-900">
                     {expense.currency} {new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(expense.amount)}
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-500">
                    {formatDate(expense.expense_date)}
                  </td>
                  <td className="py-4 px-6">
                    <Chip 
                      label={expense.catalog_payment_status?.name} 
                      variant={expense.catalog_payment_status?.name}
                      size="sm"
                    />
                  </td>
                  <td className="py-4 px-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="iconSm" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(expense)}>
                          <Edit className="w-4 h-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(expense.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                          <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    No se encontraron gastos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={onRefresh}
        expense={selectedExpense}
        projectId={projectId}
        defaultCurrency={currency}
      />
    </div>
  );
};

export default ProjectExpensesTab;
