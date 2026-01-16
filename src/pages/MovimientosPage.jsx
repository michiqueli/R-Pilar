
import React, { useState, useEffect } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/ThemeProvider';
import { movimientoService } from '@/services/movimientoService';

// Components
import MovimientosTable from '@/components/movimientos/MovimientosTable';
import MovimientosCards from '@/components/movimientos/MovimientosCards';
import MovimientoModal from '@/components/movimientos/MovimientoModal';
import { NewMovementModal } from '@/components/movimientos/NewMovementModal';
import MovimientosFiltersPopover from '@/components/movimientos/MovimientosFiltersPopover';
import MovimientosColumnsPopover from '@/components/movimientos/MovimientosColumnsPopover';
import MovimientosEmptyState from '@/components/movimientos/MovimientosEmptyState';
import usePageTitle from '@/hooks/usePageTitle';

// Unified Components
import SearchBar from '@/components/common/SearchBar';
import ViewToggle from '@/components/common/ViewToggle';

const STORAGE_KEY = 'movimientos_global_settings';

function MovimientosPage() {
  usePageTitle('Movimientos');
  const { t } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  // --- State Initialization ---
  const [loading, setLoading] = useState(true);
  const [movimientos, setMovimientos] = useState([]);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false); // For editing old movements (view/edit existing)
  const [isNewMovementModalOpen, setIsNewMovementModalOpen] = useState(false); // For creating new ones
  const [selectedMovimiento, setSelectedMovimiento] = useState(null);
  
  // Modal Type State
  const [newMovementType, setNewMovementType] = useState('GASTO');
  const [modalType, setModalType] = useState('gasto');
  const [modalProjectId, setModalProjectId] = useState(null);

  // Settings with persistence
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      viewMode: 'table',
      sortBy: 'date',
      sortOrder: 'desc',
      // Default columns including 'cuentas'
      columns: ['date', 'description', 'cuentas', 'amount', 'type', 'status', 'actions'],
      filters: {
        type: 'todos',
        status: [],
        dateFrom: '',
        dateTo: '',
        amountMin: '',
        amountMax: '',
        currency: 'ALL'
      }
    };
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    loadMovements();
  }, [settings.filters]);

  const loadMovements = async () => {
    setLoading(true);
    try {
      const data = await movimientoService.getMovimientos({
        ...settings.filters,
        searchTerm
      });
      // Sort by date descending is handled in service by default, but we can enforce or rely on table sort
      setMovimientos(data);
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---
  const handleSettingsChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleFilterChange = (newFilters) => {
    setSettings(prev => ({ ...prev, filters: { ...prev.filters, ...newFilters } }));
    setPage(1);
  };

  const handleAction = async (action, mov) => {
    if (action === 'view') {
      const route = mov.type === 'gasto' ? `/expenses/${mov.id}` : `/incomes/${mov.id}`;
      navigate(route);
    } else if (action === 'edit') {
      setSelectedMovimiento(mov);
      setModalType(mov.type);
      setModalProjectId(mov.project_id || null);
      setIsModalOpen(true);
    } else if (action === 'delete') {
      if (window.confirm(t('messages.confirm_delete'))) {
        try {
          await movimientoService.deleteMovimiento(mov.id, mov.type);
          toast({ title: t('common.success'), description: t('movimientos.deleted') });
          loadMovements();
        } catch (error) {
          toast({ variant: 'destructive', title: t('common.error'), description: error.message });
        }
      }
    }
  };

  const handleSort = (field) => {
    setSettings(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'desc' ? 'asc' : 'desc'
    }));
  };

  const openNewMovimiento = (type) => {
    setNewMovementType(type.toUpperCase()); // Ensure uppercase for 'GASTO', 'INGRESO'
    setIsNewMovementModalOpen(true);
  };

  const handleMovementSuccess = () => {
    loadMovements();
  };

  // --- Processing Data ---
  let processedData = movimientoService.applyFilters(movimientos, { 
    ...settings.filters, 
    searchTerm 
  });
  
  if (typeof movimientoService.sortMovimientos === 'function') {
    processedData = movimientoService.sortMovimientos(processedData, settings.sortBy, settings.sortOrder);
  }
  
  // Pagination logic locally
  const totalItems = processedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedData = processedData.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <div className="min-h-screen bg-slate-50/50 dark:bg-[#111827] p-6 md:p-8 font-sans transition-colors duration-200">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto space-y-8"
        >
          
          {/* 1. Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
               <h1 className="text-[32px] font-bold text-[#1F2937] dark:text-white leading-tight">
                 {t('movimientos.title')}
               </h1>
               <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm px-2.5 py-0.5 rounded-full font-bold">
                 {totalItems}
               </span>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => openNewMovimiento('INGRESO')}
                className="rounded-full border-green-200 text-green-700 hover:bg-green-50 dark:border-green-900/40 dark:text-green-400 dark:hover:bg-green-900/20 px-4 h-11"
              >
                <ArrowDownCircle className="w-5 h-5 mr-2" />
                {t('movimientos.ingreso')}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => openNewMovimiento('GASTO')}
                className="rounded-full border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/20 px-4 h-11"
              >
                <ArrowUpCircle className="w-5 h-5 mr-2" />
                {t('movimientos.gasto')}
              </Button>
              <Button 
                variant="primary" 
                onClick={() => openNewMovimiento('GASTO')}
                className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 px-6 h-11"
              >
                <Plus className="w-5 h-5 mr-2" />
                {t('movimientos.new')}
              </Button>
            </div>
          </div>

          {/* 2. Unified Control Bar */}
          <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-2">
             
             {/* Search */}
             <div className="w-full md:flex-1">
                <SearchBar 
                   value={searchTerm}
                   onChange={(val) => {
                     setSearchTerm(val);
                     // Optionally trigger reload or rely on client-side filter
                     // loadMovements(); // if server side search needed
                   }}
                   placeholder={t('movimientos.search_placeholder')}
                   className="w-full border-none shadow-none bg-transparent"
                />
             </div>
             
             <div className="w-full h-px md:w-px md:h-8 bg-slate-100 dark:bg-slate-800 mx-2" />
             
             <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                 <MovimientosFiltersPopover 
                    filters={settings.filters}
                    onApply={handleFilterChange}
                    onClear={handleFilterChange}
                 />

                 <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 mx-1" />
                 
                 <MovimientosColumnsPopover 
                    selectedColumns={settings.columns}
                    onApply={(cols) => handleSettingsChange('columns', cols)}
                 />

                 <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 mx-1" />

                 {/* View Toggle */}
                 <ViewToggle 
                    view={settings.viewMode === 'table' ? 'table' : 'grid'}
                    onViewChange={(mode) => handleSettingsChange('viewMode', mode === 'table' ? 'table' : 'cards')}
                    className="border-none shadow-none bg-transparent p-0"
                 />
             </div>
          </div>

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
               ) : totalItems === 0 ? (
                  <MovimientosEmptyState onCreate={() => openNewMovimiento('GASTO')} />
               ) : (
                  <motion.div
                     key={settings.viewMode}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     transition={{ duration: 0.2 }}
                  >
                     {settings.viewMode === 'table' ? (
                        <MovimientosTable 
                           movimientos={paginatedData}
                           columns={settings.columns}
                           sortBy={settings.sortBy}
                           sortOrder={settings.sortOrder}
                           onSort={handleSort}
                           onRowClick={(mov) => handleAction('view', mov)}
                           onAction={handleAction}
                           loading={loading}
                        />
                     ) : (
                        <MovimientosCards 
                           movimientos={paginatedData}
                           onCardClick={(mov) => handleAction('view', mov)}
                           onAction={handleAction}
                           loading={loading}
                        />
                     )}
                  </motion.div>
               )}
             </AnimatePresence>
          </div>

          {!loading && totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-[#374151] p-3 shadow-sm">
              <div className="text-sm text-gray-500 dark:text-gray-400 font-medium px-2">
                 {t('common.showing')} {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, totalItems)} {t('common.of')} {totalItems}
              </div>
              <div className="flex items-center gap-2">
                 <Button
                   variant="outline"
                   size="sm"
                   disabled={page === 1}
                   onClick={() => setPage(p => Math.max(1, p - 1))}
                   className="rounded-full border border-gray-200 dark:border-gray-600 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 px-5 transition-colors"
                 >
                   {t('common.previous')}
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   disabled={page === totalPages}
                   onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                   className="rounded-full border border-gray-200 dark:border-gray-600 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 px-5 transition-colors"
                 >
                   {t('common.next')}
                 </Button>
              </div>
            </div>
          )}

        </motion.div>
      </div>

      {/* Legacy Edit Modal (kept for backward compatibility if editing existing movements uses different logic) */}
      <MovimientoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => { loadMovements(); setIsModalOpen(false); }}
        movimiento={selectedMovimiento}
        initialType={modalType}
        initialProjectId={modalProjectId}
      />

      {/* Unified Creation Modal */}
      <NewMovementModal 
        isOpen={isNewMovementModalOpen}
        onClose={() => setIsNewMovementModalOpen(false)}
        onSuccess={handleMovementSuccess}
        initialType={newMovementType}
      />
    </>
  );
}

export default MovimientosPage;
