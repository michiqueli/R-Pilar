
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';

function ProviderStatementModal({ isOpen, onClose, onSuccess, providerId }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    statement_month: new Date().toISOString().split('T')[0], // defaulting to today, user picks typicaly 1st of month
    file_url: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.statement_month) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Statement month is required'
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('provider_statements')
        .insert([{
          provider_id: providerId,
          statement_month: formData.statement_month,
          file_url: formData.file_url || null,
          notes: formData.notes || null
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Statement added successfully'
      });
      onSuccess();
      onClose();
      setFormData({
        statement_month: new Date().toISOString().split('T')[0],
        file_url: '',
        notes: ''
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
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
              <h2 className="text-xl font-bold text-slate-900">Add Account Statement</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="statement_month">Statement Month/Date *</Label>
                <input
                  id="statement_month"
                  type="date"
                  required
                  value={formData.statement_month}
                  onChange={(e) => setFormData({ ...formData, statement_month: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500">Select any date within the statement month.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file_url">File URL (Optional)</Label>
                <input
                  id="file_url"
                  type="text"
                  value={formData.file_url}
                  onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
                <p className="text-xs text-slate-500">Paste a link to the stored document.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Additional details..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {loading ? 'Saving...' : 'Add Statement'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ProviderStatementModal;
