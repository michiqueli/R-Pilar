import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient'; 
import { useTheme } from '@/contexts/ThemeProvider';
import { 
  MoreVertical, Search, Filter, Columns, Plus, 
  Eye, Edit, Trash2, Copy, CheckCircle2, Circle, Loader2 
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
  movimientos = [], // Valor por defecto para evitar errores
  loading,
  onSearch,
  onFilterChange,
  filters,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onNew,
  onRefresh
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  
  // 1. ESTADO LOCAL PARA REFLEJO INSTANTÁNEO
  const [localMovimientos, setLocalMovimientos] = useState([]);

  const [visibleColumns, setVisibleColumns] = useState({
    fecha: true,
    descripcion: true,
    tipo: true,
    monto: true,
    estado: true,
    cuenta: true,
    acciones: true
  });

  // 2. SINCRONIZAR PROPS CON ESTADO LOCAL
  // Cada vez que el padre nos manda datos nuevos (al cargar o al refrescar), actualizamos la copia local.
  useEffect(() => {
    setLocalMovimientos(movimientos);
  }, [movimientos]);

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

  // 3. TOGGLE CON ACTUALIZACIÓN OPTIMISTA
  const handleQuickStatusToggle = async (mov) => {
    if (updatingId) return;
    
    // Guardamos el estado anterior por si falla la BDD
    const estadoAnterior = mov.estado;
    const nuevoEstado = mov.estado === 'CONFIRMADO' ? 'PENDIENTE' : 'CONFIRMADO';
    
    setUpdatingId(mov.id);

    // A) ACTUALIZACIÓN VISUAL INSTANTÁNEA (Optimistic UI)
    setLocalMovimientos(prev => prev.map(m => 
        m.id === mov.id ? { ...m, estado: nuevoEstado } : m
    ));
    
    try {
      // B) ACTUALIZACIÓN EN BASE DE DATOS
      const { error } = await supabase
        .from('inversiones')
        .update({ estado: nuevoEstado })
        .eq('id', mov.id);

      if (error) throw error;
      
      toast({
        title: nuevoEstado === 'CONFIRMADO' ? "Movimiento Confirmado" : "Movimiento Pendiente",
        description: `Se ha actualizado el estado de "${mov.descripcion}"`,
        className: nuevoEstado === 'CONFIRMADO' ? "bg-green-50 border-green-200" : ""
      });

      // C) AVISAR AL PADRE (Para que recalcule KPIs, totales, etc.)
      if (onRefresh) onRefresh(); 

    } catch (error) {
      console.error(error);
      // D) SI FALLA, REVERTIMOS EL CAMBIO VISUAL
      setLocalMovimientos(prev => prev.map(m => 
        m.id === mov.id ? { ...m, estado: estadoAnterior } : m
      ));
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cambiar el estado."
      });
    } finally {
      setUpdatingId(null);
    }
  };

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
          {/* Filtros Popover */}
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
                     <select 
                        className="w-full text-sm border rounded p-1.5 bg-background"
                        value={filters.tipo || ''}
                        onChange={(e) => onFilterChange({...filters, tipo: e.target.value})}
                     >
                        <option value="">Todos</option>
                        <option value="GASTO">Gasto</option>
                        <option value="INGRESO">Ingreso</option>
                        <option value="INVERSION">Inversión</option>
                        <option value="DEVOLUCION">Devolución</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-medium">Estado</label>
                     <select 
                        className="w-full text-sm border rounded p-1.5 bg-background"
                        value={filters.estado || ''}
                        onChange={(e) => onFilterChange({...filters, estado: e.target.value})}
                     >
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

          {/* Columnas Dropdown */}
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
                    <DropdownMenuCheckboxItem
                      key={col}
                      checked={visibleColumns[col]}
                      onCheckedChange={(checked) => setVisibleColumns(prev => ({...prev, [col]: checked}))}
                      className="capitalize"
                    >
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
                     {visibleColumns.fecha && <th className="px-6 py-4 font-semibold">Fecha</th>}
                     {visibleColumns.descripcion && <th className="px-6 py-4 font-semibold">Descripción</th>}
                     {visibleColumns.tipo && <th className="px-6 py-4 font-semibold">Tipo</th>}
                     {visibleColumns.monto && <th className="px-6 py-4 font-semibold text-right">Monto</th>}
                     {visibleColumns.estado && <th className="px-6 py-4 font-semibold text-center w-32">Estado</th>}
                     {visibleColumns.cuenta && <th className="px-6 py-4 font-semibold">Cuenta</th>}
                     {visibleColumns.acciones && <th className="px-6 py-4 font-semibold text-right">Acciones</th>}
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {loading ? (
                     <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-2 text-gray-500">
                            <Loader2 className="w-6 h-6 animate-spin" /> Cargando movimientos...
                          </div>
                        </td>
                     </tr>
                  ) : localMovimientos.length === 0 ? ( // 4. USAR localMovimientos AQUÍ
                     <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No se encontraron movimientos</td>
                     </tr>
                  ) : (
                     localMovimientos.map((mov) => { // 5. MAPEAR SOBRE localMovimientos
                        const isConfirmado = mov.estado === 'CONFIRMADO';
                        const isUpdating = updatingId === mov.id;

                        return (
                          <tr key={mov.id} className={cn(
                            "hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group",
                            isUpdating && "opacity-70 pointer-events-none" // Opacidad suave mientras actualiza
                          )}>
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
                             
                             {/* CELDA DE ESTADO INTERACTIVA */}
                             {visibleColumns.estado && (
                                <td className="px-6 py-4">
                                   <div className="flex items-center justify-center gap-3">
                                      <button
                                         onClick={() => handleQuickStatusToggle(mov)}
                                         // Eliminamos el disabled=isUpdating para que la UI optimista se sienta instantánea
                                         // El estado "updating" solo se usa para prevenir doble click en la lógica
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