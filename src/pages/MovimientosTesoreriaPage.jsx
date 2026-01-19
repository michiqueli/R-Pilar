import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import CarouselMovimientos from '@/components/CarouselMovimientos';
import MovimientosTesoreriaTable from '@/components/movimientos/MovimientosTesoreriaTable';
import ViewMovementModal from '@/components/modals/ViewMovementModal';
import DeleteMovementModal from '@/components/modals/DeleteMovementModal';
import EditMovementModal from '@/components/modals/EditMovementModal';
import DuplicateMovementModal from '@/components/modals/DuplicateMovementModal';
import GraficoLiquidezMejorado from '@/components/GraficoLiquidezMejorado';

// UI e Iconos
import KpiCard from '@/components/ui/KpiCard';
import { Clock, Wallet, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrencyARS } from '@/lib/formatUtils';

// Services
import { movimientosTesoreriaService } from '@/services/movimientosTesoreriaService';
import { movimientoService } from '@/services/movimientoService';
import { liquidezProyectadaService } from '@/services/liquidezProyectadaService';

const MovimientosTesoreriaPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // States
  const [loading, setLoading] = useState(true);
  const [horizonte, setHorizonte] = useState(30); 
  const [soloEnRiesgo, setSoloEnRiesgo] = useState(false);
  const [graficoModo, setGraficoModo] = useState(() => {
    return localStorage.getItem('tesoreria_grafico_modo') || 'lineas';
  });
  
  // Data States
  const [proximosPagos, setProximosPagos] = useState([]);
  const [proximosCobros, setProximosCobros] = useState([]);
  const [estadoCuentas, setEstadoCuentas] = useState([]);
  const [pendientesConfirmacion, setPendientesConfirmacion] = useState([]);
  const [todosMovimientos, setTodosMovimientos] = useState([]);
  const [datosLiquidez, setDatosLiquidez] = useState([]);
  const [cuentasLiquidez, setCuentasLiquidez] = useState([]);
  const [resumenRiesgo, setResumenRiesgo] = useState(null);
  
  const [tableFilters, setTableFilters] = useState({});
  const [modalState, setModalState] = useState({
    view: false, delete: false, edit: false, duplicate: false, selectedItem: null
  });

  const handleModoChange = (newMode) => {
    setGraficoModo(newMode);
    localStorage.setItem('tesoreria_grafico_modo', newMode);
  };

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

  // Cálculo de totales para las tarjetas
  const totalPendienteMonto = pendientesConfirmacion.reduce((acc, curr) => acc + Number(curr.monto_ars || 0), 0);
  const totalSaldoCuentas = estadoCuentas.reduce((acc, curr) => acc + Number(curr.saldo_actual || 0), 0);
  const cuentasEnRiesgo = estadoCuentas.filter(c => c.en_riesgo).length;

  return (
    <div className="flex flex-col h-full space-y-6 pb-10">
      <PageHeader 
        title="Movimientos y Tesorería" 
        description="Gestión financiera, proyección de liquidez y control de cuentas."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Tarjeta 1: Proximos Pagos (Carousel) */}
          <div className="h-48">
            <CarouselMovimientos 
              items={proximosPagos} 
              titulo="Próximos Pagos" 
              tipo="PAGO"
              onViewAll={() => setTableFilters({ tipo: 'GASTO' })}
              onItemClick={(item) => handleModal('view', item)}
            />
          </div>
          
          {/* Tarjeta 2: Proximos Cobros (Carousel) */}
          <div className="h-48">
            <CarouselMovimientos 
              items={proximosCobros} 
              titulo="Próximos Cobros" 
              tipo="COBRO"
              onViewAll={() => setTableFilters({ tipo: 'INGRESO' })}
              onItemClick={(item) => handleModal('view', item)}
            />
          </div>

          {/* Tarjeta 3: Estado de Cuentas (Refactorizado a KpiCard) */}
          <div className="h-48">
            <KpiCard
              title="Estado de Cuentas"
              value={formatCurrencyARS(totalSaldoCuentas)}
              icon={Wallet}
              tone={cuentasEnRiesgo > 0 ? "amber" : "blue"}
              secondaryValue={`${estadoCuentas.length} cuentas activas`}
              description={cuentasEnRiesgo > 0 ? `${cuentasEnRiesgo} cuentas con riesgo de saldo` : "Saldos proyectados estables"}
              showBar
              onClick={() => {
                setSoloEnRiesgo(true);
                document.getElementById('liquidity-chart-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          </div>

          {/* Tarjeta 4: Pendientes (Refactorizado a KpiCard) */}
          <div className="h-48">
            <KpiCard
              title="Pendientes"
              value={pendientesConfirmacion.length.toString()}
              icon={Clock}
              tone="amber"
              secondaryValue={formatCurrencyARS(totalPendienteMonto)}
              description="Movimientos esperando confirmación"
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

      <div id="movements-table-section">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Listado Global de Movimientos</h3>
          <MovimientosTesoreriaTable 
            movimientos={todosMovimientos}
            loading={loading}
            filters={tableFilters}
            onFilterChange={setTableFilters}
            onSearch={(term) => setTableFilters(prev => ({ ...prev, search: term }))}
            onView={(item) => handleModal('view', item)}
            onEdit={(item) => handleModal('edit', item)} 
            onDelete={(item) => handleModal('delete', item)}
            onDuplicate={(item) => handleModal('duplicate', item)}
            onNew={() => navigate('/movements/new')}
          />
      </div>

      {/* Modals */}
      <ViewMovementModal 
        isOpen={modalState.view}
        onClose={() => handleModal('view', null, false)}
        movement={modalState.selectedItem}
      />
      
      <EditMovementModal
        isOpen={modalState.edit}
        onClose={() => handleModal('edit', null, false)}
        movement={modalState.selectedItem}
        onSave={handleRefresh}
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
    </div>
  );
};

export default MovimientosTesoreriaPage;