
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Edit2, Trash2, ShoppingCart, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useTheme } from '@/contexts/ThemeProvider';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import usePageTitle from '@/hooks/usePageTitle';

const ComprasPage = () => {
  usePageTitle('Compras');
  const { t } = useTheme();
  const { toast } = useToast();
  
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCompras();
  }, []);

  const fetchCompras = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('compras')
        .select(`
          *,
          proveedor:providers(name)
        `)
        .eq('is_deleted', false)
        .order('fecha', { ascending: false });

      if (error) throw error;
      setCompras(data || []);
    } catch (error) {
      console.error('Error fetching compras:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las compras.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta compra?')) return;

    try {
      const { error } = await supabase
        .from('compras')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: 'Éxito', description: 'Compra eliminada correctamente.' });
      fetchCompras();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const filteredCompras = compras.filter(c => 
    c.numero?.toString().includes(searchTerm) ||
    c.proveedor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#111827] p-6 md:p-8 font-sans transition-colors duration-200">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
              {t('compras.titulo') || 'Gestión de Compras'}
            </h1>
            <p className="text-slate-500 mt-1">Administra tus órdenes de compra y gastos operativos</p>
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 shadow-md"
            onClick={() => toast({ title: "Info", description: "Funcionalidad de crear compra próximamente" })}
          >
            <Plus className="w-5 h-5 mr-2" />
            {t('compras.nueva') || 'Nueva Compra'}
          </Button>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input 
              placeholder="Buscar por número, proveedor..." 
              className="pl-10 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="border-slate-200 dark:border-slate-700">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : filteredCompras.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              <ShoppingCart className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">{t('compras.noHay') || 'No hay compras registradas'}</p>
              <p className="text-sm">Comienza creando una nueva orden de compra.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('compras.numero') || 'Número'}</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('compras.proveedor') || 'Proveedor'}</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('compras.fecha') || 'Fecha'}</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('compras.monto') || 'Monto'}</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('compras.estado') || 'Estado'}</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredCompras.map((compra) => (
                      <tr key={compra.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                          #{compra.numero}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                          {compra.proveedor?.name || 'Proveedor Desconocido'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(compra.fecha).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                          ${Number(compra.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${compra.estado === 'APROBADO' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                              compra.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                            {compra.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-red-600"
                              onClick={() => handleDelete(compra.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ComprasPage;
