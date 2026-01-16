
import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { tokens } from '@/lib/designTokens';
import { useTheme } from '@/contexts/ThemeProvider';
import 'react-day-picker/dist/style.css';

const DatePickerField = ({ 
  value, 
  onChange, 
  placeholder, 
  label, 
  disabled, 
  minDate, 
  maxDate,
  className 
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const { t } = useTheme();

  const handleSelect = (date) => {
    onChange(date);
    setIsPopoverOpen(false);
  };

  const displayValue = value ? format(value, "P", { locale: es }) : (placeholder || t('placeholder.select_date'));

  // Custom CSS for DayPicker (matching theme)
  const css = `
    .rdp {
      --rdp-cell-size: 40px;
      --rdp-accent-color: var(--theme-primary);
      --rdp-background-color: var(--theme-secondary);
      margin: 0;
    }
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
    <div className={cn("space-y-2", className)}>
      <style>{css}</style>
      {label && <Label>{label}</Label>}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-11",
              !value && "text-muted-foreground"
            )}
            style={{ 
                borderRadius: tokens.radius.input,
                borderColor: 'var(--theme-border)'
            }}
          >
            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
            {displayValue}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-xl rounded-xl" align="start">
          <div className="p-3">
            <DayPicker
              mode="single"
              selected={value}
              onSelect={handleSelect}
              locale={es}
              showOutsideDays
              fromDate={minDate}
              toDate={maxDate}
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-slate-500 rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
                day_selected: "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-700 focus:text-white",
                day_today: "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white",
                day_outside: "text-slate-400 opacity-50",
                day_disabled: "text-slate-400 opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DatePickerField;
