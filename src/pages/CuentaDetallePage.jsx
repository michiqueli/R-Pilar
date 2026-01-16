
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    ArrowLeft, Wallet, CreditCard, Banknote, Edit2, TrendingUp, TrendingDown, 
    AlertTriangle, Activity, Plus, Loader2 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/ThemeProvider';
import { cuentaService } from '@/services/cuentaService';
import { investmentService } from '@/services/investmentService';
import { movimientoService } from '@/services/movimientoService';
import usePageTitle from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/Button';
import { formatCurrencyARS, formatCurrencyUSD } from '@/lib/formatUtils';
import { formatDate } from '@/lib/dateUtils';
import CuentaModal from '@/components/cuentas/CuentaModal';

const CuentaDetallePage = () => {
  const { cuenta_id } = useParams();
  const navigate = useNavigate();
  const { t } = useTheme();
  const { toast } = useToast();
  usePageTitle('Detalle de Cuenta');

  // State
  const [cuenta, setCuenta] = useState(null);
  const [kpis, setKpis] = useState({ totalIngresado: 0, totalGastos: 0, mayorGasto: 0, cantMovimientos: 0 });
  const [loading, setLoading] = useState(true);
  
  // Movements State
  const [movements, setMovements] = useState([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch Account Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [cuentaData, kpisData] = await Promise.all([
        cuentaService.getCuentaById(cuenta_id),
        investmentService.getAccountKPIs(cuenta_id)
      ]);

      if (!cuentaData) throw new Error('Cuenta not found');

      setCuenta(cuentaData);
      setKpis(kpisData);
      
      // Load movements after account data is safe
      loadMovements();

    } catch (error) {
      console.error("Error fetching account details:", error);
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('cuentas.notFound')
      });
      navigate('/cuentas');
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async () => {
     try {
        setMovementsLoading(true);
        const data = await movimientoService.getAccountMovements(cuenta_id);
        setMovements(data);
     } catch (error) {
        console.error("Error loading movements:", error);
        toast({
           variant: 'destructive',
           title: t('common.error'),
           description: t('finanzas.errorLoadingMovements')
        });
     } finally {
        setMovementsLoading(false);
     }
  };

  useEffect(() => {
    if (cuenta_id) {
      fetchData();
    }
  }, [cuenta_id]);

  const getIcon = (tipo) => {
     switch(tipo?.toLowerCase()) {
        case 'banco': return CreditCard;
        case 'efectivo': return Banknote;
        default: return Wallet;
     }
  };
  
  const getBadgeStyle = (type, tipoMovimiento) => {
      // Logic for movement type colors
      if (tipoMovimiento === 'INVERSION' || type === 'INVERSION') {
          return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-900';
      }
      if (tipoMovimiento === 'DEVOLUCION' || type === 'DEVOLUCION') {
          return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-900';
      }
      if (type === 'INGRESO' || tipoMovimiento === 'INGRESO') {
          return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900';
      }
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900';
  };
  
  const getStatusBadge = (status) => {
      if (status === 'CONFIRMADO' || status === 'PAGADO' || status === 'COBRADO') {
          return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
             {status}
          </span>;
      }
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
         {status || 'PENDIENTE'}
      </span>;
  };

  if (loading && !cuenta) {
    return (
      <div className="min-h-screen p-6 md:p-8 bg-slate-50/50 dark:bg-[#111827] flex items-center justify-center">
         <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-slate-200 dark:bg-slate-800 rounded-full mb-4"></div>
            <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
         </div>
      </div>
    );
  }

  const Icon = getIcon(cuenta?.tipo);

  return (
    <>
      <div className="min-h-screen p-6 md:p-8 bg-slate-50/50 dark:bg-[#111827] transition-colors duration-200 font-sans">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto space-y-8"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/cuentas')}
                className="rounded-full h-10 w-10 p-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-blue-600 dark:text-blue-400">
                    <Icon className="w-6 h-6" />
                 </div>
                 <div>
                    <h1 className="text-2xl font-bold text-[#1F2937] dark:text-white leading-tight">
                      {cuenta?.titulo}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {cuenta?.tipo}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        cuenta?.estado === 'activa' 
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400' 
                          : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                         {cuenta?.estado}
                      </span>
                    </div>
                 </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(true)}
                className="gap-2"
              >
                <Edit2 className="w-4 h-4" />
                {t('common.edit')}
              </Button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                   <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('finanzas.totalIngresado')}</p>
                   <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrencyARS(kpis.totalIngresado)}</h3>
             </div>
             
             <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                   <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('finanzas.totalGastos')}</p>
                   <TrendingDown className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrencyARS(kpis.totalGastos)}</h3>
             </div>
             
             <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                   <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('finanzas.mayorGasto')}</p>
                   <AlertTriangle className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatCurrencyARS(kpis.mayorGasto)}</h3>
             </div>
             
             <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                   <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('finanzas.cantMovimientos')}</p>
                   <Activity className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{kpis.cantMovimientos}</h3>
             </div>
          </div>

          {/* Movements Section */}
          <div className="space-y-4">
              <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                     <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                     {t('cuentas.movimientos')}
                  </h2>
                  <Button 
                     onClick={() => navigate(`/movements/new?cuenta_id=${cuenta_id}`)}
                     className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4"
                  >
                     <Plus className="w-4 h-4 mr-2" />
                     {t('movimientos.new_movimiento')}
                  </Button>
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">
                           <tr>
                              <th className="px-4 py-3 whitespace-nowrap">{t('common.type')}</th>
                              <th className="px-4 py-3">{t('common.description')}</th>
                              <th className="px-4 py-3 whitespace-nowrap">{t('projects.title')}</th>
                              <th className="px-4 py-3 whitespace-nowrap">{t('common.date')}</th>
                              <th className="px-4 py-3 whitespace-nowrap">{t('common.provider')} / {t('finanzas.inversor')}</th>
                              <th className="px-4 py-3 text-right whitespace-nowrap">{t('finanzas.montoARS')}</th>
                              <th className="px-4 py-3 text-right whitespace-nowrap">{t('finanzas.valorUSD')}</th>
                              <th className="px-4 py-3 text-right whitespace-nowrap">{t('finanzas.montoUSD')}</th>
                              <th className="px-4 py-3 text-right whitespace-nowrap">{t('finanzas.iva')}</th>
                              <th className="px-4 py-3 text-right whitespace-nowrap">{t('finanzas.neto')}</th>
                              <th className="px-4 py-3 text-center whitespace-nowrap">{t('common.status')}</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                           {movementsLoading ? (
                              <tr>
                                 <td colSpan="11" className="px-4 py-12 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                                       <Loader2 className="w-6 h-6 animate-spin" />
                                       <p>{t('common.loading')}...</p>
                                    </div>
                                 </td>
                              </tr>
                           ) : movements.length === 0 ? (
                              <tr>
                                 <td colSpan="11" className="px-4 py-12 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                       <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                          <Activity className="w-6 h-6" />
                                       </div>
                                       <div className="text-center">
                                          <p className="text-slate-900 dark:text-white font-medium">{t('finanzas.noMovimientos')}</p>
                                          <p className="text-slate-500 text-xs mt-1">{t('finanzas.creaPrimerMovimiento')}</p>
                                       </div>
                                       <Button 
                                          variant="outline" 
                                          size="sm" 
                                          onClick={() => navigate(`/movements/new?cuenta_id=${cuenta_id}`)}
                                          className="mt-2"
                                       >
                                          {t('movimientos.new_movimiento')}
                                       </Button>
                                    </div>
                                 </td>
                              </tr>
                           ) : (
                              movements.map((mov) => (
                                 <tr key={mov.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getBadgeStyle(mov.type, mov.tipo_movimiento)}`}>
                                          {mov.tipo_movimiento || mov.type}
                                       </span>
                                    </td>
                                    <td className="px-4 py-3">
                                       <p className="text-slate-900 dark:text-white font-medium truncate max-w-[200px]" title={mov.description}>
                                          {mov.description}
                                       </p>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                                       {mov.projects?.name || '-'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-xs">
                                       {formatDate(mov.date)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                                       {mov.responsibleName || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap font-mono font-medium text-slate-900 dark:text-white">
                                       {formatCurrencyARS(mov.amount_ars || mov.amount)}
                                    </td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap font-mono text-slate-500 text-xs">
                                       {formatCurrencyARS(mov.fx_rate)}
                                    </td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
                                       {formatCurrencyUSD(mov.usd_amount)}
                                    </td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap font-mono text-slate-500 text-xs">
                                       {formatCurrencyARS(mov.vat_amount)}
                                    </td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap font-mono text-slate-600 dark:text-slate-400 font-medium">
                                       {formatCurrencyARS(mov.net_amount)}
                                    </td>
                                    <td className="px-4 py-3 text-center whitespace-nowrap">
                                       {getStatusBadge(mov.status)}
                                    </td>
                                 </tr>
                              ))
                           )}
                        </tbody>
                     </table>
                  </div>
              </div>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <CuentaModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchData}
        cuenta={cuenta}
      />
    </>
  );
};

export default CuentaDetallePage;
