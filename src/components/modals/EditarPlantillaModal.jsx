
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
  Loader2, Plus, Trash2, Edit2, Save, X, GripVertical 
} from 'lucide-react';
import { plantillasService } from '@/services/plantillasService';
import { cn } from '@/lib/utils';

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
  
  // Partidas Management
  const [partidas, setPartidas] = useState([]);
  const [loadingPartidas, setLoadingPartidas] = useState(false);
  
  // Nested Modal State (Simple Dialog via conditional render)
  const [isPartidaModalOpen, setIsPartidaModalOpen] = useState(false);
  const [editingPartida, setEditingPartida] = useState(null);
  const [partidaForm, setPartidaForm] = useState({ nombre: '', descripcion: '' });

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
        // New Mode
        setFormData({
          nombre: '',
          descripcion: '',
          categoria: 'CONSTRUCTION',
          icono: '📋'
        });
        setPartidas([]);
      }
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
  // MAIN FORM HANDLERS
  // --------------------------------------------------------------------------------------------

  const handleSavePlantilla = async () => {
    if (!formData.nombre.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'El nombre es requerido.' });
      return;
    }

    setLoading(true);
    try {
      let savedId;
      if (plantilla?.id) {
        await plantillasService.updatePlantilla(plantilla.id, formData);
        savedId = plantilla.id;
        toast({ title: 'Plantilla actualizada' });
      } else {
        const newP = await plantillasService.createPlantilla(formData);
        savedId = newP.id;
        toast({ title: 'Plantilla creada' });
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
  // PARTIDA MODAL HANDLERS
  // --------------------------------------------------------------------------------------------

  const openPartidaModal = (partida = null) => {
    if (!plantilla?.id) {
      toast({ 
        variant: 'destructive', 
        title: 'Guarda primero', 
        description: 'Debes guardar la plantilla antes de agregar partidas.' 
      });
      return;
    }
    
    setEditingPartida(partida);
    setPartidaForm({
      nombre: partida?.nombre || '',
      descripcion: partida?.descripcion || ''
    });
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
    if (!window.confirm('¿Eliminar esta partida de la plantilla?')) return;
    
    try {
      await plantillasService.deletePartidaPlantilla(id);
      setPartidas(prev => prev.filter(p => p.id !== id));
      toast({ title: 'Partida eliminada' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error al eliminar' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle>{plantilla ? 'Editar Plantilla' : 'Nueva Plantilla'}</DialogTitle>
          <DialogDescription>Configura los detalles y la estructura base.</DialogDescription>
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
                Partidas Incluidas
                <span className="bg-slate-100 dark:bg-slate-800 text-xs px-2 py-0.5 rounded-full text-slate-500">
                  {partidas.length}
                </span>
              </h3>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => openPartidaModal()}
                disabled={!plantilla?.id} // Must save template first
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
                  {partidas.map((partida, index) => (
                    <div key={partida.id} className="flex items-center p-3 hover:bg-white dark:hover:bg-slate-900 transition-colors group">
                      <div className="mr-3 text-slate-300">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                          {partida.nombre}
                        </div>
                        {partida.descripcion && (
                          <div className="text-xs text-slate-500 truncate max-w-[300px]">
                            {partida.descripcion}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openPartidaModal(partida)}>
                          <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeletePartida(partida.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSavePlantilla} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {plantilla ? 'Guardar Cambios' : 'Crear Plantilla'}
          </Button>
        </DialogFooter>

        {/* Nested Modal for Partida (Implemented as Absolute Overlay or Separate Dialog) */}
        {/* Using a second Dialog component is standard in many React libraries including Radix/Shadcn */}
        <Dialog open={isPartidaModalOpen} onOpenChange={setIsPartidaModalOpen}>
           <DialogContent className="max-w-md z-[150]"> {/* Higher Z-Index just in case */}
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
