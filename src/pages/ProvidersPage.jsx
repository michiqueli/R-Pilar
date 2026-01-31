import React, { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeProvider';

// Components
import ProviderModal from '@/components/providers/ProviderModal';
import ProvidersTable from '@/components/providers/ProvidersTable';
import ProvidersCards from '@/components/providers/ProvidersCards';
import ProvidersFiltersPanel from '@/components/providers/ProvidersFiltersPanel';
import ProvidersColumnsSelector from '@/components/providers/ProvidersColumnsSelector';
import ProvidersEmptyState from '@/components/providers/ProvidersEmptyState';
import usePageTitle from '@/hooks/usePageTitle';

// Unified Common Components
import SearchBar from '@/components/common/SearchBar';
import ViewToggle from '@/components/common/ViewToggle';
import TablePaginationBar from '@/components/common/TablePaginationBar';

function ProvidersPage() {
  usePageTitle('Proveedores');
  const { t } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // -- Data State --
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // -- UI State --
  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  
  // Filters & Pagination
  const [filters, setFilters] = useState({
  status: 'all',
  dateRange: 'all', // Asegúrate que coincida con el valor del RadioGroup
  projects: 'all'
});

  // Columnas (Persistencia en LocalStorage)
  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem('provider_columns_pref_v2');
    return saved ? JSON.parse(saved) : {
      name: true,
      type: true,
      tax_id: true,
      total_billed: true, // Total Facturado (Histórico)
      pending_pay: true,  // Pendiente a Pagar
      status: true,
      actions: true
    };
  });

  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  // -- Fetch Data --
  const fetchProviders = async () => {
    setLoading(true);
    try {
      // Traemos proveedores + tipo + inversiones (para calcular totales)
      const { data, error } = await supabase
        .from('providers')
        .select(`
          *,
          catalog_provider_type (id, name),
          inversiones (
             monto_ars,
             estado,
             tipo
          )
        `)
        .eq('is_deleted', false)
        .order('name');

      if (error) throw error;

      // Procesamos los datos para calcular financieros
      const transformedData = data.map(p => {
        const gastos = p.inversiones?.filter(i => i.tipo === 'GASTO') || [];
        
        const totalBilled = gastos
            .filter(i => i.estado === 'CONFIRMADO')
            .reduce((acc, curr) => acc + Number(curr.monto_ars || 0), 0);
            
        const pendingPay = gastos
            .filter(i => i.estado === 'PENDIENTE')
            .reduce((acc, curr) => acc + Number(curr.monto_ars || 0), 0);

        return {
          ...p,
          total_billed: totalBilled,
          pending_pay: pendingPay,
          type_name: p.catalog_provider_type?.name || 'General'
        };
      });

      setProviders(transformedData);
    } catch (error) {
      console.error(error);
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
    fetchProviders();
  }, []);

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchTerm, filters]);

  // -- Derived Data Logic --
  const processedProviders = useMemo(() => {
    let result = [...providers];

    // 1. Búsqueda (Search)
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name?.toLowerCase().includes(lowerTerm) ||
        p.email?.toLowerCase().includes(lowerTerm) ||
        p.tax_id?.toLowerCase().includes(lowerTerm)
      );
    }

    // 2. Filtro de Estado (is_active es booleano en BDD)
    if (filters.status !== 'all') {
      const isActiveRequired = filters.status === 'active';
      result = result.filter(p => p.is_active === isActiveRequired);
    }

    // 3. Filtro de Tipo (Aseguramos que 'all' no filtre nada)
    if (filters.type_id && filters.type_id !== 'all') {
      // Si el filtro es un array (viniendo de versiones viejas) o un string/id único
      if (Array.isArray(filters.type_id)) {
        if (filters.type_id.length > 0) {
          result = result.filter(p => filters.type_id.includes(p.provider_type_id));
        }
      } else {
        result = result.filter(p => p.provider_type_id === filters.type_id);
      }
    }

    // 4. Ordenamiento (Sorting)
    result.sort((a, b) => {
      let valA = a[sortConfig.key] ?? '';
      let valB = b[sortConfig.key] ?? '';
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [providers, searchTerm, filters, sortConfig]);

  // 4. Pagination
  const paginatedProviders = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    return processedProviders.slice(start, start + pagination.limit);
  }, [processedProviders, pagination]);

  // -- Handlers --
  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleToggleActive = async (provider) => {
    try {
      const { error } = await supabase
        .from('providers')
        .update({ is_active: !provider.is_active })
        .eq('id', provider.id);

      if (error) throw error;
      
      // Actualización optimista local
      setProviders(prev => prev.map(p => 
          p.id === provider.id ? { ...p, is_active: !p.is_active } : p
      ));
      
      toast({ title: t('common.success'), description: t('messages.success_saved') });
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: error.message });
    }
  };

  const handleDelete = async (provider) => {
    if (!window.confirm(t('messages.confirm_delete'))) return;
    try {
      const { error } = await supabase.from('providers').update({ is_deleted: true }).eq('id', provider.id);
      if (error) throw error;
      
      toast({ title: t('common.success'), description: t('messages.success_saved') });
      fetchProviders();
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: error.message });
    }
  };

  const handleEdit = (provider) => {
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  const handleView = (provider) => {
    navigate(`/providers/${provider.id}`);
  };

  const handleCreate = () => {
    setSelectedProvider(null);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="min-h-screen p-6 md:p-8 bg-slate-50/50 dark:bg-[#111827] transition-colors duration-200 font-sans">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto space-y-8"
        >
          {/* 1. Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
               <h1 className="text-[32px] font-bold text-[#1F2937] dark:text-white leading-tight">
                 {t('providers.title')}
               </h1>
               <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm px-2.5 py-0.5 rounded-full font-bold">
                 {processedProviders.length}
               </span>
            </div>
            
            <Button 
              variant="primary" 
              onClick={handleCreate}
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 px-6 h-11"
            >
              <Plus className="w-5 h-5 mr-2" />
              {t('providers.newProvider')}
            </Button>
          </div>

          {/* 2. Unified Control Bar */}
          <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-2">
             
             {/* Search */}
             <div className="w-full md:flex-1 relative">
                <SearchBar 
                   value={searchTerm}
                   onChange={setSearchTerm}
                   placeholder={t('providers.search')}
                   className="w-full border-none shadow-none bg-transparent"
                />
             </div>
             
             <div className="w-full h-px md:w-px md:h-8 bg-slate-100 dark:bg-slate-800 mx-2" />
             
             {/* Filters & Actions Area */}
             <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                <div className="flex items-center gap-2">
                   {/* Asumimos que tienes ProvidersFiltersPanel o usas uno genérico */}
                   <ProvidersFiltersPanel 
                      filters={filters} 
                      onFiltersChange={(newFilters) => {
                         setFilters(newFilters);
                         setPagination(p => ({ ...p, page: 1 }));
                      }} 
                   />

                   <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 mx-1" />

                   {/* Selector de Columnas */}
                   <ProvidersColumnsSelector 
                      columns={columns} 
                      onColumnsChange={(newCols) => {
                         setColumns(newCols);
                         localStorage.setItem('provider_columns_pref_v2', JSON.stringify(newCols));
                      }} 
                   />
                </div>

                <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 mx-1" />

                {/* View Toggle */}
                <ViewToggle 
                   view={viewMode}
                   onViewChange={setViewMode}
                   className="border-none shadow-none bg-transparent p-0"
                />
             </div>
          </div>

          {/* 3. Content Area */}
          <AnimatePresence mode="wait">
            {loading ? (
               <motion.div 
                  key="loader"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex justify-center py-20"
               >
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600"></div>
               </motion.div>
            ) : paginatedProviders.length === 0 && !searchTerm ? ( 
               <ProvidersEmptyState onCreate={handleCreate} />
            ) : (
               <motion.div
                  key={viewMode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
               >
                  {viewMode === 'table' ? (
                     <ProvidersTable 
                        providers={paginatedProviders}
                        columns={columns} // Pasamos columnas seleccionadas
                        sortConfig={sortConfig}
                        onSort={handleSort}
                        onView={handleView}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleStatus={handleToggleActive}
                     />
                  ) : (
                     <ProvidersCards 
                        providers={paginatedProviders}
                        onView={handleView}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleStatus={handleToggleActive}
                     />
                  )}
               </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {!loading && processedProviders.length > 0 && (
             <TablePaginationBar
               page={pagination.page}
               pageSize={pagination.limit}
               totalItems={processedProviders.length}
               onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
               onPageSizeChange={(limit) => setPagination(prev => ({ ...prev, limit, page: 1 }))}
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

      <ProviderModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedProvider(null); }}
        onSuccess={fetchProviders}
        provider={selectedProvider}
      />
    </>
  );
}

export default ProvidersPage;