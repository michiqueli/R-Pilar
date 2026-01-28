
import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import KpisTotalesBlock from '@/components/projects/KpisTotalesBlock';
import AvancesPartidas from '@/components/projects/AvancesPartidas';
import TareasRapidas from '@/components/proyectos/TareasRapidas';
import { useTheme } from '@/contexts/ThemeProvider';

const ProjectSummaryTab = ({ projectId, projectData: propProjectData }) => {
  // Fix: Handle null context safely
  const outletContext = useOutletContext();

  const contextProjectData = outletContext?.projectData;
  
  // Prioritize prop, then context
  const projectData = propProjectData || contextProjectData;

  const { t } = useTheme();
  const [tasksRefreshKey, setTasksRefreshKey] = useState(0);

  if (!projectId && !projectData?.id) {
    return <div className="p-8 text-center text-gray-500">Cargando resumen del proyecto...</div>;
  }

  const handleTaskChange = () => {
    setTasksRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 1. KPIs Principales (Top Cards) */}
      <KpisTotalesBlock projectId={projectId || propProjectData?.id} />

      {/* 2. Project Progress & Tasks Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <AvancesPartidas projectId={projectId || propProjectData?.id} />
        </div>
        <div className="lg:col-span-1">
           <TareasRapidas projectId={projectId || propProjectData?.id} onTaskChange={handleTaskChange} />
        </div>
      </div>

      {/* 3. Breakdown por Partidas (Detailed Progress) 
      <ProjectPartidaBreakdownBlock projectId={activeProjectId} />

      {/* 4. Plan de Trabajo (Timeline) 
      <ProjectWorkPlanBlock projectId={activeProjectId} />

      {/* 5. Objetivos del Proyecto 
      <ProjectObjectivesBlock projectId={activeProjectId} />

      {/* 6. Balance Mensual (Financial) 
      <BalanceMensualBlock projectId={activeProjectId} />

      {/* 7. Upcoming Movements (Treasury) 
      <UpcomingMovementsBlock projectId={activeProjectId} limit={5} />

       {/* 8. Investments Overview 
      <ProjectInvestmentsBlock projectId={activeProjectId} />*/}

    </div>
  );
};

export default ProjectSummaryTab;
