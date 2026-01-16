
import React from 'react';
import { useTheme } from '@/contexts/ThemeProvider';
import { MoreVertical, Search, Filter, Columns, Plus, Eye, Edit, Trash2, Copy, FileText } from 'lucide-react';
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

const MovimientosTesoreriaTable = ({
  movimientos,
  loading,
  onSearch,
  onFilterChange,
  filters,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onNew
}) => {
  const { t } = useTheme();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [visibleColumns, setVisibleColumns] = React.useState({
    fecha: true,
    descripcion: true,
    tipo: true,
    monto: true,
    estado: true,
    cuenta: true,
    acciones: true
  });

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch(term);
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
          {/* Filters */}
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
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => onFilterChange({})}
                  >
                    Limpiar Filtros
                  </Button>
               </div>
            </PopoverContent>
          </Popover>

          {/* Columns */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Columns className="w-4 h-4" />
                <span className="hidden sm:inline">Columnas</span>
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
                     {visibleColumns.fecha && <th className="px-6 py-4 font-semibold whitespace-nowrap">Fecha</th>}
                     {visibleColumns.descripcion && <th className="px-6 py-4 font-semibold whitespace-nowrap">Descripción</th>}
                     {visibleColumns.tipo && <th className="px-6 py-4 font-semibold whitespace-nowrap">Tipo</th>}
                     {visibleColumns.monto && <th className="px-6 py-4 font-semibold whitespace-nowrap text-right">Monto</th>}
                     {visibleColumns.estado && <th className="px-6 py-4 font-semibold whitespace-nowrap text-center">Estado</th>}
                     {visibleColumns.cuenta && <th className="px-6 py-4 font-semibold whitespace-nowrap">Cuenta</th>}
                     {visibleColumns.acciones && <th className="px-6 py-4 font-semibold whitespace-nowrap text-right">Acciones</th>}
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {loading ? (
                     <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Cargando movimientos...</td>
                     </tr>
                  ) : movimientos.length === 0 ? (
                     <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No se encontraron movimientos</td>
                     </tr>
                  ) : (
                     movimientos.map((mov) => (
                        <tr key={mov.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                           {visibleColumns.fecha && (
                              <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                 {formatDate(mov.fecha)}
                              </td>
                           )}
                           {visibleColumns.descripcion && (
                              <td className="px-6 py-4">
                                 <div className="font-medium text-gray-900 dark:text-white max-w-[200px] sm:max-w-[300px] truncate" title={mov.descripcion}>
                                    {mov.descripcion}
                                 </div>
                                 <div className="text-xs text-gray-500 flex items-center gap-1">
                                    {mov.providers?.name || mov.inversionistas?.nombre || 'Sin entidad'}
                                 </div>
                              </td>
                           )}
                           {visibleColumns.tipo && (
                              <td className="px-6 py-4">
                                 <Badge variant="outline" className={cn(
                                    "font-normal",
                                    (mov.tipo === 'GASTO' || mov.tipo === 'DEVOLUCION') ? "border-red-200 text-red-700 bg-red-50 dark:bg-red-900/10 dark:text-red-400" : "border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/10 dark:text-emerald-400"
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
                              <td className="px-6 py-4 text-center">
                                 <span className={cn(
                                    "inline-flex w-2.5 h-2.5 rounded-full",
                                    mov.estado === 'CONFIRMADO' ? "bg-blue-500" : "bg-amber-400"
                                 )} title={mov.estado}></span>
                                 <span className="sr-only">{mov.estado}</span>
                              </td>
                           )}
                           {visibleColumns.cuenta && (
                              <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                                 {mov.cuentas?.titulo || '—'}
                              </td>
                           )}
                           {visibleColumns.acciones && (
                              <td className="px-6 py-4 text-right">
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                       <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600">
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
                     ))
                  )}
               </tbody>
            </table>
         </div>
         
         {/* Mobile Card View (Visible only on small screens) */}
         <div className="sm:hidden divide-y divide-gray-100 dark:divide-slate-800">
             {/* This part would be implemented with media queries to show/hide table/cards. 
                 For simplicity, I relied on the responsive table scrolling above, but here is a placeholder logic 
                 if strict card view is required. Tailwind 'hidden sm:block' on table and 'block sm:hidden' here.
             */}
         </div>
      </div>
    </div>
  );
};

export default MovimientosTesoreriaTable;
