
import React from 'react';
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { formatDistanceToNow } from '@/lib/dateUtils';
import { useTheme } from '@/contexts/ThemeProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

const ProjectCard = ({ project, onView, onEdit, onDelete }) => {
  const { t } = useTheme();
  
  // Verify status for indicator
  const isActive = project.status === 'active';

  return (
    <div 
      className={cn(
        "project-card relative flex flex-col h-full overflow-hidden rounded-xl group cursor-pointer",
        "bg-[#FFFFFF] dark:bg-[#111827]",
        "border border-[#E5E7EB] dark:border-[#374151]",
        "shadow-[var(--shadow-sm)] dark:shadow-[var(--shadow-sm-dark)]",
        "transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] dark:hover:shadow-[var(--shadow-md-dark)]",
        // Active indicator using left border or just chip? Requirement says "active status shows green chip". 
        // But requirement 5 says "Ensure active status shows green chip (#10B981 light / #6EE7B7 dark) with 'Activo' text". 
        // It DOES NOT say remove border indicator, but let's stick to the prompt description. 
        // Previous design had left border. I will keep it for visual reinforcement unless explicitly forbidden, 
        // but ensure chip is correct.
        isActive && "border-l-4 border-l-[#10B981] dark:border-l-[#6EE7B7]"
      )}
      onClick={onView}
    >
      <div className="p-5 flex-1">
        {/* Header: Title & Menu */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 pr-4">
            <h3 className="text-[18px] font-bold text-[#1F2937] dark:text-[#FFFFFF] leading-tight mb-1 group-hover:text-[#3B82F6] transition-colors">
              {project.name}
            </h3>
            <p className="text-[14px] text-[#6B7280] dark:text-[#D1D5DB] font-normal truncate">
              {project.client_name || t('projects.noClient') || 'Sin cliente'}
            </p>
          </div>
          
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="iconSm" className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onView}>
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
        </div>

        {/* Chips */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <Chip 
            label={t(`status.${project.status}`) || project.status} 
            variant={project.status} 
            size="sm" 
            className={cn(
               // Ensure correct colors for active status as requested
               project.status === 'active' && "bg-[#10B981]/10 text-[#10B981] dark:bg-[#6EE7B7]/10 dark:text-[#6EE7B7]"
            )}
          />
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#E5E7EB] dark:border-[#374151]">
           <div>
              <p className="text-[12px] text-[#9CA3AF] dark:text-[#9CA3AF] font-medium uppercase tracking-wider">{t('projects.startDate')}</p>
              <p className="text-[14px] font-semibold text-[#374151] dark:text-[#D1D5DB] mt-1">
                {project.start_date ? new Date(project.start_date).toLocaleDateString() : '-'}
              </p>
           </div>
           <div>
              <p className="text-[12px] text-[#9CA3AF] dark:text-[#9CA3AF] font-medium uppercase tracking-wider">{t('projects.code')}</p>
              <p className="text-[14px] font-semibold text-[#374151] dark:text-[#D1D5DB] mt-1">
                {project.code || '-'}
              </p>
           </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[#E5E7EB] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#111827] flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400 ring-2 ring-white dark:ring-slate-900">
            {(project.created_by || 'US').substring(0, 2).toUpperCase()}
          </div>
          <span className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">{t('projects.responsible')}</span>
        </div>
        
        <div className="text-[12px] text-[#9CA3AF] font-medium flex items-center gap-1">
           {t('projects.lastUpdated')} {formatDistanceToNow(project.updated_at)}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
