
import React, { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/customSupabaseClient';

function ExpenseFilterPopover({ filters, onFiltersChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [catalogs, setCatalogs] = useState({
    projects: [],
    types: [],
    statuses: [],
    providers: []
  });

  useEffect(() => {
    const fetchData = async () => {
      const [projects, types, statuses, providers] = await Promise.all([
        supabase.from('projects').select('id, name'),
        supabase.from('catalog_expense_type').select('id, name'),
        supabase.from('catalog_payment_status').select('id, name'),
        supabase.from('providers').select('id, name')
      ]);
      setCatalogs({
        projects: projects.data || [],
        types: types.data || [],
        statuses: statuses.data || [],
        providers: providers.data || []
      });
    };
    if (isOpen) fetchData();
  }, [isOpen]);

  const handleFilterChange = (category, value) => {
    const current = filters[category] || [];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [category]: updated });
  };

  const clearFilters = () => {
    onFiltersChange({
      project_id: [],
      expense_type_id: [],
      payment_status_id: [],
      currency: [],
      provider_id: [],
      month: ''
    });
  };

  const activeCount = 
    filters.project_id.length + 
    filters.expense_type_id.length + 
    filters.payment_status_id.length + 
    filters.currency.length +
    filters.provider_id.length + 
    (filters.month ? 1 : 0);

  return (
    <div className="relative">
      <Button variant="outline" onClick={() => setIsOpen(!isOpen)} className="relative">
        <Filter className="w-4 h-4 mr-2" />
        Filters
        {activeCount > 0 && (
          <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 p-4 z-50 max-h-[80vh] overflow-y-auto"
            >
              <div className="space-y-4">
                 <div>
                  <h4 className="font-semibold mb-2 text-sm">Month</h4>
                  <input
                    type="month"
                    value={filters.month}
                    onChange={(e) => onFiltersChange({ ...filters, month: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2 text-sm">Currency</h4>
                  {['ARS', 'USD'].map(c => (
                    <div key={c} className="flex items-center space-x-2 mb-1">
                      <Checkbox checked={filters.currency.includes(c)} onCheckedChange={() => handleFilterChange('currency', c)} />
                      <Label className="text-sm font-normal">{c}</Label>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2 text-sm">Types</h4>
                  {catalogs.types.map(t => (
                    <div key={t.id} className="flex items-center space-x-2 mb-1">
                      <Checkbox checked={filters.expense_type_id.includes(t.id)} onCheckedChange={() => handleFilterChange('expense_type_id', t.id)} />
                      <Label className="text-sm font-normal">{t.name}</Label>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2 text-sm">Status</h4>
                  {catalogs.statuses.map(s => (
                    <div key={s.id} className="flex items-center space-x-2 mb-1">
                      <Checkbox checked={filters.payment_status_id.includes(s.id)} onCheckedChange={() => handleFilterChange('payment_status_id', s.id)} />
                      <Label className="text-sm font-normal">{s.name}</Label>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                   <h4 className="font-semibold mb-2 text-sm">Projects</h4>
                   <div className="max-h-32 overflow-y-auto">
                    {catalogs.projects.map(p => (
                      <div key={p.id} className="flex items-center space-x-2 mb-1">
                        <Checkbox checked={filters.project_id.includes(p.id)} onCheckedChange={() => handleFilterChange('project_id', p.id)} />
                        <Label className="text-sm font-normal truncate">{p.name}</Label>
                      </div>
                    ))}
                   </div>
                </div>

                {activeCount > 0 && (
                  <div className="border-t pt-4">
                    <Button variant="outline" onClick={clearFilters} className="w-full">
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ExpenseFilterPopover;
