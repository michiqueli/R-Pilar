
import React, { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';

// Components
import ClientModal from '@/components/clients/ClientModal';
import ClientsTable from '@/components/clients/ClientsTable';
import ClientsCards from '@/components/clients/ClientsCards';
import ClientsFiltersPanel from '@/components/clients/ClientsFiltersPanel';
import ClientsColumnsSelector from '@/components/clients/ClientsColumnsSelector';
import usePageTitle from '@/hooks/usePageTitle';

// Unified Common Components
import SearchBar from '@/components/common/SearchBar';
import ViewToggle from '@/components/common/ViewToggle';

const ClientsPage = () => {
  usePageTitle('Clientes');
  const { t } = useTheme();
  const { toast } = useToast();
  
  // -- Data State --
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // -- UI State --
  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  
  // Filters & Pagination
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    projects: 'all'
  });
  
  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem('client_columns_pref_v2');
    return saved ? JSON.parse(saved) : {
      name: true,
      contact: true,
      phone: true,
      email: true,
      projects: true,
      actions: true
    };
  });

  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  // -- Fetch Data --
  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          projects:projects(id)
        `)
        .eq('is_deleted', false)
        .order('name', { ascending: true });

      if (error) throw error;

      const transformedData = data.map(client => ({
        ...client,
        projects_count: client.projects?.length || 0,
        created_at: client.created_at || new Date().toISOString()
      }));

      setClients(transformedData);
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: 'Error cargando clientes' });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // -- Derived Data Logic --
  const processedClients = useMemo(() => {
    let result = [...clients];

    // 1. Search
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(lowerTerm) ||
        c.tax_id?.toLowerCase().includes(lowerTerm) ||
        c.email?.toLowerCase().includes(lowerTerm) ||
        c.phone?.includes(lowerTerm)
      );
    }

    // 2. Filters
    if (filters.status !== 'all') {
      result = result.filter(c => c.status === filters.status);
    }
    
    if (filters.projects !== 'all') {
      if (filters.projects === 'with_projects') result = result.filter(c => c.projects_count > 0);
      if (filters.projects === 'without_projects') result = result.filter(c => c.projects_count === 0);
    }

    if (filters.dateRange !== 'all') {
      const now = new Date();
      result = result.filter(c => {
         const d = new Date(c.created_at);
         if (filters.dateRange === 'today') return d.toDateString() === now.toDateString();
         if (filters.dateRange === 'week') {
            const weekAgo = new Date(now.setDate(now.getDate() - 7));
            return d >= weekAgo;
         }
         if (filters.dateRange === 'month') {
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
         }
         return true;
      });
    }

    // 3. Sorting
    result.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [clients, searchTerm, filters, sortConfig]);

  // 4. Pagination
  const paginatedClients = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    return processedClients.slice(start, start + pagination.limit);
  }, [processedClients, pagination]);


  // -- Handlers --
  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleCreate = () => {
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  const handleEdit = (client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleDelete = async (client) => {
    if (!window.confirm(t('messages.confirm_delete'))) return;

    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_deleted: true })
        .eq('id', client.id);

      if (error) throw error;
      
      toast({ title: t('common.success'), description: t('messages.success_save') });
      fetchClients();
    } catch (error) {
       toast({ variant: 'destructive', title: t('common.error'), description: error.message });
    }
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
                  {t('clients.title')}
               </h1>
               <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm px-2.5 py-0.5 rounded-full font-bold">
                 {processedClients.length}
               </span>
             </div>

             <Button 
                onClick={handleCreate} 
                variant="primary" 
                className="rounded-full shadow-lg shadow-blue-500/20 px-6 h-11 bg-[#3B82F6] hover:bg-blue-700 text-white"
             >
                <Plus className="w-5 h-5 mr-2" />
                {t('clients.create')}
             </Button>
          </div>

          {/* 2. Unified Control Bar */}
          <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-2">
            
             {/* Search */}
             <div className="w-full md:flex-1 relative">
                <SearchBar 
                   value={searchTerm}
                   onChange={setSearchTerm}
                   placeholder={t('clients.search')}
                   className="w-full border-none shadow-none bg-transparent"
                />
             </div>
             
             <div className="w-full h-px md:w-px md:h-8 bg-slate-100 dark:bg-slate-800 mx-2" />

             {/* Filters & Actions Area */}
             <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                <div className="flex items-center gap-2">
                   <ClientsFiltersPanel filters={filters} onFiltersChange={(newFilters) => {
                      setFilters(newFilters);
                      setPagination(p => ({ ...p, page: 1 }));
                   }} />
                   
                   <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 mx-1" />

                   <ClientsColumnsSelector columns={columns} onColumnsChange={(newCols) => {
                      setColumns(newCols);
                      localStorage.setItem('client_columns_pref_v2', JSON.stringify(newCols));
                   }} />
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
             ) : (
                <motion.div
                   key={viewMode}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   transition={{ duration: 0.2 }}
                >
                   {viewMode === 'table' ? (
                      <ClientsTable 
                         clients={paginatedClients}
                         columns={columns}
                         onEdit={handleEdit}
                         onDelete={handleDelete}
                         sortConfig={sortConfig}
                         onSort={handleSort}
                         pagination={{ ...pagination, total: processedClients.length }}
                         onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
                         onLimitChange={(l) => setPagination(prev => ({ ...prev, limit: l, page: 1 }))}
                      />
                   ) : (
                      <ClientsCards 
                         clients={processedClients} 
                         onEdit={handleEdit}
                         onDelete={handleDelete}
                      />
                   )}
                </motion.div>
             )}
          </AnimatePresence>

        </motion.div>
      </div>

      <ClientModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchClients}
        client={selectedClient}
      />
    </>
  );
};

export default ClientsPage;
