
import React from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, Phone, Mail, User, Briefcase, Eye, Edit, Trash2, ArrowUpDown } from 'lucide-react';
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

const ClientsTable = ({ 
  clients, 
  columns, 
  onEdit, 
  onDelete,
  sortConfig,
  onSort,
  pagination,
  onPageChange,
  onLimitChange
}) => {
  const navigate = useNavigate();
  const { t } = useTheme();

  // Avatar color generator based on name hash
  const getAvatarColor = (name) => {
    const colors = [
      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', 
      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', 
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', 
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', 
      'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
      'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300', 
      'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', 
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
      'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300', 
      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300', 
      'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
      'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="w-3 h-3 ml-1 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return <ArrowUpDown className={`w-3 h-3 ml-1 ${sortConfig.direction === 'asc' ? 'text-blue-600 rotate-0' : 'text-blue-600 rotate-180'} transition-transform`} />;
  };

  const handleHeaderClick = (column) => {
    onSort(column);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[12px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                {columns.name && (
                  <th 
                    className="text-left py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors group select-none"
                    onClick={() => handleHeaderClick('name')}
                  >
                    <div className="flex items-center">
                      {t('clients.name')} <SortIcon column="name" />
                    </div>
                  </th>
                )}
                {columns.contact && <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('clients.contact')}</th>}
                {columns.phone && <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('clients.phone')}</th>}
                {columns.email && (
                  <th 
                    className="text-left py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors group select-none"
                    onClick={() => handleHeaderClick('email')}
                  >
                    <div className="flex items-center">
                      {t('clients.email')} <SortIcon column="email" />
                    </div>
                  </th>
                )}
                {columns.projects && <th className="text-center py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('clients.projects')}</th>}
                {columns.actions && <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('clients.actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {clients.map((client, index) => (
                <motion.tr
                  key={client.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 ease-out group"
                >
                  {columns.name && (
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white dark:ring-slate-900",
                          getAvatarColor(client.name)
                        )}>
                          {client.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-[16px] text-slate-900 dark:text-white line-clamp-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onClick={() => navigate(`/clients/${client.id}`)}>
                            {client.name}
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="text-[14px] text-slate-500 dark:text-slate-400">{client.email || '-'}</div>
                             {client.tax_id && (
                                <>
                                  <span className="text-slate-300 dark:text-slate-600">•</span>
                                  <span className="text-xs text-slate-500 dark:text-slate-400">{client.tax_id}</span>
                                </>
                             )}
                          </div>
                          <div className="mt-1">
                             <span className={cn(
                               "rounded-full px-3 py-1 text-xs font-semibold inline-block",
                               client.status === 'active' 
                                 ? "bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300"
                                 : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                             )}>
                               {client.status === 'active' ? t('clients.active') : t('clients.inactive')}
                             </span>
                          </div>
                        </div>
                      </div>
                    </td>
                  )}
                  {columns.contact && (
                    <td className="py-4 px-6">
                      {client.contact_name ? (
                        <div className="flex flex-col">
                           <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{client.contact_name}</span>
                        </div>
                      ) : <span className="text-slate-400 text-sm">-</span>}
                    </td>
                  )}
                  {columns.phone && (
                    <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                       {client.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {client.phone}
                        </div>
                      ) : '-'}
                    </td>
                  )}
                  {columns.email && (
                    <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                       {client.email ? (
                        <div className="flex items-center gap-2 group-hover/email:text-blue-600 dark:group-hover/email:text-blue-400 transition-colors cursor-pointer" title={client.email}>
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[150px]">{client.email}</span>
                        </div>
                      ) : '-'}
                    </td>
                  )}
                  {columns.projects && (
                    <td className="py-4 px-6 text-center">
                      <div className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border",
                        client.projects_count > 0 
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-transparent" 
                          : "bg-slate-50 text-slate-400 border-slate-100 dark:bg-slate-900 dark:text-slate-600 dark:border-slate-800"
                      )}>
                        <Briefcase className="w-3 h-3 mr-1.5 opacity-70" />
                        {client.projects_count || 0}
                      </div>
                    </td>
                  )}
                  {columns.actions && (
                    <td className="py-4 px-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="iconSm" className="rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 data-[state=open]:bg-slate-200 dark:data-[state=open]:bg-slate-700">
                            <MoreVertical className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-lg border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                          <DropdownMenuItem onClick={() => navigate(`/clients/${client.id}`)} className="rounded-lg cursor-pointer dark:focus:bg-slate-800">
                            <Eye className="w-4 h-4 mr-2 text-slate-400" /> {t('clients.view')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(client)} className="rounded-lg cursor-pointer dark:focus:bg-slate-800">
                            <Edit className="w-4 h-4 mr-2 text-slate-400" /> {t('clients.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="dark:bg-slate-800" />
                          <DropdownMenuItem onClick={() => onDelete(client)} className="rounded-lg cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/20 dark:text-red-400 dark:focus:text-red-300">
                            <Trash2 className="w-4 h-4 mr-2" /> {t('clients.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </motion.tr>
              ))}
              {clients.length === 0 && (
                <tr>
                   <td colSpan="100%" className="py-12 text-center text-slate-500 dark:text-slate-400">
                      {t('clients.noResults')}
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
           <div className="text-sm text-slate-500 dark:text-slate-400">
              Mostrando <span className="font-medium text-slate-900 dark:text-white">{Math.min(pagination.total, (pagination.page - 1) * pagination.limit + 1)}</span> a <span className="font-medium text-slate-900 dark:text-white">{Math.min(pagination.total, pagination.page * pagination.limit)}</span> de <span className="font-medium text-slate-900 dark:text-white">{pagination.total}</span> clientes
           </div>
           
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <span className="text-xs text-slate-500 dark:text-slate-400">Filas por pág:</span>
                 <select 
                    className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg py-1 px-2 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    value={pagination.limit}
                    onChange={(e) => onLimitChange(Number(e.target.value))}
                 >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                 </select>
              </div>

              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full p-1 shadow-sm">
                 <button 
                    onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                 >
                    Anterior
                 </button>
                 <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>
                 <button 
                    onClick={() => onPageChange(pagination.page + 1)}
                    disabled={pagination.page * pagination.limit >= pagination.total}
                    className="px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                 >
                    Siguiente
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ClientsTable;
