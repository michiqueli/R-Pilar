
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

function ReportModal({ isOpen, onClose, onSuccess, projectId, reportToEdit = null }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    report_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (reportToEdit) {
      setFormData({
        title: reportToEdit.title,
        content: reportToEdit.content || '',
        report_date: reportToEdit.report_date
      });
    } else {
      setFormData({
        title: '',
        content: '',
        report_date: new Date().toISOString().split('T')[0]
      });
    }
  }, [reportToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Title required' });
      return;
    }

    try {
      setLoading(true);
      const dataToSave = {
        project_id: projectId,
        title: formData.title,
        content: formData.content.trim() || null,
        report_date: formData.report_date
      };

      if (reportToEdit) {
        const { error } = await supabase
          .from('project_reports')
          .update(dataToSave)
          .eq('id', reportToEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('project_reports')
          .insert([dataToSave]);
        if (error) throw error;
      }

      toast({ title: 'Success', description: `Report ${reportToEdit ? 'updated' : 'added'}` });
      onSuccess();
      onClose();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                {reportToEdit ? 'Edit Report' : 'Add Report'}
              </h2>
              <button onClick={onClose}><X className="w-6 h-6 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label>Date *</Label>
                <input
                  type="date"
                  required
                  value={formData.report_date}
                  onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg h-32"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">{loading ? 'Saving...' : 'Save'}</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ReportModal;
