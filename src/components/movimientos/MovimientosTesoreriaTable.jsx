import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient'; 
import { 
  MoreVertical, Search, Filter, Columns, Plus, 
  Eye, Edit, Trash2, Copy, CheckCircle2, Circle, Loader2,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { formatCurrencyARS, formatDate } from '@/lib/formatUtils';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/components/ui/use-toast';

const MovimientosTesoreriaTable = ({
  movimientos = [],
  loading,
  onSearch,
  onFilterChange,
  filters,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onNew,
  onRefresh,
  // NEW: Selection props
  selectable = false,
  selectedIds = [],
  onSelectionChange
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [localMovimientos, setLocalMovimientos] = useState([]);

  // NEW: Sorting state
  const [sortField, setSortField] = useState('fecha');
  const [sortDir, setSortDir] = useState('desc');

  const [visibleColumns, setVisibleColumns] = useState({
    fecha: true,
    descripcion: true,
    tipo: true,
    monto: true,
    estado: true,
    cuenta: true,
    acciones: true
  });

  useEffect(() => {
    setLocalMovimientos(movimientos);
  }, [movimientos]);

  // NEW: Sorted movements
  const sortedMovimientos = useMemo(() => {
    const sorted = [...localMovimientos];
    sorted.sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case 'fecha':
          aVal = a.fecha || ''; bVal = b.fecha || '';
          break;
        case 'descripcion':
          aVal = (a.descripcion || '').toLowerCase(); bVal = (b.descripcion || '').toLowerCase();
          break;
        case 'tipo':
          aVal = a.tipo || ''; bVal = b.tipo || '';
          break;
        case 'monto':
          aVal = Number(a.monto_ars || 0); bVal = Number(b.monto_ars || 0);
          return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        case 'estado':
          aVal = a.estado || ''; bVal = b.estado || '';
          break;
        case 'cuenta':
          aVal = (a.cuentas?.titulo || '').toLowerCase(); bVal = (b.cuentas?.titulo || '').toLowerCase();
          break;
        default:
          aVal = a[sortField] || ''; bVal = b[sortField] || '';
      }
      if (typeof aVal === 'string') {
        const cmp = aVal.localeCompare(bVal);
        return sortDir === 'asc' ? cmp : -cmp;
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return sorted;
  }, [localMovimientos, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
    return sortDir === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1 text-blue-500" /> 
      : <ArrowDown className="w-3 h-3 ml-1 text-blue-500" />;
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch(term);
  };

  const formatSafeDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(`${dateString}T12:00:00`);
    return formatDate(date);
  };

  // NEW: Selection handlers
  const allIds = sortedMovimientos.map(m => m.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.includes(id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(allIds);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      onSelectionChange?.(selectedIds.filter(sid => sid !== id));
    } else {
      onSelectionChange?.([...selectedIds, id]);
    }
  };

  const handleQuickStatusToggle = async (mov) => {
    if (updatingId) return;
    const estadoAnterior = mov.estado;
    const nuevoEstado = mov.estado === 'CONFIRMADO' ? 'PENDIENTE' : 'CONFIRMADO';
    setUpdatingId(mov.id);
    setLocalMovimientos(prev => prev.map(m => 
        m.id === mov.id ? { ...m, estado: nuevoEstado } : m
    ));
    try {
      const { error } = await supabase.from('inversiones').update({ estado: nuevoEstado }).eq('id', mov.id);
      if (error) throw error;
      toast({
        title: nuevoEstado === 'CONFIRMADO' ? "Movimiento Confirmado" : "Movimiento Pendiente",
        description: `Se ha actualizado el estado de "${mov.descripcion}"`,
        className: nuevoEstado === 'CONFIRMADO' ? "border-green-400" : "border-orange-400"
      });
      if (onRefresh) onRefresh(); 
    } catch (error) {
      console.error(error);
      setLocalMovimientos(prev => prev.map(m => 
        m.id === mov.id ? { ...m, estado: estadoAnterior } : m
      ));
      toast({ variant: "destructive", title: "Error", description: "No se pudo cambiar el estado." });
    } finally { setUpdatingId(null); }
  };

  const colSpanCount = Object.values(visibleColumns).filter(Boolean).length + (selectable ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Buscar por descripción..." 
            className="pl-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Filtros
                {(filters.tipo || filters.estado) && <Badge variant="secondary" className="h-5 px-1.5 ml-1 text-[10px]">!</Badge>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4" align="end">
               <div className="space-y-4">
                  <h4 className="font-medium text-sm">Filtrar Movimientos</h4>
                  <div className="space-y-2">
                     <label className="text-xs font-medium">Tipo</label>
                     <select className="w-full text-sm border rounded p-1.5 bg-background" value={filters.tipo || ''} onChange={(e) => onFilterChange({...filters, tipo: e.target.value})}>
                        <option value="">Todos</option>
                        <option value="GASTO">Gasto</option>
                        <option value="INGRESO">Ingreso</option>
                        <option value="INVERSION">Inversión</option>
                        <option value="DEVOLUCION">Devolución</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-medium">Estado</label>
                     <select className="w-full text-sm border rounded p-1.5 bg-background" value={filters.estado || ''} onChange={(e) => onFilterChange({...filters, estado: e.target.value})}>
                        <option value="">Todos</option>
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="CONFIRMADO">Confirmado</option>
                     </select>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => onFilterChange({})}>
                    Limpiar Filtros
                  </Button>
               </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Columns className="w-4 h-4" /> Columnas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Columnas Visibles</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.keys(visibleColumns).map((col) => {
                 if(col === 'acciones') return null;
                 return (
                    <DropdownMenuCheckboxItem key={col} checked={visibleColumns[col]} onCheckedChange={(checked) => setVisibleColumns(prev => ({...prev, [col]: checked}))} className="capitalize">
                      {col}
                    </DropdownMenuCheckboxItem>
                 );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={onNew} size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white ml-auto sm:ml-0">
             <Plus className="w-4 h-4" />
             <span className="hidden sm:inline">Nuevo</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-gray-50 dark:bg-slate-950 border-b border-gray-200 dark:border-gray-800 text-gray-500">
                  <tr>
                     {/* NEW: Select All Checkbox */}
                     {selectable && (
                        <th className="px-3 py-4 w-10">
                           <input
                              type="checkbox"
                              checked={allSelected}
                              ref={(el) => { if (el) el.indeterminate = someSelected; }}
                              onChange={handleSelectAll}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                           />
                        </th>
                     )}
                     {visibleColumns.fecha && (
                        <th className="px-6 py-4 font-semibold cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => handleSort('fecha')}>
                           <span className="flex items-center">Fecha <SortIcon field="fecha" /></span>
                        </th>
                     )}
                     {visibleColumns.descripcion && (
                        <th className="px-6 py-4 font-semibold cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => handleSort('descripcion')}>
                           <span className="flex items-center">Descripción <SortIcon field="descripcion" /></span>
                        </th>
                     )}
                     {visibleColumns.tipo && (
                        <th className="px-6 py-4 font-semibold cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => handleSort('tipo')}>
                           <span className="flex items-center">Tipo <SortIcon field="tipo" /></span>
                        </th>
                     )}
                     {visibleColumns.monto && (
                        <th className="px-6 py-4 font-semibold text-right cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => handleSort('monto')}>
                           <span className="flex items-center justify-end">Monto <SortIcon field="monto" /></span>
                        </th>
                     )}
                     {visibleColumns.estado && (
                        <th className="px-6 py-4 font-semibold text-center w-32 cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => handleSort('estado')}>
                           <span className="flex items-center justify-center">Estado <SortIcon field="estado" /></span>
                        </th>
                     )}
                     {visibleColumns.cuenta && (
                        <th className="px-6 py-4 font-semibold cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => handleSort('cuenta')}>
                           <span className="flex items-center">Cuenta <SortIcon field="cuenta" /></span>
                        </th>
                     )}
                     {visibleColumns.acciones && <th className="px-6 py-4 font-semibold text-right">Acciones</th>}
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {loading ? (
                     <tr>
                        <td colSpan={colSpanCount} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-2 text-gray-500">
                            <Loader2 className="w-6 h-6 animate-spin" /> Cargando movimientos...
                          </div>
                        </td>
                     </tr>
                  ) : sortedMovimientos.length === 0 ? (
                     <tr>
                        <td colSpan={colSpanCount} className="px-6 py-12 text-center text-gray-500">No se encontraron movimientos</td>
                     </tr>
                  ) : (
                     sortedMovimientos.map((mov) => {
                        const isConfirmado = mov.estado === 'CONFIRMADO';
                        const isUpdating = updatingId === mov.id;
                        const isSelected = selectedIds.includes(mov.id);

                        return (
                          <tr key={mov.id} className={cn(
                            "hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group",
                            isUpdating && "opacity-70 pointer-events-none",
                            isSelected && "bg-blue-50/50 dark:bg-blue-950/10"
                          )}>
                             {/* NEW: Row Checkbox */}
                             {selectable && (
                                <td className="px-3 py-4">
                                   <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleSelectOne(mov.id)}
                                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                   />
                                </td>
                             )}
                             {visibleColumns.fecha && (
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-mono text-xs">
                                   {formatSafeDate(mov.fecha)}
                                </td>
                             )}
                             {visibleColumns.descripcion && (
                                <td className="px-6 py-4">
                                   <div className="font-medium text-gray-900 dark:text-white truncate max-w-[250px]" title={mov.descripcion}>
                                      {mov.descripcion}
                                   </div>
                                   <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                      {mov.providers?.name || mov.inversionistas?.nombre || mov.clients?.name || 'Sin entidad'}
                                   </div>
                                </td>
                             )}
                             {visibleColumns.tipo && (
                                <td className="px-6 py-4">
                                   <Badge variant="outline" className={cn(
                                      "font-normal text-[10px]",
                                      (mov.tipo === 'GASTO' || mov.tipo === 'DEVOLUCION') 
                                        ? "border-red-200 text-red-700 bg-red-50 dark:bg-red-900/10" 
                                        : "border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/10"
                                   )}>
                                      {mov.tipo}
                                   </Badge>
                                </td>
                             )}
                             {visibleColumns.monto && (
                                <td className="px-6 py-4 text-right font-mono font-medium text-gray-700 dark:text-gray-200">
                                   {formatCurrencyARS(mov.monto_ars || mov.amount)}
                                </td>
                             )}
                             {visibleColumns.estado && (
                                <td className="px-6 py-4">
                                   <div className="flex items-center justify-center gap-3">
                                      <button
                                         onClick={() => handleQuickStatusToggle(mov)}
                                         className="focus:outline-none hover:scale-110 transition-transform relative cursor-pointer"
                                         title={isConfirmado ? "Marcar como pendiente" : "Confirmar movimiento"}
                                      >
                                         {isConfirmado ? (
                                           <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                         ) : (
                                           <Circle className="w-5 h-5 text-slate-300 hover:text-blue-500" />
                                         )}
                                      </button>
                                      <span className={cn(
                                         "text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors duration-300",
                                         isConfirmado 
                                           ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400" 
                                           : "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400"
                                      )}>
                                         {mov.estado}
                                      </span>
                                   </div>
                                </td>
                             )}
                             {visibleColumns.cuenta && (
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-xs">
                                   {mov.cuentas?.titulo || '—'}
                                </td>
                             )}
                             {visibleColumns.acciones && (
                                <td className="px-6 py-4 text-right">
                                   <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                         <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreVertical className="w-4 h-4" />
                                         </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                         <DropdownMenuItem onClick={() => onView(mov)}>
                                            <Eye className="w-4 h-4 mr-2" /> Ver detalles
                                         </DropdownMenuItem>
                                         <DropdownMenuItem onClick={() => onEdit(mov)}>
                                            <Edit className="w-4 h-4 mr-2" /> Editar
                                         </DropdownMenuItem>
                                         <DropdownMenuItem onClick={() => handleQuickStatusToggle(mov)}>
                                            <CheckCircle2 className="w-4 h-4 mr-2" /> 
                                            {isConfirmado ? 'Desmarcar' : 'Confirmar'}
                                         </DropdownMenuItem>
                                         <DropdownMenuItem onClick={() => onDuplicate(mov)}>
                                            <Copy className="w-4 h-4 mr-2" /> Duplicar
                                         </DropdownMenuItem>
                                         <DropdownMenuSeparator />
                                         <DropdownMenuItem onClick={() => onDelete(mov)} className="text-red-600 focus:text-red-600">
                                            <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                                         </DropdownMenuItem>
                                      </DropdownMenuContent>
                                   </DropdownMenu>
                                </td>
                             )}
                          </tr>
                        );
                     })
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default MovimientosTesoreriaTable;
