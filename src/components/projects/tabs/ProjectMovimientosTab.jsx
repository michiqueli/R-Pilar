import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
   DollarSign,
   ChevronUp,
   ChevronDown,
   Search,
   Filter
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrencyARS, formatCurrencyUSD } from '@/lib/formatUtils';
import { formatDate } from '@/lib/dateUtils';
import { movimientosProyectoService } from '@/services/movimientosProyectoService';
import { supabase } from '@/lib/customSupabaseClient';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/contexts/LanguageContext';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
   DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

// Modals & Components
import KpiCard from '@/components/ui/KpiCard';
import TableHeader from '@/components/TableHeader';
import MovementFiltersPopover from '@/components/MovementFiltersPopover';
import ViewMovementModal from '@/components/modals/ViewMovementModal';
import EditMovementModal from '@/components/modals/EditMovementModal';
import DuplicateMovementModal from '@/components/modals/DuplicateMovementModal';
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal';

const COLUMNS = [
   { id: 'type', label: 'Tipo', locked: true, sortable: true },
   { id: 'description', label: 'Descripción', locked: true, sortable: true },
   { id: 'account', label: 'Cuenta', locked: false, sortable: true },
   { id: 'date', label: 'Fecha', locked: false, sortable: true },
   { id: 'provider', label: 'Proveedor', locked: false, sortable: true },
   { id: 'amount_ars', label: 'Monto ARS', locked: false, sortable: true },
   { id: 'amount_usd', label: 'Monto USD', locked: false, sortable: true },
   { id: 'net', label: 'Neto', locked: false, sortable: true },
   { id: 'status', label: 'Estado', locked: true, sortable: true },
];

const ProjectMovimientosTab = ({ projectId }) => {
   const { t } = useTranslation();
   const { toast } = useToast();
   const navigate = useNavigate();
   
   // Data State
   const [movements, setMovements] = useState([]);
   const [loadingMovements, setLoadingMovements] = useState(true);
   const [monthlyBalance, setMonthlyBalance] = useState({ ingresos: 0, gastos: 0, balance: 0 });

   // Pagination State
   const [currentPage, setCurrentPage] = useState(1);
   const [pageSize, setPageSize] = useState(10);

   // Sorting State
   const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

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

   // Reset to page 1 when filters or page size change
   useEffect(() => {
      setCurrentPage(1);
   }, [searchTerm, filters, pageSize]);

   // -- Sorting Handler --
   const requestSort = (key) => {
      let direction = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') {
         direction = 'desc';
      }
      setSortConfig({ key, direction });
   };

   const getSortIcon = (columnId) => {
      if (sortConfig.key !== columnId) return <ChevronDown className="w-3 h-3 opacity-20" />;
      return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />;
   };

   // -- Logic to Process Data (Filter -> Sort -> Paginate) --
   const processedData = useMemo(() => {
      // 1. Filter
      let filtered = movements.filter(m => {
         const searchLower = searchTerm.toLowerCase();
         const matchesSearch = 
            m.descripcion?.toLowerCase().includes(searchLower) ||
            (m.provider_name || m.inversionista_nombre)?.toLowerCase().includes(searchLower) ||
            m.monto_ars?.toString().includes(searchLower);

         if (!matchesSearch) return false;
         if (filters.tipo !== 'all' && m.tipo !== filters.tipo) return false;
         if (filters.estado !== 'all' && (m.estado || 'PENDIENTE').toUpperCase() !== filters.estado.toUpperCase()) return false;
         if (filters.cuenta !== 'all' && m.cuenta_titulo !== filters.cuenta) return false;
         if (filters.proveedor !== 'all' && (m.provider_name || m.inversionista_nombre) !== filters.proveedor) return false;
         if (filters.dateStart && new Date(m.fecha) < new Date(filters.dateStart)) return false;
         if (filters.dateEnd && new Date(m.fecha) > new Date(filters.dateEnd)) return false;

         return true;
      });

      // 2. Sort
      if (sortConfig.key) {
         filtered.sort((a, b) => {
            let aVal, bVal;
            switch (sortConfig.key) {
               case 'amount_ars': aVal = Number(a.monto_ars); bVal = Number(b.monto_ars); break;
               case 'amount_usd': aVal = Number(a.monto_usd); bVal = Number(b.monto_usd); break;
               case 'net': aVal = Number(a.neto); bVal = Number(b.neto); break;
               case 'date': aVal = new Date(a.fecha).getTime(); bVal = new Date(b.fecha).getTime(); break;
               case 'provider': aVal = (a.provider_name || a.inversionista_nombre || '').toLowerCase(); bVal = (b.provider_name || b.inversionista_nombre || '').toLowerCase(); break;
               default: aVal = (a[sortConfig.key] || '').toString().toLowerCase(); bVal = (b[sortConfig.key] || '').toString().toLowerCase();
            }
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
         });
      }

      // 3. Paginate
      const totalItems = filtered.length;
      const totalPages = Math.ceil(totalItems / pageSize);
      const startIndex = (currentPage - 1) * pageSize;
      const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

      return { items: paginatedItems, totalItems, totalPages };
   }, [movements, searchTerm, filters, sortConfig, currentPage, pageSize]);

   // -- Handlers --
   const handleColumnsChange = (colId, isChecked) => {
      const newCols = { ...visibleColumns, [colId]: isChecked };
      setVisibleColumns(newCols);
      localStorage.setItem('project_movements_columns', JSON.stringify(newCols));
   };

   const uniqueProviders = useMemo(() => 
      [...new Set(movements.map(m => m.provider_name || m.inversionista_nombre).filter(Boolean))], 
   [movements]);
   
   const uniqueAccounts = useMemo(() => 
      [...new Set(movements.map(m => m.cuenta_titulo).filter(Boolean))], 
   [movements]);

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
         case 'INVERSION': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200';
         case 'DEVOLUCION': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200';
         case 'INGRESO': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200';
         default: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200';
      }
   };

   const isBalancePositive = monthlyBalance.balance >= 0;

   return (
      <div className="space-y-6 animate-in fade-in duration-500">
         {/* KPI Section */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KpiCard title="Ingresos (Mes Actual)" value={formatCurrencyARS(monthlyBalance.ingresos)} icon={TrendingUp} tone="emerald" showBar />
            <KpiCard title="Gastos (Mes Actual)" value={formatCurrencyARS(monthlyBalance.gastos)} icon={TrendingDown} tone="red" showBar />
            <KpiCard title="Balance (Mes Actual)" value={(isBalancePositive ? '+ ' : '') + formatCurrencyARS(monthlyBalance.balance)} icon={DollarSign} tone={isBalancePositive ? "blue" : "orange"} showBar />
         </div>

         {/* Header Unificado con Estilo Enmarcado */}
         <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                     <Activity className="w-5 h-5" />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Movimientos de Caja</h3>
                     <p className="text-sm text-slate-500 dark:text-slate-400">Historial financiero detallado del proyecto.</p>
                  </div>
               </div>

               <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button variant="outline" size="icon" onClick={loadData} title="Refrescar">
                     <RefreshCw className={cn("w-4 h-4", loadingMovements && "animate-spin")} />
                  </Button>
                  <Button 
                     onClick={() => navigate(`/movimientos/nuevo?projectId=${projectId}`)}
                     className="flex-1 sm:flex-none rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 gap-2"
                  >
                     <Plus className="w-4 h-4" /> Nuevo Movimiento
                  </Button>
               </div>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
               <TableHeader 
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  onFilterClick={() => setIsFilterOpen(true)}
                  columns={COLUMNS}
                  visibleColumns={visibleColumns}
                  onColumnsChange={handleColumnsChange}
                  activeFiltersCount={Object.values(filters).filter(v => v !== 'all' && v !== null).length}
               />
            </div>
         </div>

         <MovementFiltersPopover
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            filters={filters}
            onFiltersChange={setFilters}
            uniqueProviders={uniqueProviders}
            uniqueAccounts={uniqueAccounts}
            trigger={<div />}
         />

         {/* Table Content */}
         <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto min-h-[300px]">
               <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">
                     <tr>
                        {COLUMNS.map(col => visibleColumns[col.id] && (
                           <th 
                              key={col.id} 
                              className={cn(
                                 "px-4 py-3 whitespace-nowrap cursor-pointer hover:text-blue-600 transition-colors group",
                                 (col.id.includes('amount') || col.id === 'net') && "text-right"
                              )}
                              onClick={() => requestSort(col.id)}
                           >
                              <div className={cn("flex items-center gap-1", (col.id.includes('amount') || col.id === 'net') && "justify-end")}>
                                 {col.label}
                                 {getSortIcon(col.id)}
                              </div>
                           </th>
                        ))}
                        <th className="px-4 py-3 text-right w-12">Acciones</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                     {loadingMovements ? (
                        <tr>
                           <td colSpan="100%" className="px-4 py-20 text-center">
                              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                              <span className="text-slate-500">Cargando movimientos...</span>
                           </td>
                        </tr>
                     ) : processedData.items.length === 0 ? (
                        <tr>
                           <td colSpan="100%" className="px-4 py-20 text-center text-slate-500">
                              No se encontraron movimientos con los criterios aplicados.
                           </td>
                        </tr>
                     ) : (
                        processedData.items.map((mov) => (
                           <tr key={mov.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                              {visibleColumns['type'] && (
                                 <td className="px-4 py-3"><span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border", getBadgeStyle(mov.tipo))}>{mov.tipo}</span></td>
                              )}
                              {visibleColumns['description'] && (
                                 <td className="px-4 py-3 font-medium text-slate-900 dark:text-white truncate max-w-[200px]" title={mov.descripcion}>{mov.descripcion}</td>
                              )}
                              {visibleColumns['account'] && (
                                 <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{mov.cuenta_titulo}</td>
                              )}
                              {visibleColumns['date'] && (
                                 <td className="px-4 py-3 text-xs font-mono text-slate-500">{formatDate(mov.fecha)}</td>
                              )}
                              {visibleColumns['provider'] && (
                                 <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{mov.provider_name || mov.inversionista_nombre || '-'}</td>
                              )}
                              {visibleColumns['amount_ars'] && (
                                 <td className="px-4 py-3 text-right font-mono font-medium text-slate-900 dark:text-white">{formatCurrencyARS(mov.monto_ars)}</td>
                              )}
                              {visibleColumns['amount_usd'] && (
                                 <td className="px-4 py-3 text-right font-mono text-slate-500 text-xs">{mov.monto_usd > 0 ? formatCurrencyUSD(mov.monto_usd) : '-'}</td>
                              )}
                              {visibleColumns['net'] && (
                                 <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-400">{formatCurrencyARS(mov.neto)}</td>
                              )}
                              {visibleColumns['status'] && (
                                 <td className="px-4 py-3 text-center">
                                    <span className={cn(
                                       "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                       (mov.estado || 'PENDIENTE').toUpperCase() === 'CONFIRMADO' ? 'bg-green-100 text-green-700 dark:bg-green-900/20' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/20'
                                    )}>
                                       {mov.estado || 'PENDIENTE'}
                                    </span>
                                 </td>
                              )}
                              <td className="px-4 py-3 text-right">
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                       <Button variant="ghost" size="iconSm" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                          <MoreVertical className="w-4 h-4 text-slate-400" />
                                       </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40">
                                       <DropdownMenuItem onClick={() => handleView(mov)}><Eye className="w-4 h-4 mr-2" /> Ver</DropdownMenuItem>
                                       <DropdownMenuItem onClick={() => handleEdit(mov)}><Edit className="w-4 h-4 mr-2" /> Editar</DropdownMenuItem>
                                       <DropdownMenuItem onClick={() => handleDuplicate(mov)}><Copy className="w-4 h-4 mr-2" /> Duplicar</DropdownMenuItem>
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

            {/* Footer de Paginación y Selector de Filas */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
               <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-500 font-medium italic">
                     Mostrando {processedData.items.length} de {processedData.totalItems} movimientos
                  </span>
                  
                  <div className="flex items-center gap-2">
                     <span className="text-xs text-slate-400">Filas:</span>
                     <select 
                        value={pageSize} 
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs p-1 focus:ring-1 focus:ring-blue-500 outline-none h-7"
                     >
                        {[5, 10, 20, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                     </select>
                  </div>
               </div>

               <div className="flex items-center gap-2">
                  <Button
                     variant="outline"
                     size="sm"
                     disabled={currentPage === 1}
                     onClick={() => setCurrentPage(prev => prev - 1)}
                     className="h-8 px-3 rounded-lg text-xs"
                  >
                     Anterior
                  </Button>
                  
                  <div className="flex items-center gap-1">
                     {[...Array(processedData.totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        // Mostrar solo algunas páginas si hay demasiadas
                        if (processedData.totalPages > 5 && Math.abs(pageNum - currentPage) > 1 && pageNum !== 1 && pageNum !== processedData.totalPages) {
                           if (pageNum === 2 || pageNum === processedData.totalPages - 1) return <span key={i} className="px-1 text-slate-400">...</span>;
                           return null;
                        }
                        return (
                           <Button
                              key={i}
                              variant={currentPage === pageNum ? "primary" : "ghost"}
                              size="iconSm"
                              onClick={() => setCurrentPage(pageNum)}
                              className={cn(
                                 "h-8 w-8 rounded-lg text-xs",
                                 currentPage === pageNum ? "bg-blue-600 text-white hover:bg-blue-700" : "text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                              )}
                           >
                              {pageNum}
                           </Button>
                        );
                     })}
                  </div>

                  <Button
                     variant="outline"
                     size="sm"
                     disabled={currentPage === processedData.totalPages || processedData.totalPages === 0}
                     onClick={() => setCurrentPage(prev => prev + 1)}
                     className="h-8 px-3 rounded-lg text-xs"
                  >
                     Siguiente
                  </Button>
               </div>
            </div>
         </div>

         {/* Modals para ver/editar/etc */}
         <ViewMovementModal isOpen={showViewModal} onClose={() => setShowViewModal(false)} movement={selectedMovimiento} />
         <EditMovementModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} movement={selectedMovimiento} onSave={loadData} />
         <DuplicateMovementModal isOpen={showDuplicateModal} onClose={() => setShowDuplicateModal(false)} movement={selectedMovimiento} onSave={loadData} />
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