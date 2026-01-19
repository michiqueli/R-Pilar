
import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeProvider';
import ProviderModal from '@/components/providers/ProviderModal';
import ProvidersTable from '@/components/providers/ProvidersTable';
import ProvidersCards from '@/components/providers/ProvidersCards';
import ProviderFilterPopover from '@/components/providers/ProviderFilterPopover';
import ProvidersEmptyState from '@/components/providers/ProvidersEmptyState';
import usePageTitle from '@/hooks/usePageTitle';

// Unified Components
import SearchBar from '@/components/common/SearchBar';
import ViewToggle from '@/components/common/ViewToggle';
import TablePaginationBar from '@/components/common/TablePaginationBar';

function ProvidersPage() {
  usePageTitle('Proveedores');
  const { t } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [filters, setFilters] = useState({
    type_id: [],
    is_active: null
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('providers')
        .select(`
          *,
          catalog_provider_type (
            id,
            name
          )
        `)
        .eq('is_deleted', false)
        .order('name');

      if (error) throw error;
      setProviders(data || []);
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
    fetchProviders();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filters]);

  const handleToggleActive = async (provider) => {
    try {
      const { error } = await supabase
        .from('providers')
        .update({ is_active: !provider.is_active })
        .eq('id', provider.id);

      if (error) throw error;
      
      fetchProviders();
      toast({
        title: t('common.success'),
        description: t('messages.success_saved')
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: error.message
      });
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

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = 
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (provider.email && provider.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (provider.tax_id && provider.tax_id.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filters.type_id.length === 0 || filters.type_id.includes(provider.provider_type_id);
    const matchesStatus = filters.is_active === null || provider.is_active === filters.is_active;

    return matchesSearch && matchesType && matchesStatus;
  });
  const totalItems = filteredProviders.length;
  const paginatedProviders = filteredProviders.slice((page - 1) * pageSize, page * pageSize);

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
                 {t('providers.title')}
               </h1>
               <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm px-2.5 py-0.5 rounded-full font-bold">
                 {providers.length}
               </span>
            </div>
            
            <Button 
              variant="primary" 
              onClick={() => { setSelectedProvider(null); setIsModalOpen(true); }}
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 px-6 h-11"
            >
              <Plus className="w-5 h-5 mr-2" />
              {t('providers.newProvider')}
            </Button>
          </div>

          {/* 2. Unified Control Bar */}
          <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-2">
             
             {/* Search */}
             <div className="w-full md:flex-1">
                <SearchBar 
                   value={searchTerm}
                   onChange={setSearchTerm}
                   placeholder={t('providers.search')}
                   className="w-full border-none shadow-none bg-transparent"
                />
             </div>
             
             <div className="w-full h-px md:w-px md:h-8 bg-slate-100 dark:bg-slate-800 mx-2" />
             
             <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                 <ProviderFilterPopover 
                   filters={filters}
                   onFiltersChange={setFilters}
                 />

                 <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 mx-1" />

                 {/* View Toggle */}
                 <ViewToggle 
                    view={viewMode}
                    onViewChange={setViewMode}
                    className="border-none shadow-none bg-transparent p-0"
                 />
             </div>
          </div>

          {/* 3. Content */}
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
               ) : filteredProviders.length === 0 ? (
                  <ProvidersEmptyState onCreate={() => { setSelectedProvider(null); setIsModalOpen(true); }} />
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
