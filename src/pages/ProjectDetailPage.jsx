import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, Edit, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import ProjectModal from '@/components/projects/ProjectModal';
import TabsNavigation from '@/components/layout/TabsNavigation';
import ProjectSummaryTab from '@/components/projects/tabs/ProjectSummaryTab';
import ProjectMovimientosTab from '@/components/projects/tabs/ProjectMovimientosTab';
import ProjectTasksTab from '@/components/projects/tabs/ProjectTasksTab';
import ProjectDocumentsTab from '@/components/projects/tabs/ProjectDocumentsTab';
import PlanDeObraTab from '@/components/projects/tabs/PlanDeObraTab';
import ProyeccionTab from '@/components/projects/tabs/ProyeccionTab'; 
import NotFoundPage from '@/components/layout/NotFoundPage';
import { tokens } from '@/lib/designTokens';
import usePageTitle from '@/hooks/usePageTitle';

function ProjectDetailPage() {
  usePageTitle('Detalle del proyecto');
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      setNotFound(false);
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('is_deleted', false)
        .maybeSingle();

      if (projectError) throw projectError;
      if (!projectData) {
        setNotFound(true);
        return;
      }
      setProject(projectData);
    } catch (error) {
      console.error('Error fetching project data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Hubo un problema cargando los datos del proyecto.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-blue-600 animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  if (notFound) return <NotFoundPage />;
  if (!project) return null;

  return (
    <>
      {/* Fondo general corregido */}
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6 md:p-8 transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header Block Corregido */}
          <div
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 flex flex-col md:flex-row items-center justify-between gap-4 mb-8 relative overflow-hidden transition-colors"
            style={{ borderRadius: tokens.radius.card }}
          >
            {/* Gradiente sutil para modo oscuro */}
            <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-slate-50 dark:from-slate-800/50 to-transparent pointer-events-none" />

            {/* Left: Breadcrumbs & Title */}
            <div className="flex-1 relative z-10 text-center md:text-left w-full">
              <div className="flex items-center justify-center md:justify-start text-sm text-slate-500 dark:text-slate-400 mb-2">
                <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors" onClick={() => navigate('/projects')}>Proyectos</span>
                <ChevronRight className="w-4 h-4 mx-2" />
                <span className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1">{project.name}</span>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{project.name}</h1>
                <Chip label={project.status} variant={project.status} />
              </div>
              {project.client_name && (
                <p className="text-slate-500 dark:text-slate-400 mt-1">{project.client_name}</p>
              )}
            </div>

            {/* Right: Actions */}
            <div className="relative z-10 flex-shrink-0 flex gap-2">
              <Button
                onClick={() => navigate(`/movements/new?project_id=${id}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Movimiento
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setIsEditModalOpen(true)}
                className="dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar Proyecto
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <TabsNavigation
            tabs={[
              { id: 'summary', label: 'Resumen' },
              { id: 'plan', label: '📋 Plan de Obra' },
              { id: 'tasks', label: 'Tareas' },
              { id: 'movimientos', label: 'Movimientos' },
              { id: 'documents', label: 'Documentos' },
              { id: 'proyeccion', label: 'Proyección' },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Content Area */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mt-6"
            >
              {activeTab === 'summary' && <ProjectSummaryTab projectId={id} projectData={project} />}
              {activeTab === 'plan' && <PlanDeObraTab projectId={id} />}
              {activeTab === 'tasks' && <ProjectTasksTab projectId={id} />}
              {activeTab === 'movimientos' && <ProjectMovimientosTab projectId={id} />}
              {activeTab === 'documents' && <ProjectDocumentsTab projectId={id} />}
              {activeTab === 'proyeccion' && <ProyeccionTab projectId={id} />}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      <ProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchProjectData}
        project={project}
      />
    </>
  );
}

export default ProjectDetailPage;