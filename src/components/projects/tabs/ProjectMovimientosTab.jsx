import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Activity, 
  Loader2, 
  RefreshCw, 
  MoreVertical, 
  Eye, 
  Edit, 
  Copy, 
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrencyARS, formatCurrencyUSD } from '@/lib/formatUtils';
import { formatDate } from '@/lib/dateUtils';
import { movimientosProyectoService } from '@/services/movimientosProyectoService';
import { supabase } from '@/lib/customSupabaseClient';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

// Modals & Components
import KpiCard from '@/components/ui/KpiCard';
import MovimientoModal from '@/components/movimientos/MovimientoModal';
import TableHeader from '@/components/TableHeader';
import MovementFiltersPopover from '@/components/MovementFiltersPopover';
import ViewMovementModal from '@/components/modals/ViewMovementModal';
import EditMovementModal from '@/components/modals/EditMovementModal';
import DuplicateMovementModal from '@/components/modals/DuplicateMovementModal';
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal';

const COLUMNS = [
  { id: 'type', label: 'Tipo', locked: true },
  { id: 'description', label: 'Descripción', locked: true },
  { id: 'account', label: 'Cuenta', locked: false },
  { id: 'date', label: 'Fecha', locked: false },
  { id: 'provider', label: 'Proveedor', locked: false },
  { id: 'amount_ars', label: 'Monto ARS', locked: false },
  { id: 'amount_usd', label: 'Monto USD', locked: false },
  { id: 'net', label: 'Neto', locked: false },
  { id: 'status', label: 'Estado', locked: true },
];

const ProjectMovimientosTab = ({ projectId }) => {
  const { toast } = useToast();
  
  // Data State
  const [movements, setMovements] = useState([]);
  const [loadingMovements, setLoadingMovements] = useState(true);
  const [monthlyBalance, setMonthlyBalance] = useState({ ingresos: 0, gastos: 0, balance: 0 });

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    tipo: 'all',
    estado: 'all',
    dateStart: null,
    dateEnd: null,
    cuenta: 'all',
    proveedor: 'all'
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Column State
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('project_movements_columns');
    return saved ? JSON.parse(saved) : COLUMNS.reduce((acc, col) => ({ ...acc, [col.id]: true }), {});
  });

  // Modal States
  const [selectedMovimiento, setSelectedMovimiento] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // -- Load Data --
  const loadData = async () => {
    if (!projectId) return;
    try {
      setLoadingMovements(true);
      const data = await movimientosProyectoService.getMovimientosProyecto(projectId);
      setMovements(data);
      const now = new Date();
      const balance = await movimientosProyectoService.getBalanceMensualProyecto(projectId, now.getMonth(), now.getFullYear());
      setMonthlyBalance(balance);
    } catch (error) {
      console.error("Error loading project movements:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los movimientos.' });
    } finally {
      setLoadingMovements(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  // -- Handlers --
  const handleColumnsChange = (colId, isChecked) => {
    const newCols = { ...visibleColumns, [colId]: isChecked };
    setVisibleColumns(newCols);
    localStorage.setItem('project_movements_columns', JSON.stringify(newCols));
  };

  const activeFiltersCount = [
    filters.tipo !== 'all',
    filters.estado !== 'all',
    filters.dateStart,
    filters.dateEnd,
    filters.cuenta !== 'all',
    filters.proveedor !== 'all'
  ].filter(Boolean).length;

  const uniqueProviders = useMemo(() => 
    [...new Set(movements.map(m => m.provider_name || m.inversionista_nombre).filter(Boolean))], 
  [movements]);
  
  const uniqueAccounts = useMemo(() => 
    [...new Set(movements.map(m => m.cuenta_titulo).filter(Boolean))], 
  [movements]);

  // -- Filtering Logic --
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      // Search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        m.descripcion?.toLowerCase().includes(searchLower) ||
        m.provider_name?.toLowerCase().includes(searchLower) ||
        m.monto_ars?.toString().includes(searchLower);

      if (!matchesSearch) return false;

      // Filters
      if (filters.tipo !== 'all' && m.tipo !== filters.tipo) return false;
      if (filters.estado !== 'all' && m.estado !== filters.estado) return false;
      if (filters.cuenta !== 'all' && m.cuenta_titulo !== filters.cuenta) return false;
      if (filters.proveedor !== 'all' && (m.provider_name || m.inversionista_nombre) !== filters.proveedor) return false;
      
      if (filters.dateStart) {
        if (new Date(m.fecha) < new Date(filters.dateStart)) return false;
      }
      if (filters.dateEnd) {
        if (new Date(m.fecha) > new Date(filters.dateEnd)) return false;
      }

      return true;
    });
  }, [movements, searchTerm, filters]);


  // -- Action Handlers --
  const handleView = (mov) => { setSelectedMovimiento(mov); setShowViewModal(true); };
  const handleEdit = (mov) => { setSelectedMovimiento(mov); setShowEditModal(true); };
  const handleDuplicate = (mov) => { setSelectedMovimiento(mov); setShowDuplicateModal(true); };
  const handleDelete = (mov) => { setSelectedMovimiento(mov); setShowDeleteModal(true); };

  const confirmDelete = async () => {
    try {
      const { error } = await supabase.from('inversiones').delete().eq('id', selectedMovimiento.id);
      if (error) throw error;
      toast({ title: 'Eliminado', description: 'Movimiento eliminado correctamente.' });
      loadData();
      setShowDeleteModal(false);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el movimiento.' });
    }
  };

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'INVERSION': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-900';
      case 'DEVOLUCION': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-900';
      case 'INGRESO': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900';
      case 'GASTO': default: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900';
    }
  };

  const isBalancePositive = monthlyBalance.balance >= 0;

  return (
    <div className="space-y-6">
      {/* Monthly Balance Cards - IMPLEMENTACIÓN KPICARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="Ingresos (Mes Actual)"
          value={formatCurrencyARS(monthlyBalance.ingresos)}
          icon={TrendingUp}
          tone="emerald"
          showBar
        />
        <KpiCard
          title="Gastos (Mes Actual)"
          value={formatCurrencyARS(monthlyBalance.gastos)}
          icon={TrendingDown}
          tone="red"
          showBar
        />
        <KpiCard
          title="Balance (Mes Actual)"
          value={(isBalancePositive ? '+ ' : '') + formatCurrencyARS(monthlyBalance.balance)}
          icon={DollarSign}
          tone={isBalancePositive ? "blue" : "orange"}
          showBar
          description={isBalancePositive ? "Flujo de caja mensual positivo" : "Flujo de caja mensual negativo"}
        />
      </div>

      <div className="flex items-center gap-2 mb-2">
         <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" /> Movimientos
         </h3>
      </div>

      {/* Control Bar */}
      <MovementFiltersPopover
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
        uniqueProviders={uniqueProviders}
        uniqueAccounts={uniqueAccounts}
        trigger={
          <div /> // Hidden trigger, managed by TableHeader button click
        }
      />

      <TableHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onFilterClick={() => setIsFilterOpen(true)}
        columns={COLUMNS}
        visibleColumns={visibleColumns}
        onColumnsChange={handleColumnsChange}
        activeFiltersCount={activeFiltersCount}
        rightActions={
          <>
            <Button variant="outline" onClick={loadData} className="hidden sm:flex" size="icon" title="Actualizar">
              <RefreshCw className={`w-4 h-4 ${loadingMovements ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="primary" onClick={() => setShowNewModal(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nuevo</span>
            </Button>
          </>
        }
      />

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                {visibleColumns['type'] && <th className="px-4 py-3 whitespace-nowrap">Tipo</th>}
                {visibleColumns['description'] && <th className="px-4 py-3">Descripción</th>}
                {visibleColumns['account'] && <th className="px-4 py-3 whitespace-nowrap">Cuenta</th>}
                {visibleColumns['date'] && <th className="px-4 py-3 whitespace-nowrap">Fecha</th>}
                {visibleColumns['provider'] && <th className="px-4 py-3 whitespace-nowrap">Proveedor</th>}
                {visibleColumns['amount_ars'] && <th className="px-4 py-3 text-right whitespace-nowrap">Monto ARS</th>}
                {visibleColumns['amount_usd'] && <th className="px-4 py-3 text-right whitespace-nowrap">Monto USD</th>}
                {visibleColumns['net'] && <th className="px-4 py-3 text-right whitespace-nowrap">Neto</th>}
                {visibleColumns['status'] && <th className="px-4 py-3 text-center whitespace-nowrap">Estado</th>}
                <th className="px-4 py-3 text-right w-12">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loadingMovements ? (
                <tr>
                  <td colSpan="100%" className="px-4 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <p>Cargando movimientos...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan="100%" className="px-4 py-20 text-center text-slate-500 dark:text-slate-400">
                     No se encontraron movimientos.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    {visibleColumns['type'] && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getBadgeStyle(mov.tipo)}`}>
                          {mov.tipo}
                        </span>
                      </td>
                    )}
                    {visibleColumns['description'] && (
                      <td className="px-4 py-3">
                        <p className="text-slate-900 dark:text-white font-medium truncate max-w-[200px]" title={mov.descripcion}>
                          {mov.descripcion}
                        </p>
                      </td>
                    )}
                    {visibleColumns['account'] && (
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300 text-xs">
                        {mov.cuenta_titulo}
                      </td>
                    )}
                    {visibleColumns['date'] && (
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-xs">
                        {formatDate(mov.fecha)}
                      </td>
                    )}
                    {visibleColumns['provider'] && (
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300 text-xs">
                        {mov.provider_name || mov.inversionista_nombre}
                      </td>
                    )}
                    {visibleColumns['amount_ars'] && (
                      <td className="px-4 py-3 text-right whitespace-nowrap font-mono font-medium text-slate-900 dark:text-white">
                        {formatCurrencyARS(mov.monto_ars)}
                      </td>
                    )}
                    {visibleColumns['amount_usd'] && (
                      <td className="px-4 py-3 text-right whitespace-nowrap font-mono text-slate-500 text-xs">
                        {mov.monto_usd > 0 ? formatCurrencyUSD(mov.monto_usd) : '-'}
                      </td>
                    )}
                    {visibleColumns['net'] && (
                      <td className="px-4 py-3 text-right whitespace-nowrap font-mono text-slate-600 dark:text-slate-400 font-medium">
                        {formatCurrencyARS(mov.neto)}
                      </td>
                    )}
                    {visibleColumns['status'] && (
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                         <span className={cn(
                           "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                           mov.estado === 'CONFIRMADO' 
                             ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                             : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                         )}>
                           {mov.estado || 'PENDIENTE'}
                         </span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="iconSm" className="rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="w-4 h-4 text-slate-500" />
                             </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                             <DropdownMenuItem onClick={() => handleView(mov)}>
                                <Eye className="w-4 h-4 mr-2" /> Ver
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleEdit(mov)}>
                                <Edit className="w-4 h-4 mr-2" /> Editar
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleDuplicate(mov)}>
                                <Copy className="w-4 h-4 mr-2" /> Duplicar
                             </DropdownMenuItem>
                             <DropdownMenuSeparator />
                             <DropdownMenuItem onClick={() => handleDelete(mov)} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20">
                                <Trash2 className="w-4 h-4 mr-2" /> Borrar
                             </DropdownMenuItem>
                          </DropdownMenuContent>
                       </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <MovimientoModal 
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSuccess={loadData}
        proyectoId={projectId}
      />
      
      <ViewMovementModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        movement={selectedMovimiento}
      />

      <EditMovementModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        movement={selectedMovimiento}
        onSave={loadData}
      />

      <DuplicateMovementModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        movement={selectedMovimiento}
        onSave={loadData}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Eliminar Movimiento"
        description="¿Estás seguro de que deseas eliminar este movimiento? Esta acción no se puede deshacer."
      />
    </div>
  );
};

export default ProjectMovimientosTab;