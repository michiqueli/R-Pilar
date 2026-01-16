
import React, { useState, useEffect } from 'react';
import { X, Folder, AlignLeft, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { tokens } from '@/lib/designTokens';
import { useTheme } from '@/contexts/ThemeProvider';
import ClientSearchable from '@/components/clients/ClientSearchable';
import DatePickerField from '@/components/ui/DatePickerField';
import { Select } from '@/components/ui/Select';
import { projectService, PROJECT_STATUSES } from '@/services/projectService';

const ProjectModal = ({ isOpen, onClose, onSuccess, project = null }) => {
  const { toast } = useToast();
  const { t } = useTheme();
  const [loading, setLoading] = useState(false);
  const [clientName, setClientName] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    client_id: '',
    start_date: null, // Optional, defaults to null
    end_date: null,   // Optional, defaults to null
    notes: '',        // Optional, defaults to empty
    status: 'active'
  });

  useEffect(() => {
    if (isOpen) {
      if (project) {
        setFormData({
          name: project.name || '',
          code: project.code || '',
          client_id: project.client_id || '',
          start_date: project.start_date ? new Date(project.start_date) : null,
          end_date: project.end_date ? new Date(project.end_date) : null,
          notes: project.notes || '',
          status: project.status || 'active'
        });
      } else {
        setFormData({
          name: '',
          code: '',
          client_id: '',
          start_date: null,
          end_date: null,
          notes: '',
          status: 'active'
        });
        setClientName('');
      }
    }
  }, [isOpen, project]);

  // Fetch client name when client_id changes to assist with code generation
  useEffect(() => {
    const fetchClientName = async () => {
      if (formData.client_id) {
         try {
           const data = await projectService.getClientById(formData.client_id);
           if (data) {
             setClientName(data.name);
           }
         } catch (error) {
           console.error("Error fetching client details:", error);
         }
      } else {
        setClientName('');
      }
    };
    fetchClientName();
  }, [formData.client_id]);

  // Auto-generate code when client name or project name changes
  useEffect(() => {
    const generateCode = () => {
       const clientPart = (clientName || '').substring(0, 3).toUpperCase();
       const projectPart = (formData.name || '').substring(0, 3).toUpperCase();
       
       // Only generate if we have at least partial info
       if (clientPart || projectPart) {
           const newCode = `${clientPart}${projectPart}`;
           setFormData(prev => {
             // Prevent loop if code is already correct
             if (prev.code === newCode) return prev;
             return { ...prev, code: newCode };
           });
       }
    };

    if (!project && (clientName || formData.name)) {
      generateCode();
    }
  }, [clientName, formData.name, project]);

  const handleSubmit = async () => {
    // 1. Required Fields Validation (Name & Client ONLY)
    if (!formData.name) {
      return toast({ variant: 'destructive', title: t('common.error'), description: t('messages.field_required') });
    }
    if (!formData.client_id) {
      return toast({ variant: 'destructive', title: t('common.error'), description: `${t('projects.client')} ${t('common.required').toLowerCase()}` });
    }
    
    // Status Validation
    if (formData.status && !PROJECT_STATUSES.includes(formData.status)) {
      return toast({ 
        variant: 'destructive', 
        title: t('common.error'), 
        description: `Invalid status selected.` 
      });
    }

    setLoading(true);
    try {
      // Ensure payload only contains necessary fields
      const payload = {
        name: formData.name,
        code: formData.code,
        client_id: formData.client_id || null,
        // Send null if no date selected
        start_date: formData.start_date ? formData.start_date.toISOString() : null,
        end_date: formData.end_date ? formData.end_date.toISOString() : null,
        notes: formData.notes,
        status: formData.status
      };

      if (project) {
        await projectService.updateProject(project.id, payload);
      } else {
        await projectService.createProject(payload);
      }

      // Success Path
      toast({ title: t('common.success'), description: t('messages.success_saved') });
      
      if (onSuccess) {
        await onSuccess();
      }
      onClose(); // Only close on success
      
    } catch (error) {
      console.error(error);
      // DO NOT CLOSE MODAL ON ERROR
      toast({ variant: 'destructive', title: t('common.error'), description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const formatStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 w-full max-w-[900px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 dark:border-slate-800"
            style={{ borderRadius: tokens.radius.modal }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {project ? t('projects.editProject') : t('projects.newProject')}
              </h2>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30 dark:bg-slate-900/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Left Column: Primary Identity */}
                <div className="space-y-6">
                   {/* 1) Nombre (Required) */}
                   <div className="space-y-2">
                      <Label>{t('projects.name')} <span className="text-red-500">*</span></Label>
                      <Input
                        icon={Folder}
                        placeholder={t('placeholder.project_name')}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        autoFocus
                      />
                   </div>

                   {/* 2) Cliente (Required) */}
                   <div className="space-y-2">
                      <Label>{t('projects.client')} <span className="text-red-500">*</span></Label>
                      <ClientSearchable 
                        value={formData.client_id}
                        onChange={(val) => setFormData({ ...formData, client_id: val })}
                      />
                   </div>
                   
                   {/* 3) Código (Auto-generated, ReadOnly) */}
                   <div className="space-y-2">
                      <Label>{t('projects.code')}</Label>
                      <Input
                        icon={BarChart2}
                        placeholder="Auto-generado..."
                        value={formData.code}
                        readOnly
                        disabled
                        className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed opacity-75"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        El código se genera automáticamente basado en el cliente y nombre.
                      </p>
                   </div>

                   {/* Status - Kept near main info, but not critical path */}
                   <div className="space-y-2 pt-2">
                     <Label>{t('projects.status')}</Label>
                     <Select
                        options={PROJECT_STATUSES.map(s => ({ 
                          value: s, 
                          label: formatStatusLabel(s)
                        }))}
                        value={formData.status}
                        onChange={(val) => setFormData({ ...formData, status: val })}
                     />
                   </div>
                </div>

                {/* Right Column: Optional Details */}
                <div className="space-y-6">
                   {/* 4) Descripción (Optional) */}
                   <div className="space-y-2">
                      <Label>{t('common.notes')} <span className="text-slate-400 text-xs font-normal ml-1">(Opcional)</span></Label>
                      <div className="relative">
                        <div className="absolute left-3 top-3 text-slate-400 pointer-events-none">
                           <AlignLeft className="h-4 w-4" />
                        </div>
                        <textarea
                          className="flex w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 pl-10 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-ring)] disabled:cursor-not-allowed disabled:opacity-50 min-h-[120px] resize-none"
                          placeholder={t('placeholder.additional_notes')}
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                      </div>
                   </div>

                   {/* 5) Fecha Inicio (Optional) */}
                   {/* 6) Fecha Fin (Optional) */}
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <DatePickerField 
                          label={<>{t('projects.startDate')} <span className="text-slate-400 text-xs font-normal ml-1">(Opcional)</span></>}
                          value={formData.start_date}
                          onChange={(date) => setFormData({ ...formData, start_date: date })}
                       />
                     </div>
                     <div className="space-y-2">
                       <DatePickerField 
                          label={<>{t('projects.endDate')} <span className="text-slate-400 text-xs font-normal ml-1">(Opcional)</span></>}
                          value={formData.end_date}
                          onChange={(date) => setFormData({ ...formData, end_date: date })}
                       />
                     </div>
                   </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 flex items-center justify-end gap-3 sticky bottom-0 z-10">
              <Button 
                variant="outline" 
                onClick={onClose} 
                disabled={loading}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSubmit} 
                loading={loading}
              >
                {t('projects.saveProject')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProjectModal;
