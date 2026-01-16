
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { plantillasService } from '@/services/plantillasService';
import { ChevronDown, ChevronRight, Loader2, Info, Plus, Edit2, Copy, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import EditarPlantillaModal from '@/components/modals/EditarPlantillaModal';

const SelectPlantillaModal = ({ isOpen, onClose, onSuccess, proyectoId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState(null);
  const [plantillas, setPlantillas] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  // Edit Mode State
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPlantilla, setSelectedPlantilla] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchPlantillas();
      setExpandedId(null);
    }
  }, [isOpen]);

  const fetchPlantillas = async () => {
    setLoading(true);
    try {
      const data = await plantillasService.getPlantillas();
      setPlantillas(data);
    } catch (error) {
      console.error(error);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'No se pudieron cargar las plantillas.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadPlantilla = async (e, plantilla) => {
    e.stopPropagation();
    if (!window.confirm(`¿Estás seguro de cargar la plantilla "${plantilla.nombre}"? Esto agregará nuevas partidas a tu proyecto.`)) {
      return;
    }

    setLoadingActionId(plantilla.id);
    try {
      await plantillasService.loadPlantillaToProject(proyectoId, plantilla.id);
      
      toast({
        title: '¡Plantilla cargada!',
        description: `Se han importado las partidas de "${plantilla.nombre}".`,
      });
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Hubo un problema al cargar la plantilla.',
      });
    } finally {
      setLoadingActionId(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Group templates by category
  const groupedPlantillas = plantillas.reduce((acc, curr) => {
    const cat = curr.categoria || 'OTROS';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(curr);
    return acc;
  }, {});

  const getCategoryLabel = (cat) => {
    const map = {
      'CONSTRUCTION': 'Construcción',
      'ELECTRICAL': 'Electricidad',
      'SOLAR': 'Energía Solar',
      'RENOVATION': 'Reformas',
      'OTROS': 'Otros'
    };
    return map[cat] || cat;
  };

  // --------------------------------------------------------------------------------------------
  // ACTIONS HANDLERS
  // --------------------------------------------------------------------------------------------

  const handleCreateNew = () => {
    setSelectedPlantilla(null);
    setShowEditModal(true);
  };

  const handleEdit = (e, plantilla) => {
    e.stopPropagation();
    setSelectedPlantilla(plantilla);
    setShowEditModal(true);
  };

  const handleDuplicate = async (e, plantilla) => {
    e.stopPropagation();
    if (!window.confirm(`¿Duplicar la plantilla "${plantilla.nombre}"?`)) return;

    setLoadingActionId(plantilla.id);
    try {
      await plantillasService.duplicatePlantilla(plantilla.id);
      toast({
        title: '¡Plantilla duplicada!',
        description: `Se ha creado una copia de "${plantilla.nombre}".`,
        className: 'bg-purple-50 border-purple-200'
      });
      await fetchPlantillas();
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Hubo un problema al duplicar la plantilla.',
      });
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleDelete = async (e, plantilla) => {
    e.stopPropagation();
    const confirmMessage = `¿Estás seguro de ELIMINAR la plantilla "${plantilla.nombre}"?\nEsta acción no se puede deshacer.`;
    if (!window.confirm(confirmMessage)) return;

    setLoadingActionId(plantilla.id);
    try {
      await plantillasService.deletePlantilla(plantilla.id);
      toast({
        title: 'Plantilla eliminada',
        description: `Se ha eliminado correctamente.`,
      });
      await fetchPlantillas();
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar la plantilla.',
      });
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleSavePlantilla = () => {
    fetchPlantillas(); // Reload list
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-0 overflow-hidden">
          
          <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-xl">Seleccionar Plantilla de Obra</DialogTitle>
              <DialogDescription className="mt-1">
                Elige una plantilla para importar estructura a tu proyecto.
              </DialogDescription>
            </div>
            <Button size="sm" onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700 text-white ml-4">
              <Plus className="w-4 h-4 mr-2" />
              Crear Nueva Plantilla
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-slate-950/30 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-60 gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p>Cargando catálogo de plantillas...</p>
              </div>
            ) : plantillas.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 gap-3 text-slate-400">
                <Info className="w-10 h-10 text-slate-300" />
                <p>No se encontraron plantillas disponibles.</p>
                <Button variant="outline" onClick={handleCreateNew}>
                   Crear la primera plantilla
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedPlantillas).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1 flex items-center gap-2">
                      {getCategoryLabel(category)}
                      <span className="text-xs font-normal bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">
                        {items.length}
                      </span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {items.map((plantilla) => {
                        const isExpanded = expandedId === plantilla.id;
                        const isLoadingThis = loadingActionId === plantilla.id;

                        return (
                          <motion.div
                            layout
                            key={plantilla.id}
                            className={cn(
                              "bg-white dark:bg-slate-900 border rounded-xl overflow-hidden transition-all duration-200 group relative",
                              isExpanded 
                                ? "border-blue-500 shadow-md col-span-1 md:col-span-2 ring-1 ring-blue-500/20" 
                                : "border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm"
                            )}
                          >
                            {/* Card Header */}
                            <div 
                              className="p-4 cursor-pointer flex items-start gap-4 relative"
                              onClick={() => toggleExpand(plantilla.id)}
                            >
                              <div className="text-3xl bg-slate-50 dark:bg-slate-800 w-12 h-12 flex items-center justify-center rounded-lg shrink-0 border border-slate-100 dark:border-slate-700">
                                {plantilla.icono || '📋'}
                              </div>
                              
                              <div className="flex-1 min-w-0 pr-20"> {/* Added padding right to avoid overlap with buttons */}
                                <div className="flex justify-between items-start">
                                  <h4 className="font-bold text-slate-900 dark:text-white truncate">
                                    {plantilla.nombre}
                                  </h4>
                                </div>
                                <p className="text-sm text-slate-500 line-clamp-2 mt-1">
                                  {plantilla.descripcion}
                                </p>
                                
                                {!isExpanded && (
                                  <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                                    <Badge variant="secondary" className="font-normal">
                                      {plantilla.plantilla_partidas?.length || 0} Partidas
                                    </Badge>
                                  </div>
                                )}
                              </div>
                              
                              <div className="absolute top-4 right-4 flex items-center">
                                {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                              </div>
                            </div>

                            {/* Action Buttons (Top Right) - Floating Group */}
                            <div className="absolute top-3 right-12 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-1 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm z-10">
                               <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 text-purple-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                  onClick={(e) => handleDuplicate(e, plantilla)}
                                  disabled={isLoadingThis || loadingActionId !== null}
                                  title="Duplicar Plantilla"
                               >
                                  <Copy className="w-3.5 h-3.5" />
                               </Button>
                               <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                  onClick={(e) => handleEdit(e, plantilla)}
                                  disabled={isLoadingThis || loadingActionId !== null}
                                  title="Editar Plantilla"
                               >
                                  <Edit2 className="w-3.5 h-3.5" />
                               </Button>
                               <div className="w-px h-3 bg-slate-200 dark:bg-slate-700 mx-0.5"></div>
                               <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  onClick={(e) => handleDelete(e, plantilla)}
                                  disabled={isLoadingThis || loadingActionId !== null}
                                  title="Eliminar Plantilla"
                               >
                                  <Trash2 className="w-3.5 h-3.5" />
                               </Button>
                            </div>

                            {/* Expanded Content */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50"
                                >
                                  <div className="p-4 space-y-3">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-xs font-semibold text-slate-500 uppercase">Vista Previa de Partidas</span>
                                      <div className="flex gap-2">
                                         <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={(e) => handleEdit(e, plantilla)}
                                         >
                                            <Edit2 className="w-3 h-3 mr-2" /> Editar
                                         </Button>
                                         <Button 
                                            size="sm" 
                                            onClick={(e) => handleLoadPlantilla(e, plantilla)}
                                            disabled={isLoadingThis || loadingActionId !== null}
                                            className={cn(isLoadingThis ? "w-32" : "")}
                                         >
                                            {isLoadingThis ? (
                                              <>
                                                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                                Cargando...
                                              </>
                                            ) : (
                                              "Cargar Plantilla"
                                            )}
                                         </Button>
                                      </div>
                                    </div>

                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                      {plantilla.plantilla_partidas?.map((partida, idx) => (
                                        <div key={partida.id || idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm">
                                          <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            {partida.nombre}
                                          </div>
                                          {partida.plantilla_sub_partidas?.length > 0 && (
                                            <div className="mt-2 pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-1">
                                              {partida.plantilla_sub_partidas.map((sub, sIdx) => (
                                                <div key={sub.id || sIdx} className="text-xs text-slate-500">
                                                  {sub.nombre}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal Component */}
      {showEditModal && (
        <EditarPlantillaModal 
           isOpen={showEditModal}
           onClose={() => setShowEditModal(false)}
           onSave={handleSavePlantilla}
           plantilla={selectedPlantilla}
        />
      )}
    </>
  );
};

export default SelectPlantillaModal;
