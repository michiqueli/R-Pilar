
import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { 
  Loader2, Plus, Trash2, Edit2, Save, X, GripVertical,
  ChevronDown, ChevronRight, Copy, Layers
} from 'lucide-react';
import { plantillasService } from '@/services/plantillasService';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function EditarPlantillaModal({ 
  isOpen, 
  onClose, 
  onSave, 
  plantilla 
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'CONSTRUCTION',
    icono: '📋'
  });
  
  // Partidas with nested sub-partidas
  const [partidas, setPartidas] = useState([]);
  const [loadingPartidas, setLoadingPartidas] = useState(false);
  
  // Expanded partidas (to show sub-partidas)
  const [expandedPartidas, setExpandedPartidas] = useState(new Set());

  // Partida modal
  const [isPartidaModalOpen, setIsPartidaModalOpen] = useState(false);
  const [editingPartida, setEditingPartida] = useState(null);
  const [partidaForm, setPartidaForm] = useState({ nombre: '', descripcion: '' });

  // Sub-partida inline form
  const [activeSubForm, setActiveSubForm] = useState(null); // partidaId currently adding sub to
  const [editingSubPartida, setEditingSubPartida] = useState(null);
  const [subPartidaForm, setSubPartidaForm] = useState({ nombre: '', descripcion: '' });

  // Load Initial Data
  useEffect(() => {
    if (isOpen) {
      if (plantilla) {
        setFormData({
          nombre: plantilla.nombre || '',
          descripcion: plantilla.descripcion || '',
          categoria: plantilla.categoria || 'CONSTRUCTION',
          icono: plantilla.icono || '📋'
        });
        loadPartidas(plantilla.id);
      } else {
        setFormData({ nombre: '', descripcion: '', categoria: 'CONSTRUCTION', icono: '📋' });
        setPartidas([]);
      }
      setExpandedPartidas(new Set());
      setActiveSubForm(null);
      setEditingSubPartida(null);
    }
  }, [isOpen, plantilla]);

  const loadPartidas = async (plantillaId) => {
    setLoadingPartidas(true);
    try {
      const data = await plantillasService.getPartidasByPlantilla(plantillaId);
      setPartidas(data);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error cargando partidas' });
    } finally {
      setLoadingPartidas(false);
    }
  };

  // --------------------------------------------------------------------------------------------
  // TOGGLE EXPAND
  // --------------------------------------------------------------------------------------------
  const toggleExpand = (partidaId) => {
    setExpandedPartidas(prev => {
      const next = new Set(prev);
      if (next.has(partidaId)) {
        next.delete(partidaId);
        // Close sub-form if collapsing
        if (activeSubForm === partidaId) setActiveSubForm(null);
      } else {
        next.add(partidaId);
      }
      return next;
    });
  };

  // --------------------------------------------------------------------------------------------
  // MAIN FORM HANDLERS
  // --------------------------------------------------------------------------------------------
  const handleSavePlantilla = async (saveAsNew = false) => {
    if (!formData.nombre.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'El nombre es requerido.' });
      return;
    }

    setLoading(true);
    try {
      if (saveAsNew) {
        // "Guardar como nueva": duplicate current with new name
        if (plantilla?.id) {
          const duplicated = await plantillasService.duplicatePlantilla(plantilla.id);
          // Update the duplicated one with current form name
          await plantillasService.updatePlantilla(duplicated.id, {
            ...formData,
            nombre: formData.nombre.replace(' (Copia)', '') // Clean if already has "(Copia)"
          });
          toast({ title: 'Plantilla duplicada', description: `Se creó "${formData.nombre}" como nueva plantilla.` });
        } else {
          // If it was a new one, just create
          await plantillasService.createPlantilla(formData);
          toast({ title: 'Plantilla creada' });
        }
      } else {
        if (plantilla?.id) {
          await plantillasService.updatePlantilla(plantilla.id, formData);
          toast({ title: 'Plantilla actualizada' });
        } else {
          await plantillasService.createPlantilla(formData);
          toast({ title: 'Plantilla creada' });
        }
      }

      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error al guardar' });
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------------------------------
  // PARTIDA HANDLERS
  // --------------------------------------------------------------------------------------------
  const openPartidaModal = (partida = null) => {
    if (!plantilla?.id) {
      toast({ variant: 'destructive', title: 'Guarda primero', description: 'Debes guardar la plantilla antes de agregar partidas.' });
      return;
    }
    setEditingPartida(partida);
    setPartidaForm({ nombre: partida?.nombre || '', descripcion: partida?.descripcion || '' });
    setIsPartidaModalOpen(true);
  };

  const handleSavePartida = async () => {
    if (!partidaForm.nombre.trim()) return;
    setLoading(true);
    try {
      if (editingPartida) {
        await plantillasService.updatePartidaPlantilla(editingPartida.id, partidaForm);
        toast({ title: 'Partida actualizada' });
      } else {
        await plantillasService.addPartidaToPlantilla(plantilla.id, partidaForm);
        toast({ title: 'Partida agregada' });
      }
      await loadPartidas(plantilla.id);
      setIsPartidaModalOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error al guardar partida' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePartida = async (id) => {
    if (!window.confirm('¿Eliminar esta partida y sus subpartidas?')) return;
    try {
      await plantillasService.deletePartidaPlantilla(id);
      setPartidas(prev => prev.filter(p => p.id !== id));
      toast({ title: 'Partida eliminada' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error al eliminar' });
    }
  };

  // --------------------------------------------------------------------------------------------
  // SUB-PARTIDA HANDLERS
  // --------------------------------------------------------------------------------------------
  const openSubPartidaForm = (partidaId, subPartida = null) => {
    setActiveSubForm(partidaId);
    setEditingSubPartida(subPartida);
    setSubPartidaForm({
      nombre: subPartida?.nombre || '',
      descripcion: subPartida?.descripcion || ''
    });
    // Ensure partida is expanded
    setExpandedPartidas(prev => new Set(prev).add(partidaId));
  };

  const closeSubPartidaForm = () => {
    setActiveSubForm(null);
    setEditingSubPartida(null);
    setSubPartidaForm({ nombre: '', descripcion: '' });
  };

  const handleSaveSubPartida = async (partidaId) => {
    if (!subPartidaForm.nombre.trim()) return;
    setLoading(true);
    try {
      if (editingSubPartida) {
        await plantillasService.updateSubPartida(editingSubPartida.id, subPartidaForm);
        toast({ title: 'Subpartida actualizada' });
      } else {
        await plantillasService.addSubPartida(partidaId, subPartidaForm);
        toast({ title: 'Subpartida agregada' });
      }
      await loadPartidas(plantilla.id);
      closeSubPartidaForm();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error al guardar subpartida' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubPartida = async (subId) => {
    if (!window.confirm('¿Eliminar esta subpartida?')) return;
    try {
      await plantillasService.deleteSubPartida(subId);
      await loadPartidas(plantilla.id);
      toast({ title: 'Subpartida eliminada' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error al eliminar subpartida' });
    }
  };

  // --------------------------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------------------------
  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle>{plantilla ? 'Editar Plantilla' : 'Nueva Plantilla'}</DialogTitle>
          <DialogDescription>Configura los detalles, partidas y subpartidas.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6 p-1">
          {/* Header Form */}
          <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label>Nombre de Plantilla <span className="text-red-500">*</span></Label>
                <Input 
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Ej: Reforma Baño Standard"
                />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label>Categoría</Label>
                <select 
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm"
                  value={formData.categoria}
                  onChange={e => setFormData({...formData, categoria: e.target.value})}
                >
                  <option value="CONSTRUCTION">Construcción</option>
                  <option value="RENOVATION">Reformas</option>
                  <option value="ELECTRICAL">Electricidad</option>
                  <option value="SOLAR">Energía Solar</option>
                  <option value="OTROS">Otros</option>
                </select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Descripción</Label>
                <textarea 
                  className="w-full h-20 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.descripcion}
                  onChange={e => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Describe el alcance de esta plantilla..."
                />
              </div>
            </div>
          </div>

          {/* Partidas Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                Partidas y Subpartidas
                <span className="bg-slate-100 dark:bg-slate-800 text-xs px-2 py-0.5 rounded-full text-slate-500">
                  {partidas.length}
                </span>
              </h3>
              <Button 
                size="sm" variant="outline" 
                onClick={() => openPartidaModal()}
                disabled={!plantilla?.id}
                title={!plantilla?.id ? "Guarda la plantilla primero" : "Agregar Partida"}
              >
                <Plus className="w-4 h-4 mr-2" /> Agregar Partida
              </Button>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50/50 dark:bg-slate-950/50 min-h-[150px]">
              {loadingPartidas ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : partidas.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-sm">
                  <p>No hay partidas definidas.</p>
                  {!plantilla?.id && <p className="text-xs mt-1">(Guarda la plantilla para agregar)</p>}
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {partidas.map((partida) => {
                    const isExpanded = expandedPartidas.has(partida.id);
                    const subPartidas = partida.plantilla_sub_partidas || [];
                    const subCount = subPartidas.length;

                    return (
                      <div key={partida.id}>
                        {/* Partida Row */}
                        <div className="flex items-center p-3 hover:bg-white dark:hover:bg-slate-900 transition-colors group">
                          <div className="mr-2 text-slate-300">
                            <GripVertical className="w-4 h-4" />
                          </div>

                          {/* Expand toggle */}
                          <button
                            onClick={() => toggleExpand(partida.id)}
                            className="mr-2 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            {isExpanded 
                              ? <ChevronDown className="w-4 h-4 text-slate-500" />
                              : <ChevronRight className="w-4 h-4 text-slate-400" />
                            }
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                              {partida.nombre}
                              {subCount > 0 && (
                                <span className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-bold">
                                  {subCount} sub
                                </span>
                              )}
                            </div>
                            {partida.descripcion && (
                              <div className="text-xs text-slate-500 truncate max-w-[300px]">
                                {partida.descripcion}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Agregar subpartida"
                              onClick={(e) => { e.stopPropagation(); openSubPartidaForm(partida.id); }}>
                              <Plus className="w-3.5 h-3.5 text-green-500" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => openPartidaModal(partida)}>
                              <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => handleDeletePartida(partida.id)}>
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </Button>
                          </div>
                        </div>

                        {/* Sub-partidas (expanded) */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden"
                            >
                              <div className="pl-12 pr-3 pb-2 space-y-1">
                                {subPartidas.length === 0 && activeSubForm !== partida.id && (
                                  <div className="text-xs text-slate-400 py-2 flex items-center gap-2">
                                    <Layers className="w-3 h-3" />
                                    Sin subpartidas.
                                    <button
                                      className="text-blue-500 hover:text-blue-700 font-bold underline"
                                      onClick={() => openSubPartidaForm(partida.id)}
                                    >
                                      Agregar una
                                    </button>
                                  </div>
                                )}

                                {/* Existing sub-partidas */}
                                {subPartidas.map((sub) => (
                                  <div
                                    key={sub.id}
                                    className="flex items-center py-1.5 px-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 group/sub"
                                  >
                                    <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 mr-3 flex-shrink-0" />
                                    <span className="flex-1 text-xs text-slate-700 dark:text-slate-300">
                                      {sub.nombre}
                                    </span>
                                    {sub.descripcion && (
                                      <span className="text-[10px] text-slate-400 mr-2 truncate max-w-[120px]">
                                        {sub.descripcion}
                                      </span>
                                    )}
                                    <div className="flex gap-0.5 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                      <Button variant="ghost" size="icon" className="h-6 w-6"
                                        onClick={() => openSubPartidaForm(partida.id, sub)}>
                                        <Edit2 className="w-3 h-3 text-blue-500" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-6 w-6"
                                        onClick={() => handleDeleteSubPartida(sub.id)}>
                                        <Trash2 className="w-3 h-3 text-red-500" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}

                                {/* Inline sub-partida form */}
                                {activeSubForm === partida.id && (
                                  <div className="flex items-center gap-2 py-2 px-2 bg-blue-50/50 dark:bg-blue-950/10 rounded-md border border-blue-200/50 dark:border-blue-800/50">
                                    <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                                    <Input
                                      autoFocus
                                      placeholder="Nombre subpartida"
                                      value={subPartidaForm.nombre}
                                      onChange={(e) => setSubPartidaForm({ ...subPartidaForm, nombre: e.target.value })}
                                      className="h-7 text-xs flex-1"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && subPartidaForm.nombre.trim()) handleSaveSubPartida(partida.id);
                                        if (e.key === 'Escape') closeSubPartidaForm();
                                      }}
                                    />
                                    <Input
                                      placeholder="Descripción (opc)"
                                      value={subPartidaForm.descripcion}
                                      onChange={(e) => setSubPartidaForm({ ...subPartidaForm, descripcion: e.target.value })}
                                      className="h-7 text-xs w-32"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && subPartidaForm.nombre.trim()) handleSaveSubPartida(partida.id);
                                        if (e.key === 'Escape') closeSubPartidaForm();
                                      }}
                                    />
                                    <Button
                                      size="icon"
                                      className="h-7 w-7 bg-blue-600 hover:bg-blue-700 text-white"
                                      disabled={!subPartidaForm.nombre.trim() || loading}
                                      onClick={() => handleSaveSubPartida(partida.id)}
                                    >
                                      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={closeSubPartidaForm}>
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}

                                {/* Add sub button (when form is not active) */}
                                {activeSubForm !== partida.id && subPartidas.length > 0 && (
                                  <button
                                    onClick={() => openSubPartidaForm(partida.id)}
                                    className="flex items-center gap-1.5 text-[10px] text-blue-500 hover:text-blue-700 font-bold py-1 px-2 rounded hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                                  >
                                    <Plus className="w-3 h-3" /> Agregar subpartida
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with "Save as new" */}
        <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 flex-wrap gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          
          {/* Save as new (only when editing existing) */}
          {plantilla?.id && (
            <Button
              variant="outline"
              onClick={() => handleSavePlantilla(true)}
              disabled={loading}
              className="gap-2"
            >
              <Copy className="w-4 h-4" />
              Guardar como nueva
            </Button>
          )}

          <Button
            onClick={() => handleSavePlantilla(false)}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {plantilla ? 'Guardar Cambios' : 'Crear Plantilla'}
          </Button>
        </DialogFooter>

        {/* Nested Modal for Partida */}
        <Dialog open={isPartidaModalOpen} onOpenChange={setIsPartidaModalOpen}>
           <DialogContent className="max-w-md z-[150]">
              <DialogHeader>
                 <DialogTitle>{editingPartida ? 'Editar Partida' : 'Nueva Partida'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                 <div className="space-y-2">
                    <Label>Nombre de Partida</Label>
                    <Input 
                       value={partidaForm.nombre}
                       onChange={e => setPartidaForm({...partidaForm, nombre: e.target.value})}
                       placeholder="Ej: Demoliciones"
                       autoFocus
                    />
                 </div>
                 <div className="space-y-2">
                    <Label>Descripción</Label>
                    <textarea 
                       className="w-full h-20 p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-transparent text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                       value={partidaForm.descripcion}
                       onChange={e => setPartidaForm({...partidaForm, descripcion: e.target.value})}
                    />
                 </div>
              </div>
              <DialogFooter>
                 <Button variant="outline" onClick={() => setIsPartidaModalOpen(false)}>Cancelar</Button>
                 <Button onClick={handleSavePartida} disabled={!partidaForm.nombre || loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Guardar
                 </Button>
              </DialogFooter>
           </DialogContent>
        </Dialog>

      </DialogContent>
    </Dialog>
  );
}
