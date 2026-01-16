
import React, { useState } from 'react';
import { 
  Loader2, Edit2, Copy, Trash2, CheckCircle2, Clock, 
  TrendingUp, TrendingDown 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { formatCurrencyARS, formatDate } from '@/lib/formatUtils';
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal';
import EditMovementModal from '@/components/modals/EditMovementModal';
import DuplicateMovementModal from '@/components/modals/DuplicateMovementModal';
import { cn } from '@/lib/utils';

const TablaMovimientosInversion = ({ 
  proyectoId, 
  movimientos = [], 
  loading = false, 
  onRefresh 
}) => {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState(null);
  
  // Edit/Duplicate State
  const [selectedMov, setSelectedMov] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'edit', 'duplicate', null

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleDeleteClick = (id) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    setDeletingId(itemToDelete);
    setIsDeleteModalOpen(false);

    try {
      const { error } = await supabase
        .from('inversiones')
        .delete()
        .eq('id', itemToDelete);

      if (error) throw error;

      toast({ title: "Movimiento eliminado", className: "bg-green-50" });
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error al eliminar", description: error.message });
    } finally {
      setDeletingId(null);
      setItemToDelete(null);
    }
  };

  const handleEdit = (mov) => {
    setSelectedMov(mov);
    setModalMode('edit');
  };

  const handleDuplicate = (mov) => {
    setSelectedMov(mov);
    setModalMode('duplicate');
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedMov(null);
  };

  const handleSaveModal = () => {
    if (onRefresh) onRefresh();
    handleCloseModal();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Cargando movimientos...
      </div>
    );
  }

  if (!movimientos.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-900/50">
        <p>No hay inversiones registradas para este proyecto.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-medium border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Descripción</th>
              <th className="px-4 py-3 text-left">Inversionista</th>
              <th className="px-4 py-3 text-center">Tipo</th>
              <th className="px-4 py-3 text-right">Monto</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {movimientos.map((mov) => {
              const isConfirmed = mov.estado === 'CONFIRMADO';
              const isInversion = mov.tipo === 'INVERSION';
              
              return (
                <tr key={mov.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {formatDate(mov.fecha)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {mov.descripcion}
                    {mov.cuentas && (
                      <div className="text-xs text-slate-400 font-normal mt-0.5">
                        {mov.cuentas.titulo}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {mov.inversionistas?.nombre || '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border",
                      isInversion 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                        : "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800"
                    )}>
                      {isInversion 
                        ? <TrendingUp className="w-3 h-3" /> 
                        : <TrendingDown className="w-3 h-3" />
                      }
                      {isInversion ? 'Aporte' : 'Devolución'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                    {formatCurrencyARS(mov.monto_ars)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isConfirmed ? (
                      <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400" title="Confirmado">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-amber-500 dark:text-amber-400" title="Pendiente">
                        <Clock className="w-4 h-4" />
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-blue-600"
                        onClick={() => handleEdit(mov)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                        onClick={() => handleDuplicate(mov)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-red-600"
                        disabled={deletingId === mov.id}
                        onClick={() => handleDeleteClick(mov.id)}
                      >
                        {deletingId === mov.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <EditMovementModal
        isOpen={modalMode === 'edit'}
        onClose={handleCloseModal}
        movement={selectedMov}
        onSave={handleSaveModal}
      />

      <DuplicateMovementModal
        isOpen={modalMode === 'duplicate'}
        onClose={handleCloseModal}
        movement={selectedMov}
        onSave={handleSaveModal}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Movimiento"
        description="¿Estás seguro de que deseas eliminar este movimiento de inversión? Esta acción no se puede deshacer."
      />
    </>
  );
};

export default TablaMovimientosInversion;
