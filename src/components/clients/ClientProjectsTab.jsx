
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, TrendingUp, AlertCircle, ArrowRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Card } from '@/components/ui/Card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ClientProjectsTab = ({ clientId }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', clientId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) fetchProjects();
  }, [clientId]);

  if (loading) {
     return <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
         <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-3" />
         <p className="text-slate-500">Este cliente no tiene proyectos asociados</p>
         <Button 
            className="mt-4 rounded-full" 
            variant="outline"
            onClick={() => navigate('/projects')} // Could navigate to create project pre-filled
         >
           Ir a Proyectos
         </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Card key={project.id} className="p-5 flex flex-col group hover:border-blue-200 transition-colors">
            <div className="flex justify-between items-start mb-3">
               <div>
                  <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{project.name}</h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{project.code || 'SIN CODIGO'}</p>
               </div>
               <Chip label={project.status} variant={project.status === 'active' ? 'success' : 'default'} size="sm" className="capitalize" />
            </div>

            <div className="flex-1 mt-2 space-y-2">
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500">Inicio:</span>
                 <span className="text-slate-700 dark:text-slate-300 font-medium">
                   {project.start_date ? format(new Date(project.start_date), 'dd MMM yyyy', { locale: es }) : '-'}
                 </span>
               </div>
               {/* Placeholders for financial data if available in future */}
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500">Moneda Base:</span>
                 <span className="text-slate-700 dark:text-slate-300 font-medium">{project.base_currency}</span>
               </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 -mr-2"
                 onClick={() => navigate(`/projects/${project.id}`)}
               >
                 Ver Proyecto <ArrowRight className="w-4 h-4 ml-1" />
               </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClientProjectsTab;
