
import React, { useState, useEffect } from 'react';
import { X, User, FileText, Phone, Mail, MapPin, AlignLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { ThemedSelect } from '@/components/ui/themed-components';
import { tokens } from '@/lib/designTokens';

const ClientModal = ({ isOpen, onClose, onSuccess, client = null }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    tax_id: '',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    status: 'active'
  });

  useEffect(() => {
    if (isOpen) {
      if (client) {
        setFormData({
          name: client.name || '',
          tax_id: client.tax_id || '',
          contact_name: client.contact_name || '',
          phone: client.phone || '',
          email: client.email || '',
          address: client.address || '',
          notes: client.notes || '',
          status: client.status || 'active'
        });
      } else {
        setFormData({
          name: '',
          tax_id: '',
          contact_name: '',
          phone: '',
          email: '',
          address: '',
          notes: '',
          status: 'active'
        });
      }
    }
  }, [isOpen, client]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      return toast({ variant: 'destructive', title: 'Error', description: 'El nombre del cliente es obligatorio' });
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        updated_at: new Date().toISOString()
      };

      if (client) {
        const { error } = await supabase.from('clients').update(payload).eq('id', client.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('clients').insert([{ ...payload, is_deleted: false }]);
        if (error) throw error;
      }

      toast({ title: 'Éxito', description: `Cliente ${client ? 'actualizado' : 'creado'} correctamente` });
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
            className="bg-white dark:bg-slate-900 w-full max-w-[900px] rounded-[24px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {client ? 'Editar Cliente' : 'Nuevo Cliente'}
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
                    <Label>Razón Social / Nombre <span className="text-red-500">*</span></Label>
                    <Input
                      icon={User}
                      placeholder="Ej. Acme Corp S.A."
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>NIF / CUIT / TAX ID</Label>
                    <Input
                      icon={FileText}
                      placeholder="Ej. 20-12345678-9"
                      value={formData.tax_id}
                      onChange={(e) => handleChange('tax_id', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Dirección</Label>
                    <Input
                      icon={MapPin}
                      placeholder="Calle Falsa 123, Ciudad"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                    />
                  </div>

                   <div className="space-y-2">
                    <Label>Estado</Label>
                    <ThemedSelect
                      value={formData.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                    >
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                    </ThemedSelect>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Nombre de Contacto</Label>
                    <Input
                      icon={User}
                      placeholder="Ej. Juan Pérez"
                      value={formData.contact_name}
                      onChange={(e) => handleChange('contact_name', e.target.value)}
                    />
                  </div>

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
                      placeholder="contacto@empresa.com"
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
                        className="flex min-h-[80px] w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 pl-10 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Observaciones adicionales..."
                        value={formData.notes}
                        onChange={(e) => handleChange('notes', e.target.value)}
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
                {client ? 'Guardar Cambios' : 'Crear Cliente'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ClientModal;
