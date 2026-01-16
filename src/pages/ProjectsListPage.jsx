
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/contexts/LanguageContext';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { projectService, PROJECT_STATUSES } from '@/services/projectService';

// Components
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectsTable from '@/components/projects/ProjectsTable';
import ProjectModal from '@/components/projects/ProjectModal';
import FilterPopover from '@/components/projects/FilterPopover';
import EmptyStateFilters from '@/components/projects/EmptyStateFilters';
import usePageTitle from '@/hooks/usePageTitle';

// Unified Common Components
import SearchBar from '@/components/common/SearchBar';
import ViewToggle from '@/components/common/ViewToggle';

function ProjectsListPage() {
  const { t } = useTranslation();
  usePageTitle(t('projects.title'));
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filters, setFilters] = useState({ 
    status: [], 
    client: '', 
    responsible: '',
    dateRange: { start: '', end: '' }
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getProjects();
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        variant: 'destructive',
        title: t('messages.error_loading'),
        description: error.message || 'No se pudieron cargar los proyectos'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const clientOptions = useMemo(() => {
    const clients = projects
      .map(p => p.client_name)
      .filter(c => c && c.trim() !== '');
    return [...new Set(clients)].sort();
  }, [projects]);
  
  const responsibles = useMemo(() => {
      const users = projects.map(p => p.created_by).filter(Boolean);
      return [...new Set(users)];
  }, [projects]);

  const getFilteredProjects = () => {
    return projects.filter(project => {
      const matchesSearch = 
        !searchTerm || 
        project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.code?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filters.status.length === 0 || filters.status.includes(project.status);
      const matchesClient = !filters.client || (project.client_name && project.client_name === filters.client);
      const matchesResponsible = !filters.responsible || (project.created_by === filters.responsible);
      
      let matchesDate = true;
      if (filters.dateRange?.start) {
        matchesDate = matchesDate && new Date(project.start_date) >= new Date(filters.dateRange.start);
      }
      if (filters.dateRange?.end) {
        matchesDate = matchesDate && new Date(project.start_date) <= new Date(filters.dateRange.end);
      }
      
      return matchesSearch && matchesStatus && matchesClient && matchesResponsible && matchesDate;
    });
  };

  const filteredProjects = useMemo(() => getFilteredProjects(), [projects, searchTerm, filters]);

  const handleNewProject = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleDeleteProject = async (project) => {
    if (window.confirm(t('messages.confirm_delete'))) {
      try {
        await projectService.deleteProject(project.id);

        toast({
          title: t('messages.success_save'),
          description: t('projects.projectDeleted')
        });
        fetchProjects();
      } catch (error) {
        toast({
          variant: 'destructive',
          title: t('messages.error_loading'),
          description: t('common.error')
        });
      }
    }
  };

  const handleViewProject = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  const handleClearFilters = () => {
    setFilters({ 
      status: [], 
      client: '', 
      responsible: '',
      dateRange: { start: '', end: '' }
    });
    setSearchTerm('');
  };

  return (
    <>
      <div className="min-h-screen p-6 md:p-8 bg-slate-50/50 dark:bg-[#111827] transition-colors duration-200 font-sans">
        <motion.div 
           initial={{ opacity: 0, y: -10 }}
           animate={{ opacity: 1, y: 0 }}
           className="max-w-7xl mx-auto space-y-8"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
             <div>
               <h1 className="text-[32px] font-bold text-[#1F2937] dark:text-white flex items-center gap-3">
                 {t('projects.title')}
                 <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm px-2.5 py-0.5 rounded-full font-bold align-middle translate-y-[-2px]">
                    {filteredProjects.length}
                 </span>
               </h1>
             </div>

             <Button 
                onClick={handleNewProject} 
                variant="primary" 
                className="rounded-full shadow-lg shadow-blue-500/20 px-6 h-11"
             >
                <Plus className="w-5 h-5 mr-2" />
                {t('projects.new')}
             </Button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-2">
            <div className="w-full md:flex-1">
               <SearchBar 
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder={t('projects.searchPlaceholder')}
                  className="w-full border-none shadow-none bg-transparent"
               />
            </div>

            <div className="w-full h-px md:w-px md:h-8 bg-slate-100 dark:bg-slate-800 mx-2" />

            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
               <FilterPopover 
                  filters={filters} 
                  onFiltersChange={setFilters} 
                  responsibles={responsibles}
                  clientOptions={clientOptions}
                  statusOptions={PROJECT_STATUSES}
               />
               
               <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 mx-1" />

               <ViewToggle 
                  view={viewMode}
                  onViewChange={setViewMode}
                  className="border-none shadow-none bg-transparent p-0"
               />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-48 rounded-2xl animate-pulse bg-slate-200 dark:bg-slate-800" />
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
               <EmptyStateFilters onClear={handleClearFilters} />
            ) : viewMode === 'grid' ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredProjects.map((project) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    onView={() => handleViewProject(project.id)}
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ProjectsTable 
                  projects={filteredProjects} 
                  loading={loading} 
                  onView={handleViewProject}
                  onEdit={handleEditProject}
                  onDelete={handleDeleteProject}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProjects}
        project={editingProject}
      />
    </>
  );
}

export default ProjectsListPage;
