
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Phone, ArrowLeft, Edit2, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/ThemeProvider';
import { investorService } from '@/services/investorService';
import { movimientoService } from '@/services/movimientoService'; 
import { formatCurrencyARS } from '@/lib/formatUtils';
import InvestorModal from '@/components/investors/InvestorModal';
import InvestorSummaryView from '@/components/investors/InvestorSummaryView';
import InversionistaMovimientosTab from '@/components/inversionistas/tabs/InversionistaMovimientosTab'; 
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import KpiCard from '@/components/ui/KpiCard';
import usePageTitle from '@/hooks/usePageTitle';
import { cn } from '@/lib/utils';

const InvestorDetailPage = () => {
  usePageTitle('Detalle del inversionista');
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTheme();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [investor, setInvestor] = useState(null);
  
  // Data States
  const [kpis, setKpis] = useState({
    totalInvertido: 0,
    totalDevuelto: 0,
    saldoNeto: 0,
  });
  
  const [movements, setMovements] = useState([]);
  const [activeTab, setActiveTab] = useState('resumen');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Implement loadData function using movimientoService for consistency
  const loadData = useCallback(async () => {
    try {
      // 1. Fetch Movements using new service
      const movementsData = await movimientoService.getInversionistaMovements(id);

      // 2. Calculate KPIs
      let totalInvertido = 0;
      let totalDevuelto = 0;

      movementsData.forEach(mov => {
        // INVERSION = Money In
        if (mov.type === 'INVERSION') totalInvertido += Number(mov.amount_ars || 0);
        // DEVOLUCION = Money Out
        if (mov.type === 'DEVOLUCION') totalDevuelto += Number(mov.amount_ars || 0);
      });

      setKpis({
        totalInvertido,
        totalDevuelto,
        saldoNeto: totalInvertido - totalDevuelto
      });

      setMovements(movementsData);

    } catch (error) {
      console.error("Error loading data:", error);
      toast({ variant: 'destructive', title: t('common.error'), description: 'Error al cargar movimientos' });
    }
  }, [id, t, toast]);

  // Initial Load
  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: inv } = await investorService.getInvestorById(id);
        if (!inv) throw new Error("Inversionista no encontrado");
        setInvestor(inv);
        await loadData();
      } catch (error) {
        toast({ variant: 'destructive', title: t('common.error'), description: 'Error al cargar detalles' });
        navigate('/inversionistas');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate, t, toast, loadData]);

  
  const handleDelete = async () => {
      if (window.confirm(t('messages.confirm_delete'))) {
          try {
              const { success, error } = await investorService.deleteInvestor(id);
              if (success) {
                  toast({ title: t('common.success'), description: 'Inversionista eliminado' });
                  navigate('/inversionistas');
              } else {
                  throw new Error(error);
              }
          } catch (e) {
              toast({ variant: 'destructive', title: t('common.error'), description: 'Error al eliminar' });
          }
      }
  };

  if (loading) return <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>;
  if (!investor) return null;

  return (
    <>
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6 md:p-8 font-sans">
         <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-[1400px] mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
               <div className="flex items-center gap-4">
                   <Button variant="ghost" className="rounded-full h-10 w-10 p-0" onClick={() => navigate('/inversionistas')}>
                      <ArrowLeft className="w-5 h-5 text-slate-500" />
                   </Button>
                   <div>
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                         {investor.nombre}
                         <span className={`text-xs px-2 py-0.5 rounded-full border ${investor.estado === 'activo' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                            {investor.estado === 'activo' ? t('common.active') : t('common.inactive')}
                         </span>
                      </h1>
                   </div>
               </div>
               <div className="flex gap-2">
                  <Button 
                     onClick={() => navigate(`/movements/new?investor_id=${investor.id}&type=INVERSION`)} 
                     className="rounded-full bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all"
                  >
                     <TrendingUp className="w-4 h-4 mr-2" /> {t('investments.ingresoInversion')}
                  </Button>
                  <Button 
                     onClick={() => navigate(`/movements/new?investor_id=${investor.id}&type=DEVOLUCION`)} 
                     className="rounded-full bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all"
                  >
                     <TrendingDown className="w-4 h-4 mr-2" /> {t('investments.devolucionInversion')}
                  </Button>
                  <Button 
                     onClick={() => setIsEditModalOpen(true)} 
                     className="rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all"
                  >
                     <Edit2 className="w-4 h-4 mr-2" /> {t('common.edit')}
                  </Button>
               </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <KpiCard
                 title={t('investments.totalInvertido')}
                 value={formatCurrencyARS(kpis.totalInvertido)}
                 icon={TrendingUp}
                 tone="emerald"
                 showBar
               />

               <KpiCard
                 title={t('investments.totalDevuelto')}
                 value={formatCurrencyARS(kpis.totalDevuelto)}
                 icon={TrendingDown}
                 tone="red"
                 showBar
               />

               <KpiCard
                 title={t('investments.saldoNeto')}
                 value={formatCurrencyARS(kpis.saldoNeto)}
                 icon={Wallet}
                 tone={kpis.saldoNeto >= 0 ? 'blue' : 'orange'}
                 valueClassName={cn(
                   kpis.saldoNeto > 0 ? "text-emerald-600 dark:text-emerald-400" :
                   kpis.saldoNeto < 0 ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-400"
                 )}
               />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
               <TabsList className="bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 rounded-xl mb-6">
                  <TabsTrigger value="resumen" className="rounded-lg data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800 px-6">
                     Resumen
                  </TabsTrigger>
                  <TabsTrigger value="movimientos" className="rounded-lg data-[state=active]:bg-cyan-100 data-[state=active]:text-cyan-800 px-6">
                     {t('investments.movimientos')}
                  </TabsTrigger>
                  <TabsTrigger value="info" className="rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-slate-800 px-6">
                     Información
                  </TabsTrigger>
               </TabsList>

               <TabsContent value="resumen" className="mt-0">
                  <InvestorSummaryView 
                     investor={investor}
                     kpis={kpis}
                     movements={movements}
                     onViewAllMovements={() => setActiveTab('movimientos')}
                     onAddMovement={() => navigate(`/movements/new?investor_id=${investor.id}&type=INVERSION`)}
                  />
               </TabsContent>

               <TabsContent value="movimientos" className="mt-0">
                  {/* Integrated InversionistaMovimientosTab */}
                  <InversionistaMovimientosTab inversionistaId={id} />
               </TabsContent>

               <TabsContent value="info" className="mt-0">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl relative">
                     <Button 
                         variant="outline" 
                         size="sm"
                         onClick={handleDelete} 
                         className="absolute top-6 right-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                     >
                         <Trash2 className="w-4 h-4 mr-2" /> Eliminar Inversionista
                     </Button>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                           <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">Nombre</label>
                              <p className="text-base font-medium text-slate-900 dark:text-white">{investor.nombre}</p>
                           </div>
                           <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">Estado</label>
                              <p className="text-base font-medium">{investor.estado === 'activo' ? t('common.active') : t('common.inactive')}</p>
                           </div>
                           <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">Notas</label>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{investor.notas || 'Sin notas adicionales.'}</p>
                           </div>
                        </div>
                        <div className="space-y-4">
                           <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-slate-400" />
                              <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase block">Email</label>
                                 <p className="text-sm font-medium">{investor.email || '-'}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-slate-400" />
                              <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase block">Teléfono</label>
                                 <p className="text-sm font-medium">{investor.telefono || '-'}</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </TabsContent>
            </Tabs>

         </motion.div>
      </div>

      <InvestorModal 
         isOpen={isEditModalOpen} 
         onClose={() => setIsEditModalOpen(false)} 
         onSuccess={() => { /* Reloading handled by parent if needed */ }} 
         investor={investor}
      />
    </>
  );
};

export default InvestorDetailPage;
