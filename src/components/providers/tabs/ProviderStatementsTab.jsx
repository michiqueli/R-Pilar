import React, { useState, useEffect, useCallback } from 'react';
import { Plus, FileText, Trash2, Download, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import ProviderStatementModal from '@/components/providers/modals/ProviderStatementModal';

const ProviderStatementsTab = ({ providerId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Función para cargar los datos (independiente)
  const fetchStatements = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('provider_statements')
        .select('*')
        .eq('provider_id', providerId)
        .order('statement_month', { ascending: false });

      if (error) throw error;
      setStatements(data || []);
    } catch (error) {
      console.error("Error al cargar resúmenes:", error);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    if (providerId) fetchStatements();
  }, [providerId, fetchStatements]);

  // Función para eliminar (Registro + Archivo en Storage)
  const handleDelete = async (statement) => {
    if (!window.confirm('¿Estás seguro de eliminar este resumen?')) return;

    try {
      // 1. Si tiene archivo, lo borramos del Storage
      if (statement.file_url) {
        // Extraemos el path del URL público
        const path = statement.file_url.split('/public/provider_documents/')[1];
        if (path) {
          await supabase.storage.from('provider_documents').remove([path]);
        }
      }

      // 2. Borramos el registro de la tabla
      const { error } = await supabase
        .from('provider_statements')
        .delete()
        .eq('id', statement.id);

      if (error) throw error;

      toast({ title: 'Eliminado', description: 'El resumen ha sido borrado.' });
      fetchStatements(); // Refrescar lista
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const formatMonthYear = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pt-2">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Resúmenes y Cuentas Corrientes</h3>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 px-6"
        >
          <Plus className="w-4 h-4 mr-2" /> Subir Resumen
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      ) : statements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
          <FileText className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">No hay estados de cuenta disponibles</p>
          <p className="text-sm text-slate-400">Sube los PDFs mensuales para tener un respaldo.</p>
        </div>
      ) : (
        <div className="overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Período</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Notas</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {statements.map((statement, index) => (
                <motion.tr
                  key={statement.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-blue-600">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block font-bold text-slate-900 dark:text-white capitalize text-sm">
                          {formatMonthYear(statement.statement_month)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {statement.statement_month}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                    {statement.notes || <span className="italic opacity-50">Sin observaciones</span>}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      {statement.file_url && (
                        <Button 
                          variant="ghost" 
                          size="iconSm"
                          className="rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600"
                          asChild
                        >
                          <a href={statement.file_url} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="iconSm"
                        className="rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600"
                        onClick={() => handleDelete(statement)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProviderStatementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchStatements} // Refresca esta misma pestaña al terminar
        providerId={providerId}
      />
    </div>
  );
};

export default ProviderStatementsTab;