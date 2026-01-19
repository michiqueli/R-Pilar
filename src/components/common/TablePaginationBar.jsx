import React from 'react';

const TablePaginationBar = ({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  labels = {},
  className = ''
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = totalItems === 0 ? 0 : Math.min(page * pageSize, totalItems);

  const mergedLabels = {
    showing: 'Mostrando',
    of: 'de',
    rowsPerPage: 'Filas por pág:',
    previous: 'Anterior',
    next: 'Siguiente',
    ...labels
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <div
      className={`bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}
    >
      <div className="text-sm text-slate-500 dark:text-slate-400 font-medium px-2">
        {mergedLabels.showing} {start} - {end} {mergedLabels.of} {totalItems}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">{mergedLabels.rowsPerPage}</span>
          <select
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg py-1 px-2 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full p-1 shadow-sm">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            {mergedLabels.previous}
          </button>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            {mergedLabels.next}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TablePaginationBar;
