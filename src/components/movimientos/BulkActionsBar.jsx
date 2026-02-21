import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useToast } from '@/components/ui/use-toast';
import { importMovimientosService } from '@/services/importMovimientosService';
import { cn } from '@/lib/utils';
import {
  X, CheckSquare, Landmark, Briefcase, Trash2,
  Loader2, CheckCircle2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Barra flotante de acciones masivas para movimientos seleccionados.
 * Aparece cuando hay checkboxes marcados en la tabla.
 * 
 * Props:
 *  - selectedIds: string[] - IDs de movimientos seleccionados
 *  - onClear: () => void - Limpia selección
 *  - onRefresh: () => void - Refresca tabla
 *  - accounts: Array<{ id, titulo }>
 *  - projects: Array<{ id, name }>
 */
const BulkActionsBar = ({
  selectedIds = [],
  onClear,
  onRefresh,
  accounts = [],
  projects = []
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState(null); // 'cuenta' | 'proyecto' | 'estado' | 'delete'

  const count = selectedIds.length;
  if (count === 0) return null;

  const handleBulkUpdate = async (updateData, successMsg) => {
    setLoading(true);
    try {
      const result = await importMovimientosService.bulkUpdate(selectedIds, updateData);
      toast({
        title: successMsg,
        description: `Se actualizaron ${result.count} movimientos.`,
        className: 'bg-green-50 border-green-200'
      });
      onClear();
      onRefresh();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`¿Eliminar ${count} movimientos seleccionados? Esta acción no se puede deshacer.`)) return;

    setLoading(true);
    try {
      await importMovimientosService.bulkUpdate(selectedIds, { is_deleted: true });
      toast({
        title: 'Eliminados',
        description: `Se eliminaron ${count} movimientos.`,
        className: 'bg-green-50 border-green-200'
      });
      onClear();
      onRefresh();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  };

  const handleConfirmarTodos = () => {
    handleBulkUpdate({ estado: 'CONFIRMADO' }, 'Movimientos Confirmados');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      >
        <div className={cn(
          'flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border',
          'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700',
          loading && 'opacity-80 pointer-events-none'
        )}>
          {/* Count Badge */}
          <div className="flex items-center gap-2 pr-3 border-r border-slate-200 dark:border-slate-700">
            <CheckSquare className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {count} seleccionado{count !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Action: Change Account */}
          {activeAction === 'cuenta' ? (
            <div className="flex items-center gap-2">
              <Select onValueChange={(val) => handleBulkUpdate({ cuenta_id: val }, 'Cuenta Actualizada')}>
                <SelectTrigger className="h-8 w-48 text-xs">
                  <SelectValue placeholder="Seleccionar cuenta..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.titulo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setActiveAction(null)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setActiveAction('cuenta')}
            >
              <Landmark className="w-3.5 h-3.5" /> Cambiar Cuenta
            </Button>
          )}

          {/* Action: Change Project */}
          {activeAction === 'proyecto' ? (
            <div className="flex items-center gap-2">
              <Select onValueChange={(val) => handleBulkUpdate({ proyecto_id: val === 'none' ? null : val }, 'Proyecto Actualizado')}>
                <SelectTrigger className="h-8 w-48 text-xs">
                  <SelectValue placeholder="Seleccionar proyecto..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin proyecto</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setActiveAction(null)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setActiveAction('proyecto')}
            >
              <Briefcase className="w-3.5 h-3.5" /> Cambiar Proyecto
            </Button>
          )}

          {/* Action: Confirm All */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-green-600 hover:text-green-700"
            onClick={handleConfirmarTodos}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar
          </Button>

          {/* Action: Delete */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-red-600 hover:text-red-700"
            onClick={handleBulkDelete}
          >
            <Trash2 className="w-3.5 h-3.5" /> Eliminar
          </Button>

          {/* Divider + Close */}
          <div className="pl-2 border-l border-slate-200 dark:border-slate-700">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClear}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Loading Spinner */}
          {loading && (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 absolute right-3" />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BulkActionsBar;
