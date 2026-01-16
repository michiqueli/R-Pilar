
import React, { useState } from 'react';
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import IncomeModal from '@/components/incomes/IncomeModal';
import { formatDate } from '@/lib/dateUtils';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ProjectIncomesTab = ({ projectId, income, currency, onRefresh }) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);

  const filteredIncome = income.filter(item => 
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.inversionistas?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro que deseas eliminar este ingreso?')) return;
    try {
      const { error } = await supabase.from('incomes').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Ingreso eliminado', description: 'El ingreso ha sido movido a la papelera.' });
      onRefresh();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleEdit = (item) => {
    setSelectedIncome(item);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setSelectedIncome(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:w-80">
          <Input
            placeholder="Buscar por descripción o inversionista..."
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={handleNew} variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Ingreso
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
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cuenta</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIncome.map((item, index) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="font-medium text-slate-900">{item.description}</div>
                    {item.inversionistas && (
                      <div className="text-xs text-blue-500 mt-0.5">Inv: {item.inversionistas.nombre}</div>
                    )}
                  </td>
                  <td className="py-4 px-6 font-medium text-green-600">
                     {item.currency} {new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(item.amount)}
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-500">
                    {formatDate(item.income_date)}
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-500">
                    {item.accounts?.name || '-'}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="iconSm" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(item)}>
                          <Edit className="w-4 h-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                          <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))}
              {filteredIncome.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    No se encontraron ingresos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <IncomeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={onRefresh}
        income={selectedIncome}
        projectId={projectId}
        defaultCurrency={currency}
      />
    </div>
  );
};

export default ProjectIncomesTab;
