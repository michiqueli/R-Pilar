import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageHeader from '@/components/layout/PageHeader';
import CarouselMovimientos from '@/components/CarouselMovimientos';
import MovimientosTesoreriaTable from '@/components/movimientos/MovimientosTesoreriaTable';
import ViewMovementModal from '@/components/modals/ViewMovementModal';
import DeleteMovementModal from '@/components/modals/DeleteMovementModal';
import DuplicateMovementModal from '@/components/modals/DuplicateMovementModal';
import GraficoLiquidezMejorado from '@/components/GraficoLiquidezMejorado';
import RecurrenciasPendientesPanel from '@/components/movimientos/RecurrenciasPendientesPanel';
import ImportMovementsModal from '@/components/movimientos/ImportMovementsModal';
import BulkActionsBar from '@/components/movimientos/BulkActionsBar';

import KpiCard from '@/components/ui/KpiCard';
import { Button } from '@/components/ui/Button';
import { Clock, Wallet, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrencyARS } from '@/lib/formatUtils';

import { movimientosTesoreriaService } from '@/services/movimientosTesoreriaService';
import { movimientoService } from '@/services/movimientoService';
import { liquidezProyectadaService } from '@/services/liquidezProyectadaService';
import { cuentaService } from '@/services/cuentaService';
import { supabase } from '@/lib/customSupabaseClient';

const MovimientosTesoreriaPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [horizonte, setHorizonte] = useState(30); 
  const [soloEnRiesgo, setSoloEnRiesgo] = useState(false);
  const [graficoModo, setGraficoModo] = useState(() => {
    return localStorage.getItem('tesoreria_grafico_modo') || 'lineas';
  });
  
  const [proximosPagos, setProximosPagos] = useState([]);
  const [proximosCobros, setProximosCobros] = useState([]);
  const [estadoCuentas, setEstadoCuentas] = useState([]);
  const [pendientesConfirmacion, setPendientesConfirmacion] = useState([]);
  const [todosMovimientos, setTodosMovimientos] = useState([]);
  const [datosLiquidez, setDatosLiquidez] = useState([]);
  const [cuentasLiquidez, setCuentasLiquidez] = useState([]);
  const [resumenRiesgo, setResumenRiesgo] = useState(null);
  
  const [accounts, setAccounts] = useState([]);
  const [projects, setProjects] = useState([]);

  const [tableFilters, setTableFilters] = useState({});
  const [modalState, setModalState] = useState({
    view: false, delete: false, duplicate: false, import: false, selectedItem: null
  });
  const [selectedIds, setSelectedIds] = useState([]);

  const handleModoChange = (newMode) => {
    setGraficoModo(newMode);
    localStorage.setItem('tesoreria_grafico_modo', newMode);
  };

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [accData, projRes] = await Promise.all([
          cuentaService.getCuentasActivas(),
          supabase.from('projects').select('id, name').eq('is_deleted', false).order('name')
        ]);
        if (accData) setAccounts(accData);
        if (projRes.data) setProjects(projRes.data);
      } catch (e) {
        console.error('Error loading catalogs:', e);
      }
    };
    loadCatalogs();
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      const [resPagos, resCobros, resLiquidez, resPendientes] = await Promise.all([
        movimientosTesoreriaService.getProximosPagos(horizonte),
        movimientosTesoreriaService.getProximosCobros(horizonte),
        movimientosTesoreriaService.getLiquidezProyectada(horizonte),
        movimientosTesoreriaService.getPendientesConfirmacion()
      ]);

      if (resPagos.success) setProximosPagos(resPagos.data);
      if (resCobros.success) setProximosCobros(resCobros.data);
      if (resLiquidez.success) setEstadoCuentas(resLiquidez.data);
      if (resPendientes.success) setPendientesConfirmacion(resPendientes.data);

    } catch (error) {
      console.error("Error loading KPIs", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los indicadores." });
    }
  }, [horizonte, toast]);

  const loadLiquidez = useCallback(async () => {
    try {
      const { data, allAccounts } = await liquidezProyectadaService.getLiquidezPorFecha(horizonte, soloEnRiesgo);
      const resumen = await liquidezProyectadaService.getResumenRiesgo(horizonte, soloEnRiesgo);
      setDatosLiquidez(data || []);
      
      if (soloEnRiesgo && resumen?.listaRiesgo) {
        const riskyIds = resumen.listaRiesgo.map(r => r.id);
        setCuentasLiquidez(allAccounts.filter(acc => riskyIds.includes(acc.id)));
      } else {
        setCuentasLiquidez(allAccounts || []);
      }
      setResumenRiesgo(resumen);
    } catch (error) {
      console.error("Error loading liquidity projection", error);
    }
  }, [horizonte, soloEnRiesgo]);

  const loadTableData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await movimientosTesoreriaService.getMovimientosPorFiltros(tableFilters);
      if (res.success) setTodosMovimientos(res.data);
    } catch (error) {
      console.error("Error loading table data", error);
    } finally {
      setLoading(false);
    }
  }, [tableFilters]);

  useEffect(() => {
    loadDashboardData();
    loadTableData();
  }, [loadDashboardData, loadTableData]);

  useEffect(() => {
    loadLiquidez();
  }, [loadLiquidez]);

  const handleModal = (type, item = null, isOpen = true) => {
    setModalState(prev => ({
      ...prev, [type]: isOpen, selectedItem: isOpen ? item : null
    }));
  };

  const handleRefresh = () => {
    loadDashboardData();
    loadLiquidez();
    loadTableData();
    setSelectedIds([]);
  };

  const handleDeleteConfirm = async (item) => {
     try {
        await movimientoService.deleteMovimiento(item.id, item.tipo?.toLowerCase());
        toast({ title: "Movimiento eliminado", className: "bg-green-50 border-green-200" });
        handleModal('delete', null, false);
        handleRefresh();
     } catch (error) {
        toast({ variant: "destructive", title: "Error al eliminar", description: error.message });
     }
  };

  const totalPendienteMonto = pendientesConfirmacion.reduce((acc, curr) => acc + Number(curr.monto_ars || 0), 0);
  const totalSaldoCuentas = estadoCuentas.reduce((acc, curr) => acc + Number(curr.saldo_actual || 0), 0);
  const cuentasEnRiesgo = estadoCuentas.filter(c => c.en_riesgo).length;

  return (
    <div className="min-h-screen p-6 md:p-8 bg-slate-50/50 dark:bg-[#111827] transition-colors duration-200 font-sans">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-8"
      >
        <PageHeader 
          title="Movimientos y Tesorería" 
          description="Gestión financiera, proyección de liquidez y control de cuentas."
        />

        {/* NEW: Recurrencias Pendientes Panel */}
        <RecurrenciasPendientesPanel onRefresh={handleRefresh} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="h-48">
              <CarouselMovimientos 
                items={proximosPagos} 
                titulo="Próximos Pagos" 
                tipo="PAGO"
                onViewAll={() => setTableFilters({ tipo: 'GASTO' })}
                onItemClick={(item) => handleModal('view', item)}
              />
            </div>
            
            <div className="h-48">
              <CarouselMovimientos 
                items={proximosCobros} 
                titulo="Próximos Cobros" 
                tipo="COBRO"
                onViewAll={() => setTableFilters({ tipo: 'INGRESO' })}
                onItemClick={(item) => handleModal('view', item)}
              />
            </div>

            <div className="h-48">
              <KpiCard
                title="Estado de Cuentas"
                value={formatCurrencyARS(totalSaldoCuentas)}
                icon={Wallet}
                tone={cuentasEnRiesgo > 0 ? "amber" : "blue"}
                secondaryValue={`${estadoCuentas.length} cuentas activas`}
                description={cuentasEnRiesgo > 0 ? `${cuentasEnRiesgo} cuentas con riesgo` : "Saldos estables"}
                showBar
                onClick={() => {
                  setSoloEnRiesgo(true);
                  document.getElementById('liquidity-chart-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            </div>

            <div className="h-48">
              <KpiCard
                title="Pendientes"
                value={pendientesConfirmacion.length.toString()}
                icon={Clock}
                tone="amber"
                secondaryValue={formatCurrencyARS(totalPendienteMonto)}
                description="Esperando confirmación"
                showBar
                onClick={() => {
                  setTableFilters({ estado: 'PENDIENTE' });
                  document.getElementById('movements-table-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            </div>
        </div>

        <div id="liquidity-chart-section">
            <GraficoLiquidezMejorado 
              datos={datosLiquidez}
              cuentas={cuentasLiquidez}
              horizonte={horizonte}
              onHorizonteChange={setHorizonte}
              soloEnRiesgo={soloEnRiesgo}
              onSoloEnRiesgoChange={setSoloEnRiesgo}
              resumen={resumenRiesgo}
              modo={graficoModo}
              onModoChange={handleModoChange}
            />
        </div>

        <div id="movements-table-section" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Listado Global de Movimientos</h3>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => handleModal('import', null, true)}
              >
                <Upload className="w-4 h-4" /> Importar
              </Button>
            </div>
            <MovimientosTesoreriaTable 
              movimientos={todosMovimientos}
              loading={loading}
              filters={tableFilters}
              onFilterChange={setTableFilters}
              onSearch={(term) => setTableFilters(prev => ({ ...prev, search: term }))}
              onView={(item) => handleModal('view', item)}
              onEdit={(item) => navigate(`/movements/new?id=${item.id}`)} 
              onDelete={(item) => handleModal('delete', item)}
              onDuplicate={(item) => handleModal('duplicate', item)}
              onNew={() => navigate('/movements/new')}
              onRefresh={handleRefresh}
              selectable
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
        </div>
      </motion.div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedIds={selectedIds}
        onClear={() => setSelectedIds([])}
        onRefresh={handleRefresh}
        accounts={accounts}
        projects={projects}
      />

      {/* Modals */}
      <ViewMovementModal 
        isOpen={modalState.view}
        onClose={() => handleModal('view', null, false)}
        movement={modalState.selectedItem}
      />
      
      <DuplicateMovementModal
        isOpen={modalState.duplicate}
        onClose={() => handleModal('duplicate', null, false)}
        movement={modalState.selectedItem}
        onSave={handleRefresh}
      />

      <DeleteMovementModal
        isOpen={modalState.delete}
        movimiento={modalState.selectedItem}
        onCancel={() => handleModal('delete', null, false)}
        onConfirm={handleDeleteConfirm}
      />

      {/* NEW: Import Modal */}
      <ImportMovementsModal
        isOpen={modalState.import}
        onClose={() => handleModal('import', null, false)}
        onSuccess={handleRefresh}
        projects={projects}
        accounts={accounts}
      />
    </div>
  );
};

export default MovimientosTesoreriaPage;
