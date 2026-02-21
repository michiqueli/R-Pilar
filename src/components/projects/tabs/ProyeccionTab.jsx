import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrencyARS } from '@/lib/formatUtils';
import { tokens } from '@/lib/designTokens';
import { proyeccionService } from '@/services/proyeccionService';
import {
  Loader2, Plus, Pencil, Trash2, Save, X,
  TrendingUp, DollarSign, ListChecks
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const ProyeccionTab = ({ projectId }) => {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Inline form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ titulo: '', importe: '', notas: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await proyeccionService.getByProject(projectId);
      setItems(data);
    } catch (error) {
      console.error('Error loading proyecciones:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las proyecciones.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchData();
  }, [projectId]);

  const totalEstimado = items.reduce((sum, item) => sum + Number(item.importe || 0), 0);

  const resetForm = () => {
    setFormData({ titulo: '', importe: '', notas: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (item) => {
    setFormData({
      titulo: item.titulo,
      importe: item.importe.toString(),
      notas: item.notas || ''
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.titulo.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'El título es obligatorio.' });
      return;
    }
    if (!formData.importe || parseFloat(formData.importe) <= 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'El importe debe ser mayor a 0.' });
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await proyeccionService.update(editingId, formData);
        toast({ title: 'Actualizado', description: 'Proyección actualizada correctamente.', className: 'bg-green-50 border-green-200' });
      } else {
        await proyeccionService.create({ ...formData, proyecto_id: projectId });
        toast({ title: 'Creado', description: 'Proyección agregada correctamente.', className: 'bg-green-50 border-green-200' });
      }
      resetForm();
      fetchData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta proyección?')) return;
    try {
      await proyeccionService.delete(id);
      toast({ title: 'Eliminado', className: 'bg-green-50 border-green-200' });
      fetchData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  if (loading) {
    return (
      <div className="p-20 flex justify-center">
        <Loader2 className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-blue-950/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              Total Proyectado
            </p>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrencyARS(totalEstimado)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">{items.length} ítem{items.length !== 1 ? 's' : ''} estimado{items.length !== 1 ? 's' : ''}</p>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950/30 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
              <ListChecks className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Gastos Estimados
            </p>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Estimaciones de carga manual. El gasto real se calcula cuando los movimientos se asocian a partidas específicas.
          </p>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ítems de Proyección</h3>
        {!showForm && (
          <Button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 gap-2"
            size="sm"
          >
            <Plus className="w-4 h-4" /> Agregar
          </Button>
        )}
      </div>

      {/* Inline Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-5 border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-5 space-y-1.5">
                  <Label className="text-xs font-bold">Título</Label>
                  <Input
                    placeholder="Ej: Materiales eléctricos"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    autoFocus
                  />
                </div>
                <div className="md:col-span-3 space-y-1.5">
                  <Label className="text-xs font-bold">Importe (ARS)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.importe}
                    onChange={(e) => setFormData({ ...formData, importe: e.target.value })}
                    className="font-mono"
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-xs font-bold">Notas</Label>
                  <Input
                    placeholder="Opcional"
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full flex-1"
                    size="sm"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={resetForm} className="rounded-full">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Items List */}
      {items.length === 0 && !showForm ? (
        <Card className="p-12 text-center">
          <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No hay proyecciones cargadas</p>
          <p className="text-sm text-slate-400 mt-1">Agregá ítems estimados para este proyecto</p>
        </Card>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Título</th>
                <th className="px-6 py-4 font-semibold text-right">Importe</th>
                <th className="px-6 py-4 font-semibold">Notas</th>
                <th className="px-6 py-4 font-semibold text-right w-28">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 group"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      {item.titulo}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-blue-600">
                      {formatCurrencyARS(item.importe)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs truncate max-w-[200px]">
                      {item.notas || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
            {items.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 dark:bg-slate-950 border-t-2 border-slate-200 dark:border-slate-700">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">TOTAL</td>
                  <td className="px-6 py-4 text-right font-mono font-black text-lg text-blue-600">
                    {formatCurrencyARS(totalEstimado)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
};

export default ProyeccionTab;
