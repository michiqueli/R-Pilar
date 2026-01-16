
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import CatalogModal from './CatalogModal';

function CatalogManager({ tableName, title, description }) {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter state
  const [showInactive, setShowInactive] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from(tableName)
        .select('*')
        .eq('is_deleted', false)
        .order('name');

      if (!showInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching catalog items:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [tableName, showInactive]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from(tableName)
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: 'Success', description: 'Item deleted successfully' });
      fetchItems();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
    }
  };

  const handleToggleActive = async (e, item) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from(tableName)
        .update({ is_active: !item.is_active })
        .eq('id', item.id);

      if (error) throw error;
      
      toast({ 
        title: 'Success', 
        description: `Item ${!item.is_active ? 'activated' : 'deactivated'} successfully` 
      });
      fetchItems();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
    }
  };

  const handleEdit = (e, item) => {
    e.stopPropagation();
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <Button onClick={() => { setSelectedItem(null); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add New
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="relative">
          <Button 
            variant="outline" 
            onClick={() => setIsFilterOpen(!isFilterOpen)} 
            className={showInactive ? 'bg-slate-100 border-slate-300' : ''}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          
          <AnimatePresence>
            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 p-4 z-20"
                >
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="show-inactive" 
                      checked={showInactive} 
                      onCheckedChange={(checked) => setShowInactive(checked)}
                    />
                    <Label htmlFor="show-inactive" className="text-sm font-normal cursor-pointer">
                      Show Inactive Items
                    </Label>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-full">Name</th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Status</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="3" className="py-8 text-center text-slate-500">Loading...</td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan="3" className="py-8 text-center text-slate-500">No items found</td>
              </tr>
            ) : (
              filteredItems.map((item, index) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="hover:bg-slate-50 group"
                >
                  <td className="py-3 px-4 text-sm font-medium text-slate-900">
                    {item.name}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                       <Switch 
                         checked={item.is_active} 
                         onCheckedChange={(checked) => handleToggleActive({ stopPropagation: () => {} }, item)}
                       />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => handleEdit(e, item)}>
                        <Edit className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => handleDelete(e, item.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CatalogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchItems}
        item={selectedItem}
        tableName={tableName}
        title={title}
      />
    </div>
  );
}

export default CatalogManager;
