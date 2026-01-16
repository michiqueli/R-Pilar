
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/ThemeProvider';
import { investorService } from '@/services/investorService';
import { tokens } from '@/lib/designTokens';

const InvestorModal = ({ isOpen, onClose, onSuccess, investor = null }) => {
  const { t } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    notas: '',
    estado: 'activo'
  });

  useEffect(() => {
    if (isOpen) {
      if (investor) {
        setFormData({
          nombre: investor.nombre || '',
          email: investor.email || '',
          telefono: investor.telefono || '',
          notas: investor.notas || '',
          estado: investor.estado || 'activo'
        });
      } else {
        setFormData({
          nombre: '',
          email: '',
          telefono: '',
          notas: '',
          estado: 'activo'
        });
      }
    }
  }, [isOpen, investor]);

  const validateEmail = (email) => {
     if (!email) return true;
     return String(email)
       .toLowerCase()
       .match(
         /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
       );
  };

  const handleSubmit = async () => {
    // Form Validation
    if (!formData.nombre.trim()) {
      return toast({ variant: 'destructive', title: t('common.error'), description: 'El nombre es obligatorio' });
    }
    if (formData.nombre.length > 100) {
      return toast({ variant: 'destructive', title: t('common.error'), description: 'El nombre no puede exceder 100 caracteres' });
    }
    if (formData.email && !validateEmail(formData.email)) {
      return toast({ variant: 'destructive', title: t('common.error'), description: 'Formato de email inválido' });
    }
    if (formData.notas && formData.notas.length > 500) {
      return toast({ variant: 'destructive', title: t('common.error'), description: 'Notas demasiado largas (max 500)' });
    }

    setLoading(true);
    try {
      let result;
      if (investor) {
        result = await investorService.updateInvestor(investor.id, formData);
        if (result.success) {
           toast({ title: t('common.success'), description: 'Inversionista actualizado correctamente.' });
        } else {
           throw new Error(result.error);
        }
      } else {
        result = await investorService.createInvestor(formData);
        if (result.success) {
           toast({ title: t('common.success'), description: 'Inversionista creado exitosamente.' });
        } else {
           throw new Error(result.error);
        }
      }
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast({ 
        variant: 'destructive', 
        title: t('common.error'), 
        description: error.message || 'Ocurrió un error al guardar.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 w-full max-w-lg shadow-2xl flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800"
            style={{ borderRadius: tokens.radius.modal }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center">
                     <User className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {investor ? 'Editar Inversionista' : 'Nuevo Inversionista'}
                  </h2>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                 <X className="w-5 h-5 text-slate-400" />
               </button>
            </div>

            <div className="p-6 space-y-4">
               <div className="space-y-2">
                  <Label>Nombre / Razón Social <span className="text-red-500">*</span></Label>
                  <Input 
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Ej. Juan Pérez"
                    className="focus:ring-2 focus:ring-cyan-500"
                  />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <Label>Email</Label>
                     <Input 
                       value={formData.email}
                       onChange={(e) => setFormData({...formData, email: e.target.value})}
                       placeholder="juan@email.com"
                     />
                  </div>
                  <div className="space-y-2">
                     <Label>Teléfono</Label>
                     <Input 
                       value={formData.telefono}
                       onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                       placeholder="+54 9 11..."
                     />
                  </div>
               </div>
               
               <div className="space-y-2">
                  <Label>Estado <span className="text-red-500">*</span></Label>
                  <select
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
               </div>

               <div className="space-y-2">
                  <Label>Notas</Label>
                  <textarea 
                    className="w-full min-h-[80px] rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none resize-none"
                    value={formData.notas}
                    onChange={(e) => setFormData({...formData, notas: e.target.value})}
                    placeholder="Información adicional..."
                    maxLength={500}
                  />
                  <div className="text-right text-xs text-slate-400">
                     {formData.notas.length}/500
                  </div>
               </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 p-6 bg-slate-50 dark:bg-slate-950 flex justify-end gap-3 shrink-0">
               <Button variant="outline" onClick={onClose} disabled={loading} className="rounded-full px-6 shadow-sm hover:shadow-md">{t('common.cancel')}</Button>
               <Button 
                  variant="primary" 
                  onClick={handleSubmit} 
                  loading={loading} 
                  className="rounded-full px-6 bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg hover:scale-105 transition-all"
               >
                  <Save className="w-4 h-4 mr-2" /> {t('common.save')}
               </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InvestorModal;
