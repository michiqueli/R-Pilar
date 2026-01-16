
import React, { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/customSupabaseClient';

function ProviderFilterPopover({ filters, onFiltersChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [types, setTypes] = useState([]);

  useEffect(() => {
    const fetchTypes = async () => {
      const { data } = await supabase.from('catalog_provider_type').select('*');
      setTypes(data || []);
    };
    fetchTypes();
  }, []);

  const handleTypeChange = (typeId) => {
    const newTypes = filters.type_id.includes(typeId)
      ? filters.type_id.filter(id => id !== typeId)
      : [...filters.type_id, typeId];
    onFiltersChange({ ...filters, type_id: newTypes });
  };

  const handleStatusChange = (status) => {
    // If clicking same status, clear it (toggle off), else set it
    const newStatus = filters.is_active === status ? null : status;
    onFiltersChange({ ...filters, is_active: newStatus });
  };

  const clearFilters = () => {
    onFiltersChange({ type_id: [], is_active: null });
  };

  const activeFiltersCount = filters.type_id.length + (filters.is_active !== null ? 1 : 0);

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Filter className="w-4 h-4 mr-2" />
        Filters
        {activeFiltersCount > 0 && (
          <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {activeFiltersCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-slate-200 p-4 z-50"
            >
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 text-sm text-slate-900">Type</h4>
                  <div className="space-y-2">
                    {types.map(type => (
                      <div key={type.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type.id}`}
                          checked={filters.type_id.includes(type.id)}
                          onCheckedChange={() => handleTypeChange(type.id)}
                        />
                        <Label htmlFor={`type-${type.id}`} className="text-sm font-normal cursor-pointer">
                          {type.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2 text-sm text-slate-900">Status</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status-active"
                        checked={filters.is_active === true}
                        onCheckedChange={() => handleStatusChange(true)}
                      />
                      <Label htmlFor="status-active" className="text-sm font-normal cursor-pointer">Active</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status-inactive"
                        checked={filters.is_active === false}
                        onCheckedChange={() => handleStatusChange(false)}
                      />
                      <Label htmlFor="status-inactive" className="text-sm font-normal cursor-pointer">Inactive</Label>
                    </div>
                  </div>
                </div>

                {activeFiltersCount > 0 && (
                  <div className="border-t pt-4">
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="w-full"
                    >
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

export default ProviderFilterPopover;
