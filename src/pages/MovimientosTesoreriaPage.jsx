
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import CarouselMovimientos from '@/components/CarouselMovimientos';
import KPIEstadoCuentas from '@/components/KPIEstadoCuentas';
import GraficoLiquidezMejorado from '@/components/GraficoLiquidezMejorado';
import MovimientosTesoreriaTable from '@/components/movimientos/MovimientosTesoreriaTable';
import ViewMovementModal from '@/components/modals/ViewMovementModal';
import DeleteMovementModal from '@/components/modals/DeleteMovementModal';
import EditMovementModal from '@/components/modals/EditMovementModal';
import DuplicateMovementModal from '@/components/modals/DuplicateMovementModal';
import { movimientosTesoreriaService } from '@/services/movimientosTesoreriaService';
import { movimientoService } from '@/services/movimientoService';
import { liquidezProyectadaService } from '@/services/liquidezProyectadaService';
import { useToast } from '@/components/ui/use-toast';
import { Clock } from 'lucide-react';
import { formatCurrencyARS } from '@/lib/formatUtils';

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
  
  // New Liquidity Data States
  const [datosLiquidez, setDatosLiquidez] = useState([]);
  const [cuentasLiquidez, setCuentasLiquidez] = useState([]);
  const [resumenRiesgo, setResumenRiesgo] = useState(null);
  
  // Filters for Table
  const [tableFilters, setTableFilters] = useState({});
  
  // Modals State
  const [modalState, setModalState] = useState({
    view: false,
    delete: false,
    edit: false,
    duplicate: false,
    selectedItem: null
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
      if (res.success) {
        setTodosMovimientos(res.data);
      }
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
      ...prev,
      [type]: isOpen,
      selectedItem: isOpen ? item : null
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

  const renderPendientesCard = () => (
    <div 
      className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col h-full shadow-sm cursor-pointer hover:shadow-md transition-all group"
      onClick={() => {
        setTableFilters({ estado: 'PENDIENTE' });
        document.getElementById('movements-table-section')?.scrollIntoView({ behavior: 'smooth' });
      }}
    >
       <div className="flex items-center justify-between mb-4">
         <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Pendientes</h3>
         <div className="p-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-full">
            <Clock className="w-4 h-4 text-amber-500" />
         </div>
       </div>
       <div className="flex-1 flex flex-col justify-center text-center">
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
             {pendientesConfirmacion.length}
          </p>
          <p className="text-xs text-gray-500">Movimientos sin confirmar</p>
          {pendientesConfirmacion.length > 0 && (
             <p className="text-xs font-mono text-amber-600 font-medium mt-2 bg-amber-50 dark:bg-amber-900/10 py-1 px-2 rounded-full inline-block mx-auto">
                {formatCurrencyARS(pendientesConfirmacion.reduce((acc, curr) => acc + Number(curr.monto_ars || 0), 0))}
             </p>
          )}
       </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full space-y-6 pb-10">
      <PageHeader 
        title="Movimientos y Tesorería" 
        description="Gestión financiera, proyección de liquidez y control de cuentas."
      />

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
            <KPIEstadoCuentas 
              estadoCuentas={estadoCuentas}
              horizonte={horizonte}
              onViewRisks={() => {
                setSoloEnRiesgo(true);
                document.getElementById('liquidity-chart-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
         </div>

         <div className="h-48">
            {renderPendientesCard()}
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
