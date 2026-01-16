
import React, { useState, useEffect } from 'react';
import { Plus, User, Phone, Mail, MoreVertical, Edit, Trash2, Star, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ClientContactModal from './ClientContactModal';
import { Chip } from '@/components/ui/Chip';

const ClientContactsTab = ({ clientId }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const { toast } = useToast();

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_contacts')
        .select('*')
        .eq('client_id', clientId)
        .order('is_primary', { ascending: false })
        .order('name', { ascending: true });
        
      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los contactos' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) fetchContacts();
  }, [clientId]);

  const handleDelete = async (contact) => {
    if (!window.confirm('¿Estás seguro de eliminar este contacto?')) return;
    try {
      const { error } = await supabase.from('client_contacts').delete().eq('id', contact.id);
      if (error) throw error;
      toast({ title: 'Éxito', description: 'Contacto eliminado' });
      fetchContacts();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleMarkPrimary = async (contact) => {
    try {
      // Unset others
      await supabase.from('client_contacts').update({ is_primary: false }).eq('client_id', clientId);
      // Set this one
      const { error } = await supabase.from('client_contacts').update({ is_primary: true }).eq('id', contact.id);
      if (error) throw error;
      
      toast({ title: 'Éxito', description: 'Marcado como contacto principal' });
      fetchContacts();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Lista de Contactos</h3>
        <Button 
          onClick={() => { setSelectedContact(null); setIsModalOpen(true); }}
          className="rounded-full shadow-sm"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Añadir Contacto
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
           <User className="w-10 h-10 text-slate-300 mx-auto mb-3" />
           <p className="text-slate-500">No hay contactos registrados</p>
        </div>
      ) : (
        <div className="overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cargo</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Teléfono</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Principal</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${contact.is_primary ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white">{contact.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                    {contact.role_title ? (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        {contact.role_title}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                    {contact.phone ? (
                      <div className="flex items-center gap-2">
                         <Phone className="w-3.5 h-3.5 text-slate-400" />
                         {contact.phone}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                    {contact.email ? (
                      <div className="flex items-center gap-2">
                         <Mail className="w-3.5 h-3.5 text-slate-400" />
                         {contact.email}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {contact.is_primary && (
                      <Chip label="Principal" variant="warning" size="sm" />
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="iconSm" className="rounded-full">
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedContact(contact); setIsModalOpen(true); }}>
                          <Edit className="w-4 h-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        {!contact.is_primary && (
                          <DropdownMenuItem onClick={() => handleMarkPrimary(contact)}>
                            <Star className="w-4 h-4 mr-2" /> Marcar Principal
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDelete(contact)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ClientContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchContacts}
        clientId={clientId}
        contact={selectedContact}
      />
    </div>
  );
};

export default ClientContactsTab;
