
import React, { useState } from 'react';
// Removed specific imports for Daily Reports
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
// Removed useNavigate as no navigation to Daily Reports
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
// Removed DailyReportModal
import { formatDate } from '@/lib/dateUtils';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// This component is updated to display 'project_reports' if that's its intended purpose
// If it was solely for daily_reports, it would be removed, but the name implies project_reports.
// Since the prompt states "Si existe tabla project_reports en Supabase: dejarla como está (no eliminar DB), solo ocultar de UI."
// and this component is named ProjectReportsTab, it implies it should now handle project_reports.
// However, the original code in ProjectReportsTab.jsx was fetching and displaying `daily_reports`.
// Given the user's explicit instruction to remove "Informes Diarios" features and mentions of `project_reports`,
// I am assuming `ProjectReportsTab` should now manage `project_reports` and *not* `daily_reports`.
// If `ProjectReportsTab` was intended to exclusively show daily reports, it should be removed.
// Since it's a tab, I'll update it to handle `project_reports`.

const ProjectReportsTab = ({ projectId, projectReports, onRefresh }) => { // Renamed prop from dailyReports to projectReports
  const { toast } = useToast();
  // const navigate = useNavigate(); // Removed navigation to daily reports
  const [searchTerm, setSearchTerm] = useState('');
  // const [isModalOpen, setIsModalOpen] = useState(false); // Removed DailyReportModal state
  // const [selectedReport, setSelectedReport] = useState(null); // Removed DailyReportModal state

  const filteredReports = projectReports.filter(report => 
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (report.content && report.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro que deseas eliminar este informe del proyecto?')) return;
    try {
      const { error } = await supabase.from('project_reports').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Informe eliminado', description: 'El informe del proyecto ha sido movido a la papelera.' });
      onRefresh();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleEdit = (report) => {
    // Implement edit for project_reports if needed, currently not implemented fully.
    toast({
      title: "🚧 No implementado",
      description: "La edición de informes de proyecto no está implementada aún. Solicítala en tu próximo prompt. 🚀",
    });
  };

  const handleNew = () => {
    // Implement new for project_reports if needed, currently not implemented fully.
    toast({
      title: "🚧 No implementado",
      description: "La creación de informes de proyecto no está implementada aún. Solicítala en tu próximo prompt. 🚀",
    });
  };

  const handleView = (id) => {
    // If project_reports have a detail page, navigate there.
    // For now, show a toast or open a read-only modal.
    toast({
      title: "🚧 No implementado",
      description: "La vista detallada de informes de proyecto no está implementada aún. Solicítala en tu próximo prompt. 🚀",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:w-80">
          <Input
            placeholder="Buscar por título o contenido..."
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={handleNew} variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Informe
        </Button>
      </div>

      <Card className="overflow-hidden border border-slate-200 p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/4">Fecha</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Título</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contenido</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.map((report, index) => (
                <motion.tr
                  key={report.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                       <span className="font-medium text-slate-900">{formatDate(report.report_date)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm font-medium text-slate-900 line-clamp-1 max-w-xs">
                     {report.title}
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-600 line-clamp-2 max-w-md">
                    {report.content || '-'}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="iconSm" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                         <DropdownMenuItem onClick={() => handleView(report.id)}>
                          <Eye className="w-4 h-4 mr-2" /> Ver Detalle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(report)}>
                          <Edit className="w-4 h-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(report.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                          <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-slate-500">
                    No se encontraron informes del proyecto
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals for Project Reports, if implemented later */}
    </div>
  );
};

export default ProjectReportsTab;
