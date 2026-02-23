import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { plantillasService } from '@/services/plantillasService';
import { projectService } from '@/services/projectService';
import { subpartidaService } from '@/services/subpartidaService';
import { cn } from '@/lib/utils';
import {
  Loader2, Save, Copy, Layers, ChevronDown, ChevronRight,
  AlertCircle, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Modal para guardar la estructura actual de partidas/subpartidas del proyecto
 * como plantilla. Opciones: sobreescribir una existente o crear una nueva.
 *
 * Props:
 *  - isOpen, onClose
 *  - projectId: ID del proyecto cuyas partidas se guardarán
 *  - projectName: nombre del proyecto (para sugerir nombre de plantilla)
 *  - onSuccess: callback tras guardar
 */
const GuardarComoPlantillaModal = ({
  isOpen,
  onClose,
  projectId,
  projectName = '',
  onSuccess
}) => {
  const { toast } = useToast();

  // Mode: 'new' | 'overwrite'
  const [mode, setMode] = useState('new');

  // New plantilla form
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('CONSTRUCTION');

  // Overwrite selection
  const [plantillas, setPlantillas] = useState([]);
  const [selectedPlantillaId, setSelectedPlantillaId] = useState(null);
  const [loadingPlantillas, setLoadingPlantillas] = useState(false);

  // Preview of current project structure
  const [partidas, setPartidas] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [expandedPreview, setExpandedPreview] = useState(new Set());

  // Saving
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode('new');
      setNombre(`Plantilla - ${projectName}`);
      setDescripcion('');
      setCategoria('CONSTRUCTION');
      setSelectedPlantillaId(null);
      loadPlantillas();
      loadProjectStructure();
    }
  }, [isOpen, projectId]);

  const loadPlantillas = async () => {
    setLoadingPlantillas(true);
    try {
      const data = await plantillasService.getPlantillas();
      setPlantillas(data);
    } catch (error) {
      console.error('Error loading plantillas:', error);
    } finally {
      setLoadingPlantillas(false);
    }
  };

  const loadProjectStructure = async () => {
    setLoadingPreview(true);
    try {
      const partidasData = await projectService.getPartidaBreakdown(projectId);

      // Load sub-partidas for each
      const fullData = await Promise.all(
        partidasData.map(async (p) => {
          const subs = await subpartidaService.getSubpartidas(p.id);
          return { ...p, subpartidas: subs };
        })
      );

      setPartidas(fullData);
    } catch (error) {
      console.error('Error loading project structure:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  const togglePreviewExpand = (id) => {
    setExpandedPreview(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /**
   * Core: save project partidas → plantilla_partidas / plantilla_sub_partidas
   */
  const handleSave = async () => {
    // Validation
    if (mode === 'new' && !nombre.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'El nombre de la plantilla es obligatorio.' });
      return;
    }
    if (mode === 'overwrite' && !selectedPlantillaId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Seleccioná una plantilla para sobreescribir.' });
      return;
    }
    if (partidas.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'El proyecto no tiene partidas para guardar.' });
      return;
    }

    setSaving(true);
    try {
      let plantillaId;

      if (mode === 'new') {
        // Create new plantilla header
        const newPlantilla = await plantillasService.createPlantilla({
          nombre: nombre.trim(),
          descripcion,
          categoria
        });
        plantillaId = newPlantilla.id;
      } else {
        plantillaId = selectedPlantillaId;

        // Delete all existing partidas + sub-partidas from the target plantilla
        const existingPartidas = await plantillasService.getPartidasByPlantilla(plantillaId);
        for (const ep of existingPartidas) {
          await plantillasService.deletePartidaPlantilla(ep.id);
        }

        // Update header metadata if user wants
        const selected = plantillas.find(p => p.id === plantillaId);
        if (selected) {
          await plantillasService.updatePlantilla(plantillaId, {
            nombre: selected.nombre,
            descripcion: selected.descripcion,
            categoria: selected.categoria,
            icono: selected.icono
          });
        }
      }

      // Write current project structure into plantilla
      for (let i = 0; i < partidas.length; i++) {
        const p = partidas[i];

        const newPartida = await plantillasService.addPartidaToPlantilla(plantillaId, {
          nombre: p.name || p.nombre,
          descripcion: p.descripcion || ''
        });

        // Write sub-partidas
        if (p.subpartidas && p.subpartidas.length > 0) {
          for (let j = 0; j < p.subpartidas.length; j++) {
            const sub = p.subpartidas[j];
            await plantillasService.addSubPartida(newPartida.id, {
              nombre: sub.nombre,
              descripcion: sub.descripcion || '',
              presupuesto_base: sub.presupuesto || 0
            });
          }
        }
      }

      const actionLabel = mode === 'new' ? 'Plantilla creada' : 'Plantilla sobreescrita';
      toast({
        title: actionLabel,
        description: `Se guardaron ${partidas.length} partidas como plantilla.`,
        className: 'bg-green-50 border-green-200'
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving plantilla:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'No se pudo guardar la plantilla.' });
    } finally {
      setSaving(false);
    }
  };

  const totalPartidas = partidas.length;
  const totalSubs = partidas.reduce((acc, p) => acc + (p.subpartidas?.length || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5 text-blue-600" />
            Guardar como Plantilla
          </DialogTitle>
          <DialogDescription>
            Guardá la estructura actual de partidas y subpartidas como plantilla reutilizable.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 min-h-0 pr-1">

          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode('new')}
              className={cn(
                'p-4 rounded-xl border-2 text-left transition-all',
                mode === 'new'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Copy className={cn('w-4 h-4', mode === 'new' ? 'text-blue-600' : 'text-slate-400')} />
                <span className={cn('text-sm font-bold', mode === 'new' ? 'text-blue-900 dark:text-blue-300' : 'text-slate-600')}>
                  Crear Nueva
                </span>
              </div>
              <p className="text-xs text-slate-500">Se crea una nueva plantilla sin afectar las existentes</p>
            </button>

            <button
              onClick={() => setMode('overwrite')}
              className={cn(
                'p-4 rounded-xl border-2 text-left transition-all',
                mode === 'overwrite'
                  ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Save className={cn('w-4 h-4', mode === 'overwrite' ? 'text-amber-600' : 'text-slate-400')} />
                <span className={cn('text-sm font-bold', mode === 'overwrite' ? 'text-amber-900 dark:text-amber-300' : 'text-slate-600')}>
                  Sobreescribir
                </span>
              </div>
              <p className="text-xs text-slate-500">Reemplaza las partidas de una plantilla existente</p>
            </button>
          </div>

          {/* Mode: NEW */}
          {mode === 'new' && (
            <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="space-y-2">
                <Label className="font-bold">Nombre de plantilla <span className="text-red-500">*</span></Label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Reforma Baño Standard"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold">Categoría</Label>
                  <select
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                  >
                    <option value="CONSTRUCTION">Construcción</option>
                    <option value="RENOVATION">Reformas</option>
                    <option value="ELECTRICAL">Electricidad</option>
                    <option value="SOLAR">Energía Solar</option>
                    <option value="OTROS">Otros</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Descripción</Label>
                  <Input
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mode: OVERWRITE */}
          {mode === 'overwrite' && (
            <div className="space-y-3">
              <Label className="font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Seleccioná la plantilla a sobreescribir
              </Label>
              <p className="text-xs text-slate-400">
                Las partidas y subpartidas actuales de la plantilla seleccionada serán reemplazadas por las del proyecto.
              </p>

              {loadingPlantillas ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : plantillas.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">
                  No hay plantillas existentes. Usá "Crear Nueva".
                </div>
              ) : (
                <div className="border rounded-xl overflow-hidden max-h-[200px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {plantillas.map((pl) => {
                    const isSelected = selectedPlantillaId === pl.id;
                    const partidasCount = pl.plantilla_partidas?.length || 0;
                    return (
                      <button
                        key={pl.id}
                        onClick={() => setSelectedPlantillaId(pl.id)}
                        className={cn(
                          'w-full text-left px-4 py-3 flex items-center gap-3 transition-colors',
                          isSelected
                            ? 'bg-amber-50 dark:bg-amber-950/10 border-l-4 border-l-amber-500'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-l-4 border-l-transparent'
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                              {pl.icono} {pl.nombre}
                            </span>
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full">
                              {partidasCount} partidas
                            </span>
                          </div>
                          {pl.descripcion && (
                            <p className="text-xs text-slate-400 truncate">{pl.descripcion}</p>
                          )}
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-amber-500 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Preview: What will be saved */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-bold flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" />
                Estructura a guardar
              </Label>
              <span className="text-[10px] text-slate-400 font-bold">
                {totalPartidas} partidas · {totalSubs} subpartidas
              </span>
            </div>

            {loadingPreview ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : partidas.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm border rounded-xl">
                El proyecto no tiene partidas definidas.
              </div>
            ) : (
              <div className="border rounded-xl overflow-hidden max-h-[220px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                {partidas.map((p) => {
                  const isExp = expandedPreview.has(p.id);
                  const subs = p.subpartidas || [];
                  return (
                    <div key={p.id}>
                      <button
                        onClick={() => togglePreviewExpand(p.id)}
                        className="w-full text-left px-4 py-2.5 flex items-center gap-2 hover:bg-white dark:hover:bg-slate-900 transition-colors"
                      >
                        {isExp
                          ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        }
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1">
                          {p.name || p.nombre}
                        </span>
                        {subs.length > 0 && (
                          <span className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">
                            {subs.length} sub
                          </span>
                        )}
                      </button>
                      <AnimatePresence>
                        {isExp && subs.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pl-10 pr-4 pb-2 space-y-1">
                              {subs.map(sub => (
                                <div key={sub.id} className="flex items-center gap-2 py-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                  <span className="text-xs text-slate-500">{sub.nombre}</span>
                                </div>
                              ))}
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

        {/* Footer */}
        <DialogFooter className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || partidas.length === 0}
            className={cn(
              'gap-2 rounded-full px-6',
              mode === 'new'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            )}
          >
            {saving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : mode === 'new' ? <Copy className="w-4 h-4" /> : <Save className="w-4 h-4" />
            }
            {mode === 'new' ? 'Crear Plantilla' : 'Sobreescribir Plantilla'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GuardarComoPlantillaModal;
