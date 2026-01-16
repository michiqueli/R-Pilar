
import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Plus, X, Check } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { cn } from '@/lib/utils';
import { tokens } from '@/lib/designTokens';
import { useTheme } from '@/contexts/ThemeProvider';
import ClientQuickCreateModal from './ClientQuickCreateModal';

const ClientSearchSelect = ({ value, onChange, placeholder = "Buscar cliente..." }) => {
  const { t } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch selected client details on mount if value exists
  useEffect(() => {
    const fetchSelected = async () => {
      if (value && !selectedClient) {
        const { data } = await supabase
          .from('clients')
          .select('id, name')
          .eq('id', value)
          .single();
        if (data) setSelectedClient(data);
      } else if (!value) {
        setSelectedClient(null);
      }
    };
    fetchSelected();
  }, [value]);

  // Search clients
  useEffect(() => {
    const searchClients = async () => {
      // Don't search if we haven't typed enough unless we open dropdown
      if (!isOpen) return;
      
      setLoading(true);
      try {
        let query = supabase
          .from('clients')
          .select('id, name, tax_id, email')
          .eq('is_deleted', false)
          .eq('status', 'active')
          .order('name')
          .limit(10);

        if (search) {
          query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,tax_id.ilike.%${search}%`);
        }

        const { data } = await query;
        setClients(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchClients, 300);
    return () => clearTimeout(timeoutId);
  }, [search, isOpen]);

  // Outside click handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (client) => {
    setSelectedClient(client);
    onChange(client.id);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedClient(null);
    onChange(null);
    setSearch('');
  };

  const handleQuickCreateSuccess = (newClient) => {
    setSelectedClient(newClient);
    onChange(newClient.id);
    setShowQuickCreate(false);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger / Input Area */}
      <div
        className={cn(
          "flex items-center min-h-[44px] w-full rounded-xl border px-3 py-2 text-sm transition-all cursor-text",
          isOpen ? "ring-2 ring-[var(--theme-ring)] border-[var(--theme-primary)]" : "border-[var(--theme-border)] hover:border-slate-300 dark:hover:border-slate-700",
          "bg-[var(--theme-input)]"
        )}
        onClick={() => {
            setIsOpen(true);
            if(inputRef.current) inputRef.current.focus();
        }}
      >
        <Search className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
        
        {selectedClient && !isOpen ? (
          <div className="flex-1 flex items-center justify-between">
            <span className="font-medium text-[var(--theme-foreground)]">{selectedClient.name}</span>
            <button 
              onClick={handleClear}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-red-500"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <input
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none placeholder:text-slate-400 text-[var(--theme-foreground)]"
            placeholder={selectedClient ? selectedClient.name : placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsOpen(true)}
          />
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div 
          className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          style={{ borderRadius: tokens.radius.card }}
        >
          <div className="max-h-[240px] overflow-y-auto p-1.5 space-y-1">
            {loading ? (
              <div className="p-4 text-center text-sm text-slate-400">{t('common.loading')}</div>
            ) : clients.length > 0 ? (
              clients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => handleSelect(client)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors",
                    selectedClient?.id === client.id 
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" 
                      : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-500 font-semibold text-xs">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{client.name}</div>
                    {client.tax_id && <div className="text-xs text-slate-400">{client.tax_id}</div>}
                  </div>
                  {selectedClient?.id === client.id && <Check className="h-4 w-4" />}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-slate-500">
                {search ? t('messages.no_clients_found') : "Escribe para buscar..."}
              </div>
            )}
          </div>
          
          {/* Quick Create Action */}
          {search && !clients.find(c => c.name.toLowerCase() === search.toLowerCase()) && (
             <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <button
                   onClick={() => setShowQuickCreate(true)}
                   className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[var(--theme-primary)] text-[var(--theme-primary-foreground)] text-sm font-medium hover:brightness-110 transition-all shadow-sm"
                >
                   <Plus className="h-4 w-4" />
                   Crear "{search}"
                </button>
             </div>
          )}
        </div>
      )}

      {/* Quick Create Modal */}
      <ClientQuickCreateModal
        isOpen={showQuickCreate}
        onClose={() => setShowQuickCreate(false)}
        onSuccess={handleQuickCreateSuccess}
        initialName={search}
      />
    </div>
  );
};

export default ClientSearchSelect;
