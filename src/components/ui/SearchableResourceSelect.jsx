
import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, Check, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { cn } from '@/lib/utils';
import { tokens } from '@/lib/designTokens';
import { useTheme } from '@/contexts/ThemeProvider';

/**
 * Generic Searchable Select for Resources (Projects, Accounts, Providers)
 * @param {string} table - Table name to query
 * @param {string} labelField - Field to display (e.g., 'name')
 * @param {string} value - Selected ID
 * @param {function} onChange - Callback (id, object) => void
 * @param {string} placeholder
 * @param {boolean} quickCreate - Show quick create button if no results
 * @param {function} onQuickCreate - Callback to trigger create modal
 */
const SearchableResourceSelect = ({ 
  table, 
  labelField = 'name', 
  value, 
  onChange, 
  placeholder, 
  quickCreate = false, 
  onQuickCreate,
  className
}) => {
  const { t } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch selected details on mount or value change
  useEffect(() => {
    const fetchSelected = async () => {
      if (value && (!selectedItem || selectedItem.id !== value)) {
        const { data } = await supabase
          .from(table)
          .select('*')
          .eq('id', value)
          .single();
        if (data) setSelectedItem(data);
      } else if (!value) {
        setSelectedItem(null);
      }
    };
    fetchSelected();
  }, [value, table]);

  // Search logic
  useEffect(() => {
    const searchItems = async () => {
      if (!isOpen) return;
      
      setLoading(true);
      try {
        let query = supabase
          .from(table)
          .select('*')
          .eq('is_deleted', false)
          .order(labelField)
          .limit(10);

        // Add filter for active items if column exists (simple check assumption or catch error)
        // For standard tables in this app, they usually have is_active or status
        if (table === 'projects') query = query.neq('status', 'archived');
        if (table === 'providers' || table === 'accounts') query = query.eq('is_active', true);

        if (search) {
          query = query.ilike(labelField, `%${search}%`);
        }

        const { data } = await query;
        setItems(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchItems, 300);
    return () => clearTimeout(timeoutId);
  }, [search, isOpen, table, labelField]);

  // Outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    setSelectedItem(item);
    onChange(item.id, item);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedItem(null);
    onChange(null, null);
    setSearch('');
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <div
        className={cn(
          "flex items-center min-h-[42px] w-full rounded-xl border px-3 py-2 text-sm transition-all cursor-text bg-white dark:bg-slate-950",
          isOpen ? "ring-2 ring-[var(--theme-ring)] border-[var(--theme-primary)]" : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
        )}
        style={{ borderRadius: tokens.radius.input }}
        onClick={() => {
            setIsOpen(true);
            if(inputRef.current) inputRef.current.focus();
        }}
      >
        <Search className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
        
        {selectedItem && !isOpen ? (
          <div className="flex-1 flex items-center justify-between overflow-hidden">
            <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{selectedItem[labelField]}</span>
            <button 
              onClick={handleClear}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-red-500 transition-colors ml-1 flex-shrink-0"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <input
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none placeholder:text-slate-400 text-slate-900 dark:text-white min-w-0"
            placeholder={selectedItem ? selectedItem[labelField] : (placeholder || t('common.search'))}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsOpen(true)}
          />
        )}
        <ChevronDown className="h-4 w-4 text-slate-400 ml-2 flex-shrink-0 opacity-50" />
      </div>

      {isOpen && (
        <div 
          className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          style={{ borderRadius: tokens.radius.card }}
        >
          <div className="max-h-[200px] overflow-y-auto p-1.5 space-y-1">
            {loading ? (
              <div className="p-4 text-center text-sm text-slate-400">{t('common.loading')}</div>
            ) : items.length > 0 ? (
              items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors",
                    selectedItem?.id === item.id 
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" 
                      : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                  )}
                >
                  <div className="flex-1 min-w-0 font-medium truncate">{item[labelField]}</div>
                  {selectedItem?.id === item.id && <Check className="h-4 w-4 flex-shrink-0" />}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-slate-500">
                {search ? t('messages.no_results') : t('common.search')}
              </div>
            )}
          </div>
          
          {quickCreate && search && !items.find(i => i[labelField].toLowerCase() === search.toLowerCase()) && (
             <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <button
                   onClick={(e) => {
                     e.stopPropagation();
                     onQuickCreate(search);
                     setIsOpen(false);
                   }}
                   className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[var(--theme-primary)] text-[var(--theme-primary-foreground)] text-sm font-medium hover:brightness-110 transition-all shadow-sm"
                >
                   <Plus className="h-4 w-4" />
                   {t('common.create')} "{search}"
                </button>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableResourceSelect;
