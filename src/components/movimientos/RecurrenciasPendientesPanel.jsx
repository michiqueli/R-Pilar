import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { recurrenciaService } from '@/services/recurrenciaService';
import { formatCurrencyARS, formatDate } from '@/lib/formatUtils';
import { cn } from '@/lib/utils';
import {
  Repeat, CheckCircle2, XCircle, Loader2,
  AlertCircle, Calendar, ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Panel de recurrencias pendientes. Se muestra en la página de Tesorería
 * para que el usuario confirme o omita pagos programados.
 */
const RecurrenciasPendientesPanel = ({ onRefresh }) => {
  const { toast } = useToast();
  const [pendientes, setPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const fetchPendientes = async () => {
    setLoading(true);
    try {
      const data = await recurrenciaService.getPendientes(10);
      setPendientes(data);
    } catch (error) {
      console.error('Error loading recurrencias:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendientes();
  }, []);

  const handleConfirmar = async (recurrenciaId) => {
    setActionId(recurrenciaId);
    try {
      await recurrenciaService.confirmarRecurrencia(recurrenciaId);
      toast({
        title: 'Pago Confirmado',
        description: 'Se generó el movimiento correspondiente.',
        className: 'bg-green-50 border-green-200'
      });
      fetchPendientes();
      onRefresh?.();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setActionId(null);
    }
  };

  const handleOmitir = async (recurrenciaId) => {
    setActionId(recurrenciaId);
    try {
      await recurrenciaService.omitirRecurrencia(recurrenciaId);
      toast({
        title: 'Pago Omitido',
        description: 'Esta ocurrencia no generará movimiento.',
        className: 'bg-amber-50 border-amber-200'
      });
      fetchPendientes();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setActionId(null);
    }
  };

  // Si no hay pendientes y terminó de cargar, no mostrar nada
  if (!loading && pendientes.length === 0) return null;

  return (
    <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-white to-purple-50/50 dark:from-slate-900 dark:to-purple-950/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-purple-100 dark:border-purple-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
            <Repeat className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Pagos Recurrentes Pendientes
            </h3>
            <p className="text-[10px] text-slate-400">
              Confirmá o dejá pendiente estos pagos programados
            </p>
          </div>
        </div>
        <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50 text-xs font-bold">
          {pendientes.length}
        </Badge>
      </div>

      {/* Content */}
      <div className="divide-y divide-purple-100/50 dark:divide-purple-900/50">
        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
          </div>
        ) : (
          <AnimatePresence>
            {pendientes.map((rec) => {
              const mov = rec.movimiento_origen;
              const isProcessing = actionId === rec.id;

              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, height: 0 }}
                  className={cn(
                    'flex items-center justify-between px-5 py-3 transition-opacity',
                    isProcessing && 'opacity-50 pointer-events-none'
                  )}
                >
                  {/* Left: Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {mov?.descripcion || 'Pago recurrente'}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>Programado: {formatDate(rec.fecha_programada)}</span>
                        {mov?.cuentas?.titulo && (
                          <>
                            <span>•</span>
                            <span>{mov.cuentas.titulo}</span>
                          </>
                        )}
                        {mov?.projects?.name && (
                          <>
                            <span>•</span>
                            <span>{mov.projects.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Center: Amount */}
                  <div className="font-mono font-bold text-sm text-slate-700 dark:text-slate-200 px-4">
                    {formatCurrencyARS(mov?.monto_ars || 0)}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-3 text-xs text-slate-500 hover:text-red-600 gap-1"
                      onClick={() => handleOmitir(rec.id)}
                      disabled={isProcessing}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Omitir
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 px-3 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-full gap-1"
                      onClick={() => handleConfirmar(rec.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <CheckCircle2 className="w-3.5 h-3.5" />
                      }
                      Confirmar
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </Card>
  );
};

export default RecurrenciasPendientesPanel;
