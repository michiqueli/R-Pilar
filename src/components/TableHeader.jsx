
import React from 'react';
import { Search, Filter, Columns as ColumnsIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeProvider';

const TableHeader = ({
  searchTerm,
  onSearchChange,
  onFilterClick,
  columns = [],
  onColumnsChange,
  visibleColumns = {},
  rightActions,
  activeFiltersCount = 0
}) => {
  const { t } = useTheme();

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-2 w-full md:w-auto flex-1">
        <div className="relative flex-1 md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={onFilterClick}
          className={cn(
            "relative shrink-0",
            activeFiltersCount > 0 && "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400"
          )}
          title="Filtros"
        >
          <Filter className="h-4 w-4" />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0" title="Columnas">
              <ColumnsIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Columnas Visibles</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns.map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={visibleColumns[column.id] !== false}
                onCheckedChange={(checked) => onColumnsChange(column.id, checked)}
                disabled={column.locked}
              >
                {column.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
        {rightActions}
      </div>
    </div>
  );
};

export default TableHeader;
