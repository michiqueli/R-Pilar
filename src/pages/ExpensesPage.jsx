
import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/dateUtils';
import ExpenseModal from '@/components/expenses/ExpenseModal';
import ExpenseFilterPopover from '@/components/expenses/ExpenseFilterPopover';
import { useTheme } from '@/contexts/ThemeProvider';
import usePageTitle from '@/hooks/usePageTitle';
import TablePaginationBar from '@/components/common/TablePaginationBar';

function ExpensesPage() {
  usePageTitle('Gastos');
  const { t } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({
    project_id: [],
    expense_type_id: [],
    payment_status_id: [],
    currency: [],
    provider_id: [],
    month: ''
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('expenses')
        .select(`
          *,
          projects (id, name),
          providers (id, name),
          catalog_expense_type (id, name),
          catalog_payment_status (id, name),
          inversionistas (id, nombre)
        `)
        .eq('is_deleted', false)
        .order('expense_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filters]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm(t('messages.confirm_delete'))) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: t('common.success'), description: 'Expense deleted successfully' });
      fetchExpenses();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: error.message
      });
    }
  };

  const handleEdit = (e, expense) => {
    e.stopPropagation();
    setSelectedExpense(expense);
    setIsModalOpen(true);
  };

  const handleView = (e, id) => {
    e.stopPropagation();
    navigate(`/expenses/${id}`);
  };

  const filteredExpenses = expenses.filter(expense => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      expense.description.toLowerCase().includes(searchLower) ||
      expense.projects?.name?.toLowerCase().includes(searchLower) ||
      expense.providers?.name?.toLowerCase().includes(searchLower) ||
      expense.inversionistas?.nombre?.toLowerCase().includes(searchLower);

    const matchesProject = filters.project_id.length === 0 || filters.project_id.includes(expense.project_id);
    const matchesType = filters.expense_type_id.length === 0 || filters.expense_type_id.includes(expense.expense_type_id);
    const matchesStatus = filters.payment_status_id.length === 0 || filters.payment_status_id.includes(expense.payment_status_id);
    const matchesCurrency = filters.currency.length === 0 || filters.currency.includes(expense.currency);
    const matchesProvider = filters.provider_id.length === 0 || filters.provider_id.includes(expense.provider_id);
    const matchesMonth = !filters.month || expense.expense_date.startsWith(filters.month);

    return matchesSearch && matchesProject && matchesType && matchesStatus && matchesCurrency && matchesProvider && matchesMonth;
  });
  const totalItems = filteredExpenses.length;
  const paginatedExpenses = filteredExpenses.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <div className="p-8 min-h-screen bg-slate-50/50 dark:bg-slate-950">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('expenses.title')}</h1>
              <p className="text-slate-600 dark:text-slate-400">{t('expenses.subtitle')}</p>
            </div>
            <Button onClick={() => { setSelectedExpense(null); setIsModalOpen(true); }} className="rounded-full px-6 shadow-lg shadow-blue-200 dark:shadow-blue-900/20">
              <Plus className="w-4 h-4 mr-2" />
              {t('button.new_expense')}
            </Button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={t('common.search') + "..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
              <ExpenseFilterPopover filters={filters} onFiltersChange={setFilters} />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <th className="text-left py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('common.date')}</th>
                    <th className="text-left py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('common.description')}</th>
                    <th className="text-left py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('expenses.project')}</th>
                    <th className="text-left py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('expenses.provider')}</th>
                    <th className="text-left py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('common.type')}</th>
                    <th className="text-left py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('common.status')}</th>
                    <th className="text-right py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('common.amount')}</th>
                    <th className="text-right py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedExpenses.map((expense, index) => (
                    <motion.tr
                      key={expense.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={(e) => handleView(e, expense.id)}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer group transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(expense.expense_date)}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">
                        {expense.description}
                        {expense.inversionistas && (
                          <span className="block text-xs text-blue-500 mt-0.5">
                            Inv: {expense.inversionistas.nombre}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                        {expense.projects?.name || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                        {expense.providers?.name || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300">
                          {expense.catalog_expense_type?.name}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          expense.catalog_payment_status?.name === 'PAGADO'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}>
                          {expense.catalog_payment_status?.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {expense.currency} {new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(expense.amount)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="iconSm" className="rounded-full" onClick={(e) => handleEdit(e, expense)}>
                            <Edit className="w-4 h-4 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="iconSm" className="rounded-full text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => handleDelete(e, expense.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-500 dark:text-slate-400">
                        {t('messages.no_expenses_found')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {!loading && totalItems > 0 && (
              <TablePaginationBar
                className="mt-4"
                page={page}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={setPage}
                onPageSizeChange={(nextSize) => { setPageSize(nextSize); setPage(1); }}
                labels={{
                  showing: t('common.showing') || 'Mostrando',
                  of: t('common.of') || 'de',
                  rowsPerPage: t('common.rowsPerPage') || 'Filas por pág:',
                  previous: t('common.previous') || 'Anterior',
                  next: t('common.next') || 'Siguiente'
                }}
              />
            )}
          </div>
        </motion.div>
      </div>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchExpenses}
        expense={selectedExpense}
      />
    </>
  );
}

export default ExpensesPage;
