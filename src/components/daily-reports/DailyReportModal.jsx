
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/contexts/LanguageContext';

function DailyReportModal({ isOpen, onClose, onSuccess, report = null, preselectedProjectId = null }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  
  const [formData, setFormData] = useState({
    report_date: new Date().toISOString().split('T')[0],
    project_id: '',
    start_time: '',
    end_time: '',
    workers: '',
    work_done: '',
    photos_urls: [],
    client_signature_url: '',
    tech_signature_url: '',
    is_deleted: false
  });

  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase.from('projects').select('id, name').eq('is_deleted', false);
      setProjects(data || []);
    };
    if (isOpen) fetchProjects();
  }, [isOpen]);

  useEffect(() => {
    if (report) {
      setFormData({
        report_date: report.report_date,
        project_id: report.project_id || '',
        start_time: report.start_time || '',
        end_time: report.end_time || '',
        workers: report.workers || '',
        work_done: report.work_done || '',
        photos_urls: report.photos_urls || [],
        client_signature_url: report.client_signature_url || '',
        tech_signature_url: report.tech_signature_url || '',
        is_deleted: report.is_deleted || false
      });
    } else {
      setFormData({
        report_date: new Date().toISOString().split('T')[0],
        project_id: preselectedProjectId || '',
        start_time: '',
        end_time: '',
        workers: '',
        work_done: '',
        photos_urls: [],
        client_signature_url: '',
        tech_signature_url: '',
        is_deleted: false
      });
    }
  }, [report, isOpen, preselectedProjectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!formData.report_date) return toast({ variant: 'destructive', title: t('common.error'), description: 'Date is required' });
    if (!formData.project_id) return toast({ variant: 'destructive', title: t('common.error'), description: 'Project is required' });
    if (!formData.work_done.trim()) return toast({ variant: 'destructive', title: t('common.error'), description: 'Work done description is required' });

    try {
      setLoading(true);
      const dataToSave = {
        ...formData,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        updated_at: new Date().toISOString()
      };

      if (report) {
        const { error } = await supabase.from('daily_reports').update(dataToSave).eq('id', report.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('daily_reports').insert([{...dataToSave, is_deleted: false}]);
        if (error) throw error;
      }

      toast({ title: t('common.success'), description: t('common.saved') });
      onSuccess();
      onClose();
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addPhoto = () => {
    if (!newPhotoUrl.trim()) return;
    setFormData(prev => ({
      ...prev,
      photos_urls: [...prev.photos_urls, newPhotoUrl.trim()]
    }));
    setNewPhotoUrl('');
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos_urls: prev.photos_urls.filter((_, i) => i !== index)
    }));
  };

  const inputClass = "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500";
  const labelClass = "text-slate-700 dark:text-slate-200";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {report ? t('reports.editDaily') : t('reports.newDaily')}
              </h2>
              <button onClick={onClose}><X className="w-6 h-6 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={labelClass}>{t('common.date')} *</Label>
                  <input
                    type="date"
                    required
                    value={formData.report_date}
                    onChange={(e) => handleChange('report_date', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>{t('projects.title')} *</Label>
                  <select
                    required
                    value={formData.project_id}
                    onChange={(e) => handleChange('project_id', e.target.value)}
                    className={inputClass}
                    disabled={!!preselectedProjectId}
                  >
                    <option value="">{t('common.search')}</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={labelClass}>{t('reports.startTime')}</Label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => handleChange('start_time', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>{t('reports.endTime')}</Label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => handleChange('end_time', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className={labelClass}>{t('reports.workers')}</Label>
                <input
                  type="text"
                  value={formData.workers}
                  onChange={(e) => handleChange('workers', e.target.value)}
                  className={inputClass}
                  placeholder="..."
                />
              </div>

              <div className="space-y-2">
                <Label className={labelClass}>{t('reports.workDone')} *</Label>
                <textarea
                  required
                  value={formData.work_done}
                  onChange={(e) => handleChange('work_done', e.target.value)}
                  className={`${inputClass} h-32`}
                  placeholder="..."
                />
              </div>

              <div className="space-y-2">
                <Label className={labelClass}>{t('reports.photos')} (URLs)</Label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    className={inputClass}
                    placeholder="https://..."
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPhoto(); } }}
                  />
                  <Button type="button" onClick={addPhoto} variant="outline" className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.photos_urls.map((url, index) => (
                    <div key={index} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full text-sm max-w-full">
                      <span className="truncate max-w-[200px] dark:text-white">{url}</span>
                      <button type="button" onClick={() => removePhoto(index)} className="text-red-500"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">{t('common.cancel')}</Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={loading}>{loading ? t('common.saving') : t('common.save')}</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default DailyReportModal;
