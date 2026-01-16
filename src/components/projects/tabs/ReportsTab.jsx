
import React, { useState } from 'react';
import { Plus, Calendar, FileText, Trash2, Edit, MoreHorizontal, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { formatDate } from '@/lib/dateUtils';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReportModal from '@/components/projects/modals/ReportModal';

function ReportsTab({ projectId, reports, onRefresh }) {
  const { toast } = useToast();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportToEdit, setReportToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReports = reports.filter(report => 
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (report.content && report.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEditReport = (report) => {
    setReportToEdit(report);
    setIsReportModalOpen(true);
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      const { error } = await supabase.from('project_reports').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Report deleted' });
      onRefresh();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleNew = () => {
    setReportToEdit(null);
    setIsReportModalOpen(true);
  };

  const handleView = (id) => {
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
                        <DropdownMenuItem onClick={() => handleEditReport(report)}>
                          <Edit className="w-4 h-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteReport(report.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
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

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSuccess={onRefresh}
        projectId={projectId}
        reportToEdit={reportToEdit}
      />
    </div>
  );
}

export default ReportsTab;
