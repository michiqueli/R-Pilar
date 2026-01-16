
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/customSupabaseClient';
import { useTheme } from '@/contexts/ThemeProvider';

const MovimientosFilterPanel = ({ isOpen, onClose, filters, onFiltersChange }) => {
  const { t } = useTheme();
  const [catalogs, setCatalogs] = useState({
    projects: [],
    categories: [],
    statuses: [],
    responsables: []
  });

  useEffect(() => {
    if (isOpen) {
      fetchCatalogs();
    }
  }, [isOpen]);

  const fetchCatalogs = async () => {
    const [projects, categories, statuses, providers, accounts] = await Promise.all([
      supabase.from('projects').select('id, name').eq('is_deleted', false),
      supabase.from('catalog_expense_type').select('id, name').eq('is_active', true),
      supabase.from('catalog_payment_status').select('id, name').eq('is_active', true),
      supabase.from('providers').select('id, name').eq('is_deleted', false),
      supabase.from('accounts').select('id, name').eq('is_deleted', false)
    ]);

    setCatalogs({
      projects: projects.data || [],
      categories: categories.data || [],
      statuses: statuses.data || [],
      responsables: [...(providers.data || []), ...(accounts.data || [])]
    });
  };

  const handleFilterChange = (category, value) => {
    const current = filters[category] || [];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [category]: updated });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: [],
      dateFrom: '',
      dateTo: '',
      project: [],
      category: [],
      responsible: []
    });
  };

  const activeCount = 
    (filters.status?.length || 0) +
    (filters.project?.length || 0) +
    (filters.category?.length || 0) +
    (filters.responsible?.length || 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t('common.filters')}
                </h2>
                {activeCount > 0 && (
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded-full">
                    {activeCount}
                  </span>
                )}
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              
              {/* Date Range */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('movimientos.date_range')}</Label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-sm"
                    placeholder={t('movimientos.from')}
                  />
                  <input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-sm"
                    placeholder={t('movimientos.to')}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('common.status')}</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {catalogs.statuses.map(s => (
                    <div key={s.id} className="flex items-center space-x-2">
                      <Checkbox 
                        checked={filters.status?.includes(s.id)} 
                        onCheckedChange={() => handleFilterChange('status', s.id)} 
                      />
                      <Label className="text-sm font-normal cursor-pointer">{s.name}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projects */}
              <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('projects.title')}</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {catalogs.projects.map(p => (
                    <div key={p.id} className="flex items-center space-x-2">
                      <Checkbox 
                        checked={filters.project?.includes(p.id)} 
                        onCheckedChange={() => handleFilterChange('project', p.id)} 
                      />
                      <Label className="text-sm font-normal cursor-pointer truncate">{p.name}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('movimientos.categoria')}</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {catalogs.categories.map(c => (
                    <div key={c.id} className="flex items-center space-x-2">
                      <Checkbox 
                        checked={filters.category?.includes(c.id)} 
                        onCheckedChange={() => handleFilterChange('category', c.id)} 
                      />
                      <Label className="text-sm font-normal cursor-pointer">{c.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            {activeCount > 0 && (
              <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-6">
                <Button 
                  variant="outline" 
                  onClick={clearFilters} 
                  className="w-full rounded-full"
                >
                  {t('movimientos.clear_filters')}
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MovimientosFilterPanel;
