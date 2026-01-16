
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/dateUtils';
import IncomeModal from '@/components/incomes/IncomeModal';
import IncomeFilterPopover from '@/components/incomes/IncomeFilterPopover';
import usePageTitle from '@/hooks/usePageTitle';
import { incomeService } from '@/services/incomeService';

function IncomesPage() {
  usePageTitle('Ingresos');
  const { toast } = useToast();
  const navigate = useNavigate();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    project_id: [],
    currency: [],
    month: ''
  });

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const data = await incomeService.getIncomes();
      setIncomes(data || []);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this income?')) return;

    try {
      await incomeService.deleteIncome(id);
      toast({ title: 'Success', description: 'Income deleted successfully' });
      fetchIncomes();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
    }
  };

  const handleEdit = (e, income) => {
    e.stopPropagation();
    setSelectedIncome(income);
    setIsModalOpen(true);
  };

  const handleView = (e, id) => {
    e.stopPropagation();
    navigate(`/incomes/${id}`);
  };

  const filteredIncomes = incomes.filter(income => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      income.description.toLowerCase().includes(searchLower) ||
      income.projects?.name?.toLowerCase().includes(searchLower) ||
      income.inversionistas?.nombre?.toLowerCase().includes(searchLower);

    const matchesProject = filters.project_id.length === 0 || filters.project_id.includes(income.project_id);
    const matchesCurrency = filters.currency.length === 0 || filters.currency.includes(income.currency);
    const matchesMonth = !filters.month || income.income_date.startsWith(filters.month);

    return matchesSearch && matchesProject && matchesCurrency && matchesMonth;
  });

  return (
    <>
      <div className="p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Incomes</h1>
              <p className="text-slate-600">Track all incoming revenue</p>
            </div>
            <Button onClick={() => { setSelectedIncome(null); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Income
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search description or project..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <IncomeFilterPopover filters={filters} onFiltersChange={setFilters} />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Project</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Account</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">VAT</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncomes.map((income, index) => (
                    <motion.tr
                      key={income.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={(e) => handleView(e, income.id)}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer group"
                    >
                      <td className="py-3 px-4 text-sm text-slate-600 whitespace-nowrap">
                        {formatDate(income.income_date)}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">
                        {income.description}
                        {income.inversionistas && (
                          <span className="block text-xs text-blue-500 mt-0.5">
                            Inv: {income.inversionistas.nombre}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {income.projects?.name || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {income.accounts ? (
                          income.accounts.name
                        ) : (
                          <span className="text-red-500 flex items-center gap-1 text-xs">
                            <AlertTriangle className="w-3 h-3" /> Deleted
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-slate-600 whitespace-nowrap">
                        {income.vat_amount ? `${income.currency} ${new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(income.vat_amount)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-semibold text-green-700 whitespace-nowrap">
                        {income.currency} {new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(income.amount)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => handleEdit(e, income)}>
                            <Edit className="w-4 h-4 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => handleDelete(e, income.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {filteredIncomes.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-500">
                        No incomes found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>

      <IncomeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchIncomes}
        income={selectedIncome}
      />
    </>
  );
}

export default IncomesPage;
