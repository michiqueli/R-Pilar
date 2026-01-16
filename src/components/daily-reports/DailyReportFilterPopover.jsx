
import React, { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/customSupabaseClient';

function DailyReportFilterPopover({ filters, onFiltersChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase.from('projects').select('id, name');
      setProjects(data || []);
    };
    if (isOpen) fetchProjects();
  }, [isOpen]);

  const handleProjectChange = (id) => {
    const current = filters.project_id || [];
    const updated = current.includes(id)
      ? current.filter(item => item !== id)
      : [...current, id];
    onFiltersChange({ ...filters, project_id: updated });
  };

  const clearFilters = () => {
    onFiltersChange({
      project_id: [],
      date_from: '',
      date_to: ''
    });
  };

  const activeCount = 
    (filters.project_id?.length || 0) + 
    (filters.date_from ? 1 : 0) + 
    (filters.date_to ? 1 : 0);

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
                 <div className="grid grid-cols-2 gap-2">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">From</h4>
                    <input
                      type="date"
                      value={filters.date_from}
                      onChange={(e) => onFiltersChange({ ...filters, date_from: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">To</h4>
                    <input
                      type="date"
                      value={filters.date_to}
                      onChange={(e) => onFiltersChange({ ...filters, date_to: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                   <h4 className="font-semibold mb-2 text-sm">Projects</h4>
                   <div className="max-h-48 overflow-y-auto space-y-1">
                    {projects.map(p => (
                      <div key={p.id} className="flex items-center space-x-2">
                        <Checkbox checked={filters.project_id.includes(p.id)} onCheckedChange={() => handleProjectChange(p.id)} />
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

export default DailyReportFilterPopover;
