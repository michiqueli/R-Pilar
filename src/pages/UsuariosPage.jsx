import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/contexts/LanguageContext';

// Common Components
import SearchBar from '@/components/common/SearchBar';
import ViewToggle from '@/components/common/ViewToggle';
import TablePaginationBar from '@/components/common/TablePaginationBar';
import usePageTitle from '@/hooks/usePageTitle';

// Local Components
import UsuariosTable from '@/components/users/UsuariosTable';
import UsuariosFiltersPanel from '@/components/users/UsuariosFiltersPanel';
import UsuariosColumnsSelector from '@/components/users/UsuariosColumnsSelector';
import UsuarioModal from '@/components/users/UsuarioModal'; // Asegúrate de crear este basado en el de Clientes

const UsuariosPage = () => {
  usePageTitle('Gestión de Usuarios');
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // -- Data State --
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // -- UI State --
  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // -- Filters, Columns & Pagination --
  const [filters, setFilters] = useState({ rol: 'all', estado: 'all' });
  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem('user_columns_pref_v1');
    return saved ? JSON.parse(saved) : {
      name: true,
      phone: true,
      rol: true,
      status: true,
      actions: true
    };
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // -- Handlers --
  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  // -- Derived Data Logic --
  const processedUsers = useMemo(() => {
    let result = [...users];

    if (searchTerm) {
      const low = searchTerm.toLowerCase();
      result = result.filter(u => 
        u.nombre?.toLowerCase().includes(low) || 
        u.email?.toLowerCase().includes(low) ||
        u.telefono?.includes(low)
      );
    }

    if (filters.rol !== 'all') result = result.filter(u => u.rol === filters.rol);
    if (filters.estado !== 'all') result = result.filter(u => u.estado === filters.estado);

    return result;
  }, [users, searchTerm, filters]);

  const paginatedUsers = processedUsers.slice(
    (pagination.page - 1) * pagination.limit, 
    pagination.page * pagination.limit
  );

  return (
    <div className="min-h-screen p-6 md:p-8 bg-slate-50/50 dark:bg-[#111827] font-sans">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-8">
        
        {/* 1. Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <h1 className="text-[32px] font-bold text-[#1F2937] dark:text-white leading-tight">
              {t('users.title') || 'Usuarios'}
            </h1>
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm px-2.5 py-0.5 rounded-full font-bold">
              {processedUsers.length}
            </span>
          </div>
          <Button 
            onClick={handleCreate} 
            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 px-6 h-11"
          >
            <Plus className="w-5 h-5 mr-2" /> {t('users.create') || 'Nuevo Usuario'}
          </Button>
        </div>

        {/* 2. Unified Control Bar */}
        <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-2">
          <div className="w-full md:flex-1 relative">
            <SearchBar 
              value={searchTerm} 
              onChange={setSearchTerm} 
              placeholder={t('users.search') || "Buscar por nombre, email o teléfono..."} 
              className="border-none shadow-none bg-transparent w-full" 
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <UsuariosFiltersPanel filters={filters} onFiltersChange={setFilters} />
            
            <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 mx-1" />
            
            <UsuariosColumnsSelector columns={columns} onColumnsChange={setColumns} />
            
            <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 mx-1" />
            
            <ViewToggle view={viewMode} onViewChange={setViewMode} className="border-none shadow-none bg-transparent p-0" />
          </div>
        </div>

        {/* 3. Content Area */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-20 gap-4">
              <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
              <p className="text-slate-500 animate-pulse font-medium">Sincronizando personal...</p>
            </div>
          ) : (
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <UsuariosTable 
                users={paginatedUsers} 
                columns={columns}
                onReload={fetchUsers} 
                onEdit={handleEdit}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. Pagination */}
        <TablePaginationBar 
          page={pagination.page} 
          pageSize={pagination.limit} 
          totalItems={processedUsers.length} 
          onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
          onPageSizeChange={(limit) => setPagination(prev => ({ ...prev, limit, page: 1 }))}
          labels={{
            showing: 'Mostrando',
            of: 'de',
            rowsPerPage: 'Filas por pagina: ',
            previous: 'Ant.',
            next: 'Sig.'
          }}
        />
      </motion.div>

      {/* 5. Modal */}
      <UsuarioModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchUsers}
        user={selectedUser}
      />
    </div>
  );
};

export default UsuariosPage;