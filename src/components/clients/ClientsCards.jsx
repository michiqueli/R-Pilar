
import React from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, Phone, Mail, User, Briefcase, Eye, Edit, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';

const ClientsCards = ({ clients, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const { t } = useTheme();

  const getAvatarColor = (name) => {
    const colors = [
      'bg-red-100 text-red-700', 'bg-blue-100 text-blue-700', 
      'bg-green-100 text-green-700', 'bg-orange-100 text-orange-700',
      'bg-purple-100 text-purple-700', 'bg-pink-100 text-pink-700'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  if (clients.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 col-span-full">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">{t('clients.noResults')}</h3>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
      {clients.map((client, index) => (
        <motion.div
          key={client.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="group"
        >
          <div 
             className="rounded-[12px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm p-4 transition-all duration-150 ease-out hover:shadow-md dark:hover:shadow-md hover:-translate-y-0.5 cursor-pointer h-full flex flex-col"
             onClick={() => navigate(`/clients/${client.id}`)}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner ${getAvatarColor(client.name)}`}>
                  {client.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                   <h3 className="font-bold text-slate-900 dark:text-white text-[16px] line-clamp-1 leading-tight mb-1" title={client.name}>{client.name}</h3>
                   <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">{client.tax_id || 'N/A'}</span>
                      <span className={cn(
                         "rounded-full px-3 py-1 text-xs font-semibold",
                         client.status === 'active' 
                           ? "bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300" 
                           : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                      )}>
                         {client.status === 'active' ? t('clients.active') : t('clients.inactive')}
                      </span>
                   </div>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="iconSm" 
                    className="rounded-full -mr-2 -mt-2 hover:bg-slate-100 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-4 h-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-xl">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/clients/${client.id}`); }}>
                    <Eye className="w-4 h-4 mr-2" /> {t('common.view') || 'Ver'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(client); }}>
                    <Edit className="w-4 h-4 mr-2" /> {t('common.edit') || 'Editar'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(client); }} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                    <Trash2 className="w-4 h-4 mr-2" /> {t('common.delete') || 'Eliminar'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Content info */}
            <div className="space-y-3 flex-1 mb-6">
               <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-2">
                   {client.contact_name && (
                     <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="truncate font-medium">{client.contact_name}</span>
                     </div>
                   )}
                   {(client.phone || client.email) ? (
                     <>
                        {client.phone && (
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Phone className="w-4 h-4 text-slate-400" />
                            <span className="truncate">{client.phone}</span>
                          </div>
                        )}
                        {client.email && (
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <span className="truncate" title={client.email}>{client.email}</span>
                          </div>
                        )}
                     </>
                   ) : (
                     <span className="text-xs text-slate-400 italic pl-1">Sin datos de contacto</span>
                   )}
               </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
               <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                 <Briefcase className="w-3.5 h-3.5" />
                 {client.projects_count || 0} {t('clients.projects')}
               </div>
               
               <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Calendar className="w-3 h-3" />
                  <span>Activo hace 2d</span>
               </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ClientsCards;
