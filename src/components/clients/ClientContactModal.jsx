
import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Briefcase, Star, AlignLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { tokens } from '@/lib/designTokens';

const ClientContactModal = ({ isOpen, onClose, onSuccess, clientId, contact = null }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role_title: '',
    phone: '',
    email: '',
    notes: '',
    is_primary: false
  });

  useEffect(() => {
    if (isOpen) {
      if (contact) {
        setFormData({
          name: contact.name || '',
          role_title: contact.role_title || '',
          phone: contact.phone || '',
          email: contact.email || '',
          notes: contact.notes || '',
          is_primary: contact.is_primary || false
        });
      } else {
        setFormData({
          name: '',
          role_title: '',
          phone: '',
          email: '',
          notes: '',
          is_primary: false
        });
      }
    }
  }, [isOpen, contact]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      return toast({ variant: 'destructive', title: 'Error', description: 'El nombre es obligatorio' });
    }

    setLoading(true);
    try {
      // If setting as primary, unset others first
      if (formData.is_primary) {
        await supabase
          .from('client_contacts')
          .update({ is_primary: false })
          .eq('client_id', clientId);
      }

      const payload = {
        ...formData,
        client_id: clientId,
        updated_at: new Date().toISOString()
      };

      let error;
      if (contact) {
        const { error: updateError } = await supabase
          .from('client_contacts')
          .update(payload)
          .eq('id', contact.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('client_contacts')
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;

      toast({ title: 'Éxito', description: `Contacto ${contact ? 'actualizado' : 'creado'} correctamente` });
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 w-full max-w-[800px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            style={{ borderRadius: tokens.radius.modal }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {contact ? 'Editar Contacto' : 'Nuevo Contacto'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Nombre Completo <span className="text-red-500">*</span></Label>
                    <Input
                      icon={User}
                      placeholder="Ej. María García"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Cargo / Título</Label>
                    <Input
                      icon={Briefcase}
                      placeholder="Ej. Gerente de Compras"
                      value={formData.role_title}
                      onChange={(e) => handleChange('role_title', e.target.value)}
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-4">
                    <Checkbox 
                      id="is_primary" 
                      checked={formData.is_primary}
                      onCheckedChange={(checked) => handleChange('is_primary', checked)}
                    />
                    <label 
                      htmlFor="is_primary" 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                    >
                      <Star className={`w-4 h-4 ${formData.is_primary ? 'text-yellow-500 fill-yellow-500' : 'text-slate-400'}`} />
                      Contacto Principal
                    </label>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input
                      icon={Phone}
                      placeholder="+54 9 11 1234-5678"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      icon={Mail}
                      type="email"
                      placeholder="maria@empresa.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Notas</Label>
                    <div className="relative">
                      <div className="absolute left-3 top-3 text-slate-400 pointer-events-none">
                        <AlignLeft className="h-4 w-4" />
                      </div>
                      <textarea
                        className="flex min-h-[80px] w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 pl-10 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Observaciones adicionales..."
                        value={formData.notes}
                        onChange={(e) => handleChange('notes', e.target.value)}
                        style={{ borderRadius: tokens.radius.input }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={onClose} className="rounded-full px-6" disabled={loading}>
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSubmit} 
                loading={loading}
                className="rounded-full px-8 shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
              >
                {contact ? 'Guardar Cambios' : 'Guardar Contacto'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ClientContactModal;
