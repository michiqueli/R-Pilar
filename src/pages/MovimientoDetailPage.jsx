
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, Edit, Trash2, Calendar, User, Briefcase, DollarSign, Percent } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { useToast } from '@/components/ui/use-toast';
import { movimientoService } from '@/services/movimientoService';
import { formatDate } from '@/lib/dateUtils';
import { useTheme } from '@/contexts/ThemeProvider';
import MovimientoModal from '@/components/movimientos/MovimientoModal';
import usePageTitle from '@/hooks/usePageTitle';

function MovimientoDetailPage() {
  usePageTitle('Detalle del movimiento');
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTheme();
  const { toast } = useToast();
  
  const type = window.location.pathname.includes('expenses') ? 'gasto' : 'ingreso';
  
  const [movimiento, setMovimiento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchMovimiento = async () => {
    setLoading(true);
    try {
      const data = await movimientoService.getMovimientoById(id, type);
      setMovimiento(data);
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: 'No se encontró el movimiento.' });
      navigate('/movimientos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovimiento();
  }, [id, type]);

  const handleDelete = async () => {
    if(!window.confirm(t('messages.confirm_delete'))) return;
    try {
      await movimientoService.deleteMovimiento(movimiento.id, movimiento.type);
      toast({ title: t('common.success'), description: t('movimientos.deleted') });
      navigate('/movimientos');
    } catch (e) {
      console.error(e);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val || 0);
  const formatUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  if (loading) return <div className="p-10 text-center animate-pulse">{t('common.loading')}</div>;
  if (!movimiento) return null;

  return (
    <>
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6 md:p-10">
         <div className="max-w-4xl mx-auto">
            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-4">
               <span className="cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => navigate('/movimientos')}>
                 {t('movimientos.title')}
               </span>
               <ChevronRight className="w-4 h-4 mx-2" />
               <span className="font-medium text-slate-900 dark:text-white">{t('common.details')}</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
               <div className="border-b border-slate-100 dark:border-slate-800 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                     <div className="flex items-center gap-3 mb-2">
                        <Chip 
                          label={movimiento.type === 'ingreso' ? t('movimientos.ingreso') : t('movimientos.gasto')} 
                          variant={movimiento.type === 'ingreso' ? 'success' : 'destructive'} 
                        />
                        {movimiento.category && (
                          <Chip label={movimiento.category} variant="secondary" />
                        )}
                     </div>
                     <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{movimiento.description}</h1>
                  </div>

                  <div className="flex gap-2">
                     <Button variant="secondary" className="rounded-full" onClick={() => setIsEditOpen(true)}>
                        <Edit className="w-4 h-4 mr-2" /> {t('common.edit')}
                     </Button>
                     <Button variant="ghost" size="icon" className="rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={handleDelete}>
                        <Trash2 className="w-4 h-4" />
                     </Button>
                  </div>
               </div>

               <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-8">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                           <div className="text-xs text-slate-400 font-bold uppercase mb-1">{t('movimientos.responsable')}</div>
                           <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <User className="w-4 h-4 text-slate-500" />
                              </div>
                              <span className="font-medium text-slate-900 dark:text-white">{movimiento.responsibleName || '-'}</span>
                           </div>
                        </div>
                        <div>
                           <div className="text-xs text-slate-400 font-bold uppercase mb-1">{t('common.date')}</div>
                           <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                              <Calendar className="w-4 h-4" />
                              <span className="font-medium">{formatDate(movimiento.date)}</span>
                           </div>
                        </div>
                        <div>
                           <div className="text-xs text-slate-400 font-bold uppercase mb-1">{t('projects.title')}</div>
                           {movimiento.projects ? (
                              <div className="flex items-center gap-2 text-blue-600 cursor-pointer hover:underline" onClick={() => navigate(`/projects/${movimiento.projects.id}`)}>
                                 <Briefcase className="w-4 h-4" />
                                 <span className="font-medium">{movimiento.projects.name}</span>
                              </div>
                           ) : (
                              <span className="text-slate-500 italic">-</span>
                           )}
                        </div>
                     </div>

                     {movimiento.notes && (
                       <div className="prose prose-slate prose-sm max-w-none dark:prose-invert bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('common.notes')}</h3>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap m-0">
                             {movimiento.notes}
                          </p>
                       </div>
                     )}

                     <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                            <h3 className="font-bold text-slate-900 dark:text-white">Moneda y Cálculo</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <div className="text-xs text-slate-400 font-bold uppercase mb-1">Monto (ARS)</div>
                                <div className="text-xl font-bold text-slate-900 dark:text-white">
                                  {formatCurrency(movimiento.amount_ars || movimiento.amount)}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 font-bold uppercase mb-1">Valor USD</div>
                                <div className="text-xl font-bold text-slate-900 dark:text-white">
                                  {formatCurrency(movimiento.fx_rate).replace('$', 'U$ ')}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 font-bold uppercase mb-1">Monto (USD)</div>
                                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                  {formatUSD(movimiento.usd_equivalent || (movimiento.amount_ars / (movimiento.fx_rate || 1)))}
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 text-sm">
                               <h4 className="font-bold text-slate-700 dark:text-slate-300">IVA Inteligente</h4>
                               <div className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-medium text-slate-600 dark:text-slate-400">
                                 {movimiento.vat_included ? 'IVA Incluido' : 'IVA No Incluido'}
                               </div>
                               <div className="flex items-center gap-1 text-slate-500">
                                  <Percent className="w-3 h-3" />
                                  <span>{movimiento.vat_percent || 0}%</span>
                               </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                               <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex flex-col items-center">
                                  <span className="text-[10px] uppercase font-bold text-slate-500 mb-1">Neto</span>
                                  <span className="text-base font-bold text-slate-700 dark:text-slate-300">
                                    {formatCurrency(movimiento.net_amount)}
                                  </span>
                               </div>
                               <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-200 dark:border-yellow-800 p-3 flex flex-col items-center">
                                  <span className="text-[10px] uppercase font-bold text-yellow-600 dark:text-yellow-500 mb-1">IVA</span>
                                  <span className="text-base font-bold text-yellow-700 dark:text-yellow-400">
                                    {formatCurrency(movimiento.vat_amount)}
                                  </span>
                               </div>
                               <div className="bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-800 p-3 flex flex-col items-center">
                                  <span className="text-[10px] uppercase font-bold text-green-600 dark:text-green-500 mb-1">Total</span>
                                  <span className="text-base font-bold text-green-700 dark:text-green-400">
                                    {formatCurrency(movimiento.amount)}
                                  </span>
                               </div>
                            </div>
                        </div>
                     </div>
                  </div>
                  
                  <div className="space-y-6">
                     <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                        <div>
                           <div className="text-xs text-slate-400 font-bold uppercase mb-1">Creado</div>
                           <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(movimiento.created_at).toLocaleDateString()}</span>
                           </div>
                        </div>
                        <div>
                           <div className="text-xs text-slate-400 font-bold uppercase mb-1">Estado</div>
                           <Chip 
                             label={movimiento.status || 'Completado'} 
                             variant={movimiento.status === 'PENDIENTE' ? 'warning' : 'success'} 
                             size="sm"
                           />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <MovimientoModal 
         isOpen={isEditOpen}
         onClose={() => setIsEditOpen(false)}
         onSuccess={() => {
           fetchMovimiento();
           setIsEditOpen(false);
         }}
         movimiento={movimiento}
      />
    </>
  );
}

export default MovimientoDetailPage;
