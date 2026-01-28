
import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { tokens } from '@/lib/designTokens';

const DatePickerInput = ({ date, onSelect, placeholder = "Seleccionar fecha", className }) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Custom CSS for DayPicker to match theme
  const css = `
    .rdp { --rdp-cell-size: 40px; margin: 0; }

    .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
      background-color: var(--theme-secondary);
      color: var(--theme-foreground);
    }
    .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover {
      background-color: var(--theme-primary);
      color: var(--theme-primary-foreground);
    }
    .rdp-day_today {
      font-weight: bold;
      color: var(--theme-primary);
    }
  `;

  return (
    <>
      <style>{css}</style>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800",
              !date && "text-muted-foreground",
              className
            )}
            style={{ 
                borderRadius: tokens.radius.input, 
                height: '44px',
            }}
          >
            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
            {date ? (
              format(date, "P", { locale: es })
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        
        {/* AGREGAMOS EL PORTAL PARA QUE SALGA DEL FLUJO DEL MODAL */}
        <PopoverContent 
          className="p-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl z-[100]" 
          align="start"
          sideOffset={4}
          /* Esta línea es vital si usas Radix/Shadcn puro */
          onFocusOutside={(e) => e.preventDefault()} 
        >
          <div className="p-3">
            <DayPicker
              mode="single"
              selected={date}
              onSelect={(d) => {
                onSelect(d);
                setIsPopoverOpen(false);
              }}
              locale={es}
              showOutsideDays
              classNames={{
                // ... tus classNames se mantienen igual
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
};

export default DatePickerInput;
