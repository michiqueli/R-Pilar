
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, DollarSign, ChevronRight, ChevronDown, Layers, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { partidasService } from '@/services/partidasService';
import { formatCurrencyARS } from '@/lib/formatUtils';
import CreatePartidaModal from '@/components/projects/modals/CreatePartidaModal';
import CreateSubPartidaModal from '@/components/projects/modals/CreateSubPartidaModal';
import AsignarCosteModal from '@/components/projects/modals/AsignarCosteModal';
import SelectPlantillaModal from '@/components/projects/modals/SelectPlantillaModal';

const PartidasTab = ({ projectId }) => {
  const { toast } = useToast();
  const [partidas, setPartidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState({});
  
  // Modals State
  const [isPartidaModalOpen, setIsPartidaModalOpen] = useState(false);
  const [partidaToEdit, setPartidaToEdit] = useState(null);
  
  const [isSubPartidaModalOpen, setIsSubPartidaModalOpen] = useState(false);
  const [subPartidaToEdit, setSubPartidaToEdit] = useState(null);
  const [parentPartidaId, setParentPartidaId] = useState(null);
  
  const [isCosteModalOpen, setIsCosteModalOpen] = useState(false);
  const [costeItem, setCosteItem] = useState(null);
  const [costeType, setCosteType] = useState('partida'); // 'partida' or 'subpartida'

  // Plantillas State
  const [showSelectPlantilla, setShowSelectPlantilla] = useState(false);

  const loadPartidas = async () => {
    setLoading(true);
    try {
      const data = await partidasService.getProjectPartidas(projectId);
      setPartidas(data);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las partidas.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) loadPartidas();
  }, [projectId]);

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDeletePartida = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta partida? Se eliminarán también sus sub-partidas.')) {
      try {
        await partidasService.deletePartida(id);
        toast({ title: 'Eliminado', description: 'Partida eliminada.' });
        loadPartidas();
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la partida.' });
      }
    }
  };

  const handleDeleteSubPartida = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta sub-partida?')) {
      try {
        await partidasService.deleteSubPartida(id);
        toast({ title: 'Eliminado', description: 'Sub-partida eliminada.' });
        loadPartidas();
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la sub-partida.' });
      }
    }
  };

  const handlePlantillaSuccess = () => {
    loadPartidas();
    // Keep modal open if you want to load multiple, or close it? Requirements say close.
    // However, loading takes time, so maybe better to keep it close after success
    // Modal handles closing on its own Success callback
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    let classes = 'bg-gray-100 text-gray-800 border-gray-200';
    if (s === 'EN PROGRESO') classes = 'bg-blue-100 text-blue-800 border-blue-200';
    if (s === 'COMPLETADO') classes = 'bg-green-100 text-green-800 border-green-200';
    
    return <span className={`px-2 py-0.5 rounded-md border text-xs font-bold ${classes}`}>{s}</span>;
  };

  const getProgressColor = (pct) => {
    if (pct >= 100) return 'bg-green-500';
    if (pct > 66) return 'bg-blue-500';
    if (pct > 33) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getDiffColor = (diff) => {
    if (diff > 0) return 'text-green-600';
    if (diff < 0) return 'text-red-600';
    return 'text-slate-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" />
          Control de Partidas
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSelectPlantilla(true)} className="gap-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
             <RefreshCw className="w-4 h-4" /> Cargar Plantilla
          </Button>
          <Button onClick={() => { setPartidaToEdit(null); setIsPartidaModalOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Nueva Partida
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500 font-semibold">
              <tr>
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3">Nombre / Descripción</th>
                <th className="px-4 py-3 text-right">Presupuesto</th>
                <th className="px-4 py-3 text-right">Coste Asignado</th>
                <th className="px-4 py-3 text-right">Diferencia</th>
                <th className="px-4 py-3 w-32">Progreso</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="8" className="p-8 text-center text-slate-500">Cargando partidas...</td></tr>
              ) : partidas.length === 0 ? (
                <tr>
                   <td colSpan="8" className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                         <Layers className="w-12 h-12 text-slate-200" />
                         <p className="text-slate-500 font-medium">No hay partidas creadas</p>
                         <div className="flex gap-3 mt-2">
                            <Button variant="outline" size="sm" onClick={() => setShowSelectPlantilla(true)}>Cargar Plantilla</Button>
                            <Button size="sm" onClick={() => setIsPartidaModalOpen(true)}>Crear Manualmente</Button>
                         </div>
                      </div>
                   </td>
                </tr>
              ) : (
                partidas.map(partida => {
                  const diff = partida.presupuesto - partida.coste_asignado;
                  const isExpanded = expandedRows[partida.id];
                  return (
                    <React.Fragment key={partida.id}>
                      {/* Parent Row */}
                      <tr className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => toggleRow(partida.id)} className="p-1 rounded hover:bg-slate-200 text-slate-400">
                             {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                           <div className="font-bold text-slate-900 dark:text-white">{partida.nombre}</div>
                           {partida.descripcion && <div className="text-xs text-slate-500 truncate max-w-xs">{partida.descripcion}</div>}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                           {formatCurrencyARS(partida.presupuesto)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                           {formatCurrencyARS(partida.coste_asignado)}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${getDiffColor(diff)}`}>
                           {formatCurrencyARS(diff)}
                        </td>
                        <td className="px-4 py-3">
                           <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                 <div 
                                    className={`h-full ${getProgressColor(partida.progreso)} transition-all duration-500`} 
                                    style={{ width: `${partida.progreso}%` }} 
                                 />
                              </div>
                              <span className="text-xs font-bold w-8 text-right">{partida.progreso}%</span>
                           </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                           {getStatusBadge(partida.estado)}
                        </td>
                        <td className="px-4 py-3 text-right">
                           <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                 onClick={() => { setCosteItem(partida); setCosteType('partida'); setIsCosteModalOpen(true); }}
                                 className="p-1.5 text-green-600 hover:bg-green-50 rounded" 
                                 title="Asignar Coste"
                              >
                                 <DollarSign className="w-4 h-4" />
                              </button>
                              <button 
                                 onClick={() => { setPartidaToEdit(partida); setIsPartidaModalOpen(true); }}
                                 className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                 title="Editar"
                              >
                                 <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                 onClick={() => handleDeletePartida(partida.id)}
                                 className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                 title="Eliminar"
                              >
                                 <Trash2 className="w-4 h-4" />
                              </button>
                              <button 
                                 onClick={() => { setParentPartidaId(partida.id); setSubPartidaToEdit(null); setIsSubPartidaModalOpen(true); }}
                                 className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                                 title="Agregar Sub-partida"
                              >
                                 <Plus className="w-4 h-4" />
                              </button>
                           </div>
                        </td>
                      </tr>

                      {/* Sub-Partidas Expanded Row */}
                      <AnimatePresence>
                         {isExpanded && (
                            <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                               <td colSpan="8" className="px-0 py-0 border-b border-slate-100 dark:border-slate-800">
                                  <motion.div 
                                     initial={{ height: 0, opacity: 0 }} 
                                     animate={{ height: 'auto', opacity: 1 }} 
                                     exit={{ height: 0, opacity: 0 }}
                                     className="overflow-hidden"
                                  >
                                     <div className="pl-12 pr-4 py-4 space-y-2">
                                        {partida.sub_partidas.length === 0 ? (
                                           <div className="text-center text-xs text-slate-400 italic py-2">
                                              No hay sub-partidas. Click en + para agregar.
                                           </div>
                                        ) : (
                                           <table className="w-full text-xs">
                                              <thead className="text-slate-400 font-medium uppercase border-b border-slate-200">
                                                <tr>
                                                   <th className="py-2 text-left">Sub-partida</th>
                                                   <th className="py-2 text-right">Presupuesto</th>
                                                   <th className="py-2 text-right">Coste</th>
                                                   <th className="py-2 text-right">Dif.</th>
                                                   <th className="py-2 w-24 text-center">Prog.</th>
                                                   <th className="py-2 text-center">Est.</th>
                                                   <th className="py-2 text-right"></th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-slate-100">
                                                 {partida.sub_partidas.map(sub => {
                                                    const subDiff = sub.presupuesto - sub.coste_asignado;
                                                    return (
                                                       <tr key={sub.id} className="hover:bg-slate-100 dark:hover:bg-slate-800 group/sub">
                                                          <td className="py-2 pl-2">
                                                             <div className="font-medium text-slate-700 dark:text-slate-300">{sub.nombre}</div>
                                                          </td>
                                                          <td className="py-2 text-right text-slate-600">{formatCurrencyARS(sub.presupuesto)}</td>
                                                          <td className="py-2 text-right text-slate-600">{formatCurrencyARS(sub.coste_asignado)}</td>
                                                          <td className={`py-2 text-right font-bold ${getDiffColor(subDiff)}`}>{formatCurrencyARS(subDiff)}</td>
                                                          <td className="py-2 text-center">
                                                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                                               <div className={`h-full ${getProgressColor(sub.progreso)}`} style={{width: `${sub.progreso}%`}} />
                                                            </div>
                                                          </td>
                                                          <td className="py-2 text-center">{getStatusBadge(sub.estado)}</td>
                                                          <td className="py-2 text-right pr-2">
                                                             <div className="flex justify-end gap-1 opacity-0 group-hover/sub:opacity-100">
                                                                <button 
                                                                   onClick={() => { setCosteItem(sub); setCosteType('subpartida'); setIsCosteModalOpen(true); }}
                                                                   className="p-1 text-green-600 hover:bg-green-100 rounded"
                                                                   title="Asignar Coste"
                                                                >
                                                                   <DollarSign className="w-3 h-3" />
                                                                </button>
                                                                <button 
                                                                   onClick={() => { setParentPartidaId(partida.id); setSubPartidaToEdit(sub); setIsSubPartidaModalOpen(true); }}
                                                                   className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                                                   title="Editar"
                                                                >
                                                                   <Edit2 className="w-3 h-3" />
                                                                </button>
                                                                <button 
                                                                   onClick={() => handleDeleteSubPartida(sub.id)}
                                                                   className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                                   title="Eliminar"
                                                                >
                                                                   <Trash2 className="w-3 h-3" />
                                                                </button>
                                                             </div>
                                                          </td>
                                                       </tr>
                                                    );
                                                 })}
                                              </tbody>
                                           </table>
                                        )}
                                     </div>
                                  </motion.div>
                               </td>
                            </tr>
                         )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreatePartidaModal 
         isOpen={isPartidaModalOpen}
         onClose={() => setIsPartidaModalOpen(false)}
         onSuccess={loadPartidas}
         proyectoId={projectId}
         partidaToEdit={partidaToEdit}
      />

      <CreateSubPartidaModal 
         isOpen={isSubPartidaModalOpen}
         onClose={() => setIsSubPartidaModalOpen(false)}
         onSuccess={loadPartidas}
         partidaId={parentPartidaId}
         subPartidaToEdit={subPartidaToEdit}
      />

      <AsignarCosteModal 
         isOpen={isCosteModalOpen}
         onClose={() => setIsCosteModalOpen(false)}
         onSuccess={loadPartidas}
         item={costeItem}
         type={costeType}
      />

      <SelectPlantillaModal 
         isOpen={showSelectPlantilla}
         onClose={() => setShowSelectPlantilla(false)}
         onSuccess={handlePlantillaSuccess}
         proyectoId={projectId}
      />
    </div>
  );
};

export default PartidasTab;
