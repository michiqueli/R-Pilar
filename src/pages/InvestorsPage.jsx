
import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/ThemeProvider';
import { investorService } from '@/services/investorService';
import InvestorModal from '@/components/investors/InvestorModal';
import MovimientoModal from '@/components/movimientos/MovimientoModal';
import InvestorsTable from '@/components/investors/InvestorsTable';
import InvestorsCards from '@/components/investors/InvestorsCards';
import InvestorsEmptyState from '@/components/investors/InvestorsEmptyState';
import InvestorsFiltersPanel from '@/components/investors/InvestorsFiltersPanel';
import InvestorsColumnsSelector from '@/components/investors/InvestorsColumnsSelector';
import usePageTitle from '@/hooks/usePageTitle';

// Unified Components
import SearchBar from '@/components/common/SearchBar';
import ViewToggle from '@/components/common/ViewToggle';
import TablePaginationBar from '@/components/common/TablePaginationBar';

const InvestorsPage = () => {
  usePageTitle('Inversionistas');
  const { t } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // State
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // View & Filter State
  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: 'all' });
  const [visibleColumns, setVisibleColumns] = useState(['name', 'contact', 'status', 'invested', 'returned', 'netBalance', 'actions']);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [movementModalType, setMovementModalType] = useState(null);
  const [investorForMovement, setInvestorForMovement] = useState(null);

  useEffect(() => {
    fetchInvestors();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filters]);

  const fetchInvestors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await investorService.getInvestors();
      if (response.success) {
        setInvestors(response.data || []);
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al cargar inversionistas");
      toast({ 
        variant: 'destructive', 
        title: t('common.error'), 
        description: 'Error al cargar los datos de inversionistas.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const handleCreate = () => {
    setSelectedInvestor(null);
    setIsModalOpen(true);
  };

  const handleEdit = (inv) => {
    setSelectedInvestor(inv);
    setIsModalOpen(true);
  };

  const handleDelete = async (inv) => {
    if (!window.confirm(t('investors.delete_confirm') || '¿Está seguro que desea eliminar este inversionista?')) {
      return;
    }

    try {
      const result = await investorService.deleteInvestor(inv.id);
      if (result.success) {
        toast({ title: t('common.success'), description: 'Inversionista eliminado correctamente' });
        fetchInvestors();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      toast({ variant: 'destructive', title: t('common.error'), description: err.message });
    }
  };

  const handleView = (inv) => {
    navigate(`/inversionistas/${inv.id}`);
  };

  // Filter Logic
  const filteredInvestors = investors.filter(inv => {
    const matchesSearch = 
      inv.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.email && inv.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inv.telefono && inv.telefono.includes(searchTerm));
    
    const matchesStatus = filters.status === 'all' || inv.estado === filters.status;
    
    return matchesSearch && matchesStatus;
  });
  const totalItems = filteredInvestors.length;
  const paginatedInvestors = filteredInvestors.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <div className="min-h-screen bg-slate-50/50 dark:bg-[#111827] p-6 md:p-8 font-sans transition-colors duration-200">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto space-y-8"
        >
           {/* Header */}
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                 <h1 className="text-[32px] font-bold text-[#1F2937] dark:text-white leading-tight">
                    {t('investors.title') || 'Inversionistas'}
                 </h1>
                 <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm px-2.5 py-0.5 rounded-full font-bold">
                    {filteredInvestors.length}
                 </span>
              </div>
              
              <Button 
                variant="primary" 
                onClick={handleCreate}
                className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 px-6 h-11"
              >
                 <Plus className="w-5 h-5 mr-2" />
                 {t('investors.new') || 'Nuevo Inversionista'}
              </Button>
           </div>

           {/* 2. Unified Control Bar */}
           <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-2">
             
              {/* Search */}
              <div className="w-full md:flex-1">
                 <SearchBar 
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder={t('investors.search') || 'Buscar inversionistas...'}
                    className="w-full border-none shadow-none bg-transparent"
                 />
              </div>
             
              <div className="w-full h-px md:w-px md:h-8 bg-slate-100 dark:bg-slate-800 mx-2" />
             
              <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                  <InvestorsFiltersPanel 
                     filters={filters}
                     onFiltersChange={setFilters}
                  />
                  
                  <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 mx-1" />

                  <InvestorsColumnsSelector 
                     columns={visibleColumns}
                     onColumnsChange={setVisibleColumns}
                  />

                  <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 mx-1" />

                  {/* View Toggle */}
                  <ViewToggle 
                     view={viewMode === 'table' ? 'table' : 'grid'}
                     onViewChange={(mode) => setViewMode(mode === 'table' ? 'table' : 'cards')}
                     className="border-none shadow-none bg-transparent p-0"
                  />
              </div>
           </div>

           {/* Content */}
           <div className="min-h-[400px]">
             <AnimatePresence mode="wait">
               {loading ? (
                  <motion.div 
                     key="loader"
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                     className="flex justify-center py-20"
                  >
                     <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 dark:border-slate-700 border-t-blue-600"></div>
                  </motion.div>
               ) : filteredInvestors.length === 0 ? (
                  <InvestorsEmptyState onCreate={handleCreate} />
               ) : (
                  <motion.div
                     key={viewMode}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     transition={{ duration: 0.2 }}
                  >
                     {viewMode === 'table' ? (
                        <InvestorsTable 
                           investors={paginatedInvestors}
                           visibleColumns={visibleColumns}
                           onView={handleView}
                           onEdit={handleEdit}
                           onDelete={handleDelete}
                        />
                     ) : (
                        <InvestorsCards 
                           investors={paginatedInvestors}
                           onView={handleView}
                           onEdit={handleEdit}
                           onDelete={handleDelete}
                        />
                     )}
                  </motion.div>
               )}
             </AnimatePresence>
          </div>

          {!loading && totalItems > 0 && (
            <TablePaginationBar
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

        </motion.div>
      </div>

      {/* Modals */}
      <InvestorModal 
         isOpen={isModalOpen} 
         onClose={() => setIsModalOpen(false)} 
         onSuccess={() => { setIsModalOpen(false); fetchInvestors(); }} 
         investor={selectedInvestor}
      />

      <MovimientoModal
         isOpen={!!movementModalType}
         onClose={() => setMovementModalType(null)}
         onSuccess={() => { setMovementModalType(null); fetchInvestors(); }}
         type={movementModalType || 'INVERSION_RECIBIDA'}
         preselectedInvestorId={investorForMovement?.id}
      />
    </>
  );
};

export default InvestorsPage;
