
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { plantillasService } from '@/services/plantillasService';

const CreatePlantillaModal = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'CONSTRUCTION',
    icono: '🏗️',
    partidas: []
  });

  const CATEGORIES = [
    { value: 'CONSTRUCTION', label: 'Construcción General', icon: '🏗️' },
    { value: 'ELECTRICAL', label: 'Instalación Eléctrica', icon: '⚡' },
    { value: 'SOLAR', label: 'Energía Fotovoltaica', icon: '☀️' },
    { value: 'RENOVATION', label: 'Reforma / Remodelación', icon: '🔧' },
    { value: 'OTHER', label: 'Otro', icon: '📋' }
  ];

  // Partida helpers
  const addPartida = () => {
    setFormData(prev => ({
      ...prev,
      partidas: [
        ...prev.partidas, 
        { 
          tempId: Date.now(), 
          nombre: '', 
          presupuesto_base: 0, 
          sub_partidas: [],
          isExpanded: true
        }
      ]
    }));
  };

  const removePartida = (index) => {
    setFormData(prev => ({
      ...prev,
      partidas: prev.partidas.filter((_, i) => i !== index)
    }));
  };

  const updatePartida = (index, field, value) => {
    const newPartidas = [...formData.partidas];
    newPartidas[index] = { ...newPartidas[index], [field]: value };
    setFormData(prev => ({ ...prev, partidas: newPartidas }));
  };

  // Sub-partida helpers
  const addSubPartida = (partidaIndex) => {
    const newPartidas = [...formData.partidas];
    newPartidas[partidaIndex].sub_partidas.push({
      tempId: Date.now() + Math.random(),
      nombre: '',
      presupuesto_base: 0
    });
    setFormData(prev => ({ ...prev, partidas: newPartidas }));
  };

  const removeSubPartida = (partidaIndex, subIndex) => {
    const newPartidas = [...formData.partidas];
    newPartidas[partidaIndex].sub_partidas = newPartidas[partidaIndex].sub_partidas.filter((_, i) => i !== subIndex);
    setFormData(prev => ({ ...prev, partidas: newPartidas }));
  };

  const updateSubPartida = (partidaIndex, subIndex, field, value) => {
    const newPartidas = [...formData.partidas];
    newPartidas[partidaIndex].sub_partidas[subIndex] = { 
      ...newPartidas[partidaIndex].sub_partidas[subIndex], 
      [field]: value 
    };
    setFormData(prev => ({ ...prev, partidas: newPartidas }));
  };

  const togglePartidaExpand = (index) => {
    const newPartidas = [...formData.partidas];
    newPartidas[index].isExpanded = !newPartidas[index].isExpanded;
    setFormData(prev => ({ ...prev, partidas: newPartidas }));
  };

  const handleSubmit = async () => {
    if (!formData.nombre) {
      toast({ variant: 'destructive', title: 'Error', description: 'El nombre es obligatorio.' });
      return;
    }

    setLoading(true);
    try {
      // 1. Create Template
      const template = await plantillasService.createPlantilla({
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        categoria: formData.categoria,
        icono: formData.icono
      });

      // 2. Create Nested Items
      for (let i = 0; i < formData.partidas.length; i++) {
        const p = formData.partidas[i];
        if (!p.nombre) continue;

        const createdPartida = await plantillasService.createPlantillaPartida(template.id, {
          nombre: p.nombre,
          presupuesto_base: p.presupuesto_base,
          orden: i + 1
        });

        for (let j = 0; j < p.sub_partidas.length; j++) {
          const s = p.sub_partidas[j];
          if (!s.nombre) continue;

          await plantillasService.createPlantillaSubPartida(createdPartida.id, {
            nombre: s.nombre,
            presupuesto_base: s.presupuesto_base,
            orden: j + 1
          });
        }
      }

      toast({ title: 'Éxito', description: 'Plantilla creada correctamente.' });
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Error al guardar la plantilla.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-xl">✨</span> Nueva Plantilla de Obra
              </h3>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* General Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="space-y-2">
                  <Label>Nombre de la Plantilla <span className="text-red-500">*</span></Label>
                  <Input 
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Ej. Construcción de Piscina"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white dark:bg-slate-950 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.categoria}
                    onChange={(e) => {
                      const cat = CATEGORIES.find(c => c.value === e.target.value);
                      setFormData({...formData, categoria: e.target.value, icono: cat?.icon || '📋'})
                    }}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Descripción</Label>
                  <Input 
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    placeholder="Breve descripción del alcance..."
                  />
                </div>
              </div>

              {/* Partidas Builder */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Estructura de Partidas</h4>
                  <Button size="sm" onClick={addPartida} variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                    <Plus className="w-4 h-4 mr-2" /> Agregar Partida Base
                  </Button>
                </div>

                {formData.partidas.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-500">
                    <p>Agrega partidas para definir la estructura de la plantilla.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.partidas.map((partida, pIndex) => (
                      <div key={partida.tempId} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                        {/* Partida Header */}
                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800">
                          <button onClick={() => togglePartidaExpand(pIndex)} className="text-slate-400 hover:text-slate-600">
                            {partida.isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                             <Input 
                                placeholder="Nombre Partida (ej. Cimientos)" 
                                value={partida.nombre}
                                onChange={(e) => updatePartida(pIndex, 'nombre', e.target.value)}
                                className="h-9"
                             />
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removePartida(pIndex)}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {/* Sub-Partidas Area */}
                        {partida.isExpanded && (
                          <div className="p-4 bg-slate-50/50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 pl-10">
                            <div className="space-y-2 mb-3">
                              {partida.sub_partidas.map((sub, sIndex) => (
                                <div key={sub.tempId} className="flex items-center gap-2">
                                  <div className="w-6 border-b-2 border-slate-200 dark:border-slate-700 h-1/2"></div>
                                  <Input 
                                    placeholder="Nombre Sub-partida" 
                                    value={sub.nombre}
                                    onChange={(e) => updateSubPartida(pIndex, sIndex, 'nombre', e.target.value)}
                                    className="flex-1 h-8 text-sm"
                                  />
                                  <button onClick={() => removeSubPartida(pIndex, sIndex)} className="text-slate-400 hover:text-red-500 p-1">
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => addSubPartida(pIndex)}
                              className="text-xs text-slate-500 hover:text-blue-600 ml-8 h-7"
                            >
                              <Plus className="w-3 h-3 mr-1" /> Agregar Sub-partida
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
              <Button onClick={handleSubmit} loading={loading} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" /> Guardar Plantilla
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreatePlantillaModal;
