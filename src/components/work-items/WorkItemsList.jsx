
import React, { useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Plus, GripVertical, Edit, Trash2, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/contexts/ThemeProvider';
import { useToast } from '@/components/ui/use-toast';
import { workItemService } from '@/services/workItemService';
import WorkItemForm from './WorkItemForm';
import WorkItemCosts from './WorkItemCosts';

const WorkItemsList = ({ projectId, expenses, onUpdate, currency }) => {
  const { t } = useTheme();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    if (projectId) {
      fetchItems();
    }
  }, [projectId]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await workItemService.getWorkItems(projectId);
      setItems(data || []);
      if(onUpdate) onUpdate(); 
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load work items' });
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (newOrder) => {
    setItems(newOrder);
    try {
      const updates = newOrder.map((item, index) => ({ id: item.id, order: index + 1 }));
      await workItemService.updateOrder(updates);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Error al reordenar.' });
      fetchItems(); // Revert on error
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('messages.confirm_delete'))) return;
    try {
      await workItemService.deleteWorkItem(id);
      toast({ title: t('common.success'), description: 'Partida eliminada.' });
      fetchItems();
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: error.message });
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleProgressChange = async (item, newProgress) => {
    const updatedItems = items.map(i => i.id === item.id ? { ...i, progress: parseFloat(newProgress) } : i);
    setItems(updatedItems);
    
    try {
      await workItemService.updateWorkItem(item.id, { progress: parseFloat(newProgress) });
      if(onUpdate) onUpdate(); 
    } catch (error) {
       console.error(error);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Cargando plan de obra...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Partidas / Plan de Obra</h3>
        <Button onClick={handleCreate} variant="secondary" size="sm" className="rounded-full">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Partida
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl">
          <p className="text-slate-500 mb-2">No hay partidas definidas.</p>
          <Button onClick={handleCreate} variant="primary" className="rounded-full">
            Comenzar Plan de Obra
          </Button>
        </div>
      ) : (
        <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-3">
          {items.map((item) => (
            <Reorder.Item key={item.id} value={item}>
              <Card className="p-4 flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                
                <div className="flex items-center gap-3 flex-1 w-full md:w-auto">
                   <div className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-500">
                      <GripVertical className="w-5 h-5" />
                   </div>
                   <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{item.name}</h4>
                      {item.description && <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>}
                   </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
                   <div className="flex flex-col items-center w-24">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Peso</span>
                      <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{item.weight}</span>
                   </div>
                   <div className="flex flex-col items-center w-32">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Avance %</span>
                      <div className="flex items-center gap-2">
                        <input 
                           type="number" 
                           min="0" 
                           max="100" 
                           className="w-16 text-center text-sm border rounded-lg py-1 px-1 focus:ring-2 focus:ring-blue-500 outline-none"
                           value={item.progress}
                           onChange={(e) => handleProgressChange(item, e.target.value)}
                        />
                      </div>
                   </div>
                </div>

                <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl">
                   <WorkItemCosts workItem={item} expenses={expenses} />
                </div>

                <div className="flex items-center gap-2 border-l border-slate-100 pl-4">
                   <Button variant="ghost" size="iconSm" onClick={() => handleEdit(item)}>
                      <Edit className="w-4 h-4 text-slate-500" />
                   </Button>
                   <Button variant="ghost" size="iconSm" onClick={() => handleDelete(item.id)} className="text-red-500 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                   </Button>
                </div>

              </Card>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      <WorkItemForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSuccess={fetchItems}
        projectId={projectId}
        workItem={editingItem}
      />
    </div>
  );
};

export default WorkItemsList;
