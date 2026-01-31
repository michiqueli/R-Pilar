import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/ThemeProvider';
import { Button } from '@/components/ui/Button';
import usePageTitle from '@/hooks/usePageTitle';

// Components
import CuentasKPIs from '@/components/cuentas/CuentasKPIs';
import CuentasCards from '@/components/cuentas/CuentasCards';
import CuentaModal from '@/components/cuentas/CuentaModal';
import SearchBar from '@/components/common/SearchBar';

const CuentasPage = () => {
  usePageTitle('Cuentas y Caja');
  const { t } = useTheme();
  const { toast } = useToast();

  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCuenta, setSelectedCuenta] = useState(null);
  const [proyecciones, setProyecciones] = useState({ pagos: 0, ingresos: 0 });

  const loadCuentas = async () => {
    try {
      setLoading(true);

      // 1. Traemos la lista de cuentas (sin propiedad saldo)
      const { data: accountsData, error: accError } = await supabase
        .from('cuentas')
        .select('*')
        .eq('is_deleted', false)
        .order('titulo', { ascending: true });

      if (accError) throw accError;

      // 2. Traemos todos los movimientos confirmados de la tabla inversiones
      // Solo necesitamos monto, a qué cuenta pertenece y el tipo (para saber si suma o resta)
      // 2. Traer TODOS los movimientos (Confirmados para saldo, Pendientes para próximos)
      const { data: movs, error: movError } = await supabase
        .from('inversiones')
        .select('monto_ars, cuenta_id, tipo, estado, fecha')
        .eq('is_deleted', false);

      if (movError) throw movError;

      // 3. Procesar Cuentas y Totales
      let proximoGastoTotal = 0;
      let proximoIngresoTotal = 0;

      const processed = accountsData.map(cuenta => {
        const movimientosCuenta = (movs || []).filter(m => m.cuenta_id === cuenta.id);

        // Saldo Real (Solo lo confirmado)
        const saldo = movimientosCuenta
          .filter(m => m.estado === 'CONFIRMADO')
          .reduce((acc, m) => {
            const esSalida = m.tipo === 'GASTO' || m.tipo === 'DEVOLUCION_INVERSION';
            return esSalida ? acc - Number(m.monto_ars) : acc + Number(m.monto_ars);
          }, 0);

        // Proyecciones (Solo lo pendiente de esta cuenta para el KPI general)
        movimientosCuenta
          .filter(m => m.estado === 'PENDIENTE')
          .forEach(m => {
            const monto = Number(m.monto_ars);
            if (m.tipo === 'GASTO') proximoGastoTotal += monto;
            if (m.tipo === 'INGRESO' || m.tipo === 'INVERSION') proximoIngresoTotal += monto;
          });

        return {
          ...cuenta,
          saldo_calculado: saldo,
          tiene_pendientes: movimientosCuenta.some(m => m.estado === 'PENDIENTE')
        };
      });

      setCuentas(processed);
      setProyecciones({ pagos: proximoGastoTotal, ingresos: proximoIngresoTotal });
    } catch (error) {
      console.error("Error calculando saldos:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron calcular los saldos de las cuentas' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCuentas();
  }, []);

  // Búsqueda por Titulo o banco
  const filteredCuentas = useMemo(() => {
    if (!searchTerm) return cuentas;
    const lowerTerm = searchTerm.toLowerCase();
    return cuentas.filter(c =>
      c.titulo?.toLowerCase().includes(lowerTerm) ||
      c.estado?.toLowerCase().includes(lowerTerm)
    );
  }, [cuentas, searchTerm]);

  return (
    <>
      <div className="min-h-screen p-6 md:p-8 bg-slate-50/50 dark:bg-[#111827] transition-colors duration-200">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto space-y-8"
        >
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-[32px] font-bold text-[#1F2937] dark:text-white leading-tight">Cuentas</h1>
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm px-2.5 py-0.5 rounded-full font-bold">
                {cuentas.length}
              </span>
            </div>

            <Button
              onClick={() => { setSelectedCuenta(null); setIsModalOpen(true); }}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 shadow-lg shadow-blue-500/20 h-11"
            >
              <Plus className="w-5 h-5 mr-2" /> Nueva Cuenta
            </Button>
          </div>

          {/* KPIs: Pasamos las cuentas con su saldo ya calculado */}
          <CuentasKPIs cuentas={cuentas} proyecciones={proyecciones} loading={loading} />

          {/* Search Bar */}
          <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar cuenta..."
              className="w-full border-none shadow-none bg-transparent"
            />
          </div>

          {/* Grid de Tarjetas de Cuentas */}
          <CuentasCards
            cuentas={filteredCuentas}
            loading={loading}
            onEdit={(c) => { setSelectedCuenta(c); setIsModalOpen(true); }}
            onDelete={async (c) => {
              if (!confirm('¿Eliminar cuenta?')) return;
              await supabase.from('cuentas').update({ is_deleted: true }).eq('id', c.id);
              loadCuentas();
            }}
          />

        </motion.div>
      </div>

      <CuentaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadCuentas}
        cuenta={selectedCuenta}
      />
    </>
  );
};

export default CuentasPage;