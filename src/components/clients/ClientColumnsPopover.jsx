
import React from 'react';
import { Columns } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

const ClientColumnsPopover = ({ columns, onColumnsChange }) => {
  const handleToggle = (columnId) => {
    const newColumns = { ...columns, [columnId]: !columns[columnId] };
    onColumnsChange(newColumns);
    localStorage.setItem('client_columns_pref', JSON.stringify(newColumns));
  };

  const columnLabels = {
    name: 'Nombre / Razón Social',
    contact: 'Contacto',
    phone: 'Teléfono',
    email: 'Email',
    projects: 'Proyectos',
    status: 'Estado'
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" className="rounded-full gap-2 px-4 shadow-sm">
          <Columns className="w-4 h-4" />
          Columnas
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-4 rounded-2xl shadow-xl border-slate-100" align="end">
        <h4 className="font-semibold text-slate-900 mb-3 text-sm">Mostrar Columnas</h4>
        <div className="space-y-2">
          {Object.entries(columns).map(([key, isVisible]) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox 
                id={`col-${key}`} 
                checked={isVisible}
                onCheckedChange={() => handleToggle(key)}
              />
              <label 
                htmlFor={`col-${key}`} 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {columnLabels[key]}
              </label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ClientColumnsPopover;
