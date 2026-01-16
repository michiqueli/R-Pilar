
import React from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useTheme } from '@/contexts/ThemeProvider'; // Import useTheme for translations

const Toolbar = ({ 
  searchTerm, 
  onSearchChange, 
  viewMode, 
  onViewModeChange, 
  onNewProjectClick, 
  filterContent 
}) => {
  const { t } = useTheme(); // Use the t function for translations

  return (
    <div className="flex flex-col md:flex-row gap-6 mb-8 items-center justify-between">
      {/* Search - Left aligned */}
      <div className="w-full md:w-80">
        <Input
          placeholder={t('common.searchPlaceholder') || "Buscar..."} // Apply translation
          icon={Search}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-white shadow-sm border-slate-200"
        />
      </div>

      {/* Actions - Right aligned */}
      <div className="flex items-center gap-4 w-full md:w-auto">
        {filterContent}
        
        <div className="hidden md:block w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2"></div>

        <SegmentedControl
          options={[
            { label: t('common.cards') || 'Tarjetas', value: 'grid' }, // Apply translation
            { label: t('common.table') || 'Tabla', value: 'table' },   // Apply translation
          ]}
          value={viewMode}
          onChange={onViewModeChange}
        />

        <Button 
          variant="primary" 
          onClick={onNewProjectClick}
          className="shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('projects.new') || "Nuevo Proyecto"} {/* Apply translation */}
        </Button>
      </div>
    </div>
  );
};

export default Toolbar;
