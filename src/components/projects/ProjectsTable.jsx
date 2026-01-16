
import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from '@/lib/dateUtils';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

function ProjectsTable({ projects, loading, onView, onEdit, onDelete }) {
  const { t } = useTheme();

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-500">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded mb-4"></div>
          <div className="h-3 w-32 bg-slate-100 dark:bg-slate-900 rounded"></div>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return null; 
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">{t('projects.name')}</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('projects.status')}</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('projects.startDate')}</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('projects.lastUpdated')}</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {projects.map((project, index) => (
              <motion.tr
                key={project.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  "group cursor-pointer transition-all duration-150 ease-out",
                  "hover:bg-slate-50 dark:hover:bg-slate-800/50" // Adjusted hover effect
                )}
                onClick={() => onView(project.id)}
              >
                <td className="py-4 px-6">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 transition-colors">{project.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{project.client_name || t('projects.noClient') || 'Sin cliente'}</div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <Chip 
                     label={t(`status.${project.status}`) || project.status} 
                     variant={project.status} 
                     size="sm"
                     className={cn(
                       project.status === 'active' && "bg-[#10B981]/10 text-[#10B981] dark:bg-[#6EE7B7]/10 dark:text-[#6EE7B7]"
                     )} 
                  />
                </td>
                <td className="py-4 px-6 text-sm text-slate-500">
                   {project.start_date ? new Date(project.start_date).toLocaleDateString() : '-'}
                </td>
                <td className="py-4 px-6 text-sm text-slate-500">
                  {formatDistanceToNow(project.updated_at)}
                </td>
                <td className="py-4 px-6 text-right">
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="iconSm" className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(project.id)}>
                          <Eye className="w-4 h-4 mr-2" /> {t('common.view')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(project)}>
                          <Edit className="w-4 h-4 mr-2" /> {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(project)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                          <Trash2 className="w-4 h-4 mr-2" /> {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProjectsTable;
