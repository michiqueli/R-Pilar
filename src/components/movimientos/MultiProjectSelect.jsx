import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Search, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tokens } from '@/lib/designTokens';

/**
 * Selector de múltiples proyectos con tags.
 * Props:
 *  - projects: Array de { id, name }
 *  - selectedIds: Array de IDs seleccionados
 *  - onChange: (newIds) => void
 *  - placeholder: string
 *  - disabled: boolean
 */
const MultiProjectSelect = ({
  projects = [],
  selectedIds = [],
  onChange,
  placeholder = 'Seleccionar proyectos...',
  disabled = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedProjects = projects.filter(p => selectedIds.includes(p.id));
  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    !selectedIds.includes(p.id)
  );

  const handleSelect = (projectId) => {
    onChange([...selectedIds, projectId]);
    setSearch('');
    inputRef.current?.focus();
  };

  const handleRemove = (projectId) => {
    onChange(selectedIds.filter(id => id !== projectId));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' && search === '' && selectedIds.length > 0) {
      handleRemove(selectedIds[selectedIds.length - 1]);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger / Input Area */}
      <div
        onClick={() => { if (!disabled) { setIsOpen(true); inputRef.current?.focus(); } }}
        className={cn(
          'min-h-[42px] px-3 py-1.5 border bg-white dark:bg-slate-950 flex flex-wrap items-center gap-1.5 cursor-text transition-colors',
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20'
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300',
          disabled && 'opacity-50 cursor-not-allowed bg-slate-50'
        )}
        style={{ borderRadius: tokens.radius.input }}
      >
        {/* Selected Tags */}
        {selectedProjects.map(project => (
          <span
            key={project.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
          >
            <Briefcase className="w-3 h-3" />
            <span className="max-w-[120px] truncate">{project.name}</span>
            {!disabled && (
              <button
                onClick={(e) => { e.stopPropagation(); handleRemove(project.id); }}
                className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}

        {/* Search Input */}
        {!disabled && (
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selectedIds.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[80px] bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        )}

        {/* Chevron */}
        <ChevronDown className={cn(
          'w-4 h-4 text-slate-400 transition-transform ml-auto flex-shrink-0',
          isOpen && 'rotate-180'
        )} />
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div
          className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden"
          style={{ borderRadius: tokens.radius.input, maxHeight: '240px' }}
        >
          {filteredProjects.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-400">
              {search ? 'Sin resultados' : 'Todos los proyectos seleccionados'}
            </div>
          ) : (
            <ul className="overflow-y-auto max-h-[240px] py-1">
              {filteredProjects.map(project => (
                <li
                  key={project.id}
                  onClick={() => handleSelect(project.id)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Briefcase className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-200 truncate">
                    {project.name}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Prorrateo info */}
      {selectedIds.length > 1 && (
        <p className="text-[10px] text-slate-400 mt-1.5 ml-1">
          El importe se prorrateará equitativamente entre {selectedIds.length} proyectos
        </p>
      )}
    </div>
  );
};

export default MultiProjectSelect;
