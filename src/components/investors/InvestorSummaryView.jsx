
import React, { useMemo, useState, useEffect } from 'react';
import InvestorKPICard from './InvestorKPICard';
import InvestorProjectCard from './InvestorProjectCard';
import InvestmentActivityTimeline from './InvestmentActivityTimeline';
import InvestorKPIDetailModal from './InvestorKPIDetailModal';
import InvestorProjectDetailModal from './InvestorProjectDetailModal';

const InvestorSummaryView = ({ 
  investor, 
  kpis, 
  projectBalances = [], 
  recentActivity = [],
  projects = [], // Keep for backward compat
  movements = [], // Keep for backward compat/modals
  onViewAllMovements, 
  onAddMovement 
}) => {
  const [kpiModal, setKpiModal] = useState({ open: false, type: null, title: '' });
  const [projectModal, setProjectModal] = useState({ open: false, project: null });

  // Filter movements for modals
  const getFilteredMovements = () => {
     const safeMovements = Array.isArray(movements) ? movements : [];
     if (kpiModal.type === 'total_invertido') return safeMovements.filter(m => m.type === 'INVERSION_RECIBIDA');
     if (kpiModal.type === 'total_devuelto') return safeMovements.filter(m => m.type === 'DEVOLUCION_INVERSION');
     // For balance, show everything? or just ignore filtering in modal?
     return safeMovements;
  };
  
  const getProjectMovements = () => {
     if (!projectModal.project) return [];
     const safeMovements = Array.isArray(movements) ? movements : [];
     return safeMovements.filter(m => (m.project_id || m.projectId) === projectModal.project.project_id);
  };

  return (
    <div className="space-y-6">
       {/* KPIs */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InvestorKPICard 
             label="Total Invertido"
             usdValue={kpis?.total_invertido_usd || 0}
             arsValue={kpis?.total_invertido_ars || 0}
             color="green"
             onClick={() => setKpiModal({ open: true, type: 'total_invertido', title: 'Detalle de Inversiones' })}
          />
          <InvestorKPICard 
             label="Total Devuelto"
             usdValue={kpis?.total_devuelto_usd || 0}
             arsValue={kpis?.total_devuelto_ars || 0}
             color="red"
             onClick={() => setKpiModal({ open: true, type: 'total_devuelto', title: 'Detalle de Devoluciones' })}
          />
          <InvestorKPICard 
             label="Saldo Neto"
             usdValue={kpis?.saldo_neto_usd || 0}
             arsValue={kpis?.saldo_neto_ars || 0}
             color="blue"
             onClick={() => setKpiModal({ open: true, type: 'saldo_neto', title: 'Balance General' })}
          />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects Zone */}
          <div className="lg:col-span-2 space-y-4">
             <h3 className="font-bold text-slate-800 dark:text-white">Proyectos Activos</h3>
             {(!projectBalances || projectBalances.length === 0) ? (
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center text-slate-400">
                   No hay proyectos con movimientos registrados
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {(projectBalances || []).map(proj => (
                      <InvestorProjectCard 
                         key={proj.project_id}
                         project={{ name: proj.project_name, id: proj.project_id }}
                         invested={{ usd: proj.invertido_usd, ars: proj.invertido_ars }}
                         returned={{ usd: proj.devuelto_usd, ars: proj.devuelto_ars }}
                         balance={{ usd: proj.saldo_neto_usd, ars: proj.saldo_neto_ars }}
                         status={proj.status || 'active'}
                         onClick={() => setProjectModal({ open: true, project: proj })}
                      />
                   ))}
                </div>
             )}
          </div>

          {/* Timeline Zone */}
          <div className="lg:col-span-1">
             <InvestmentActivityTimeline 
                recentActivity={recentActivity} 
                onViewAll={onViewAllMovements}
                onAdd={onAddMovement}
             />
          </div>
       </div>

       <InvestorKPIDetailModal
          isOpen={kpiModal.open}
          onClose={() => setKpiModal({ ...kpiModal, open: false })}
          title={kpiModal.title}
          movements={getFilteredMovements()}
       />

       <InvestorProjectDetailModal
          isOpen={projectModal.open}
          onClose={() => setProjectModal({ ...projectModal, open: false })}
          project={projectModal.project}
          movements={getProjectMovements()}
       />
    </div>
  );
};

export default InvestorSummaryView;
