
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { tokens } from '@/lib/designTokens';

const PageHeader = ({ title, breadcrumbs = [] }) => {
  // Ensure breadcrumbs is always an array even if passed as null/undefined explicitly
  const safeBreadcrumbs = Array.isArray(breadcrumbs) ? breadcrumbs : [];

  return (
    <div 
      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between mb-8"
      style={{ borderRadius: tokens.radius.card }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-slate-500 w-1/3">
        {safeBreadcrumbs.length > 0 && safeBreadcrumbs.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="w-4 h-4 mx-1" />}
            <span className={index === safeBreadcrumbs.length - 1 ? 'font-medium text-slate-900 dark:text-white' : ''}>
              {item}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Title */}
      <h1 className="text-xl font-bold text-slate-900 dark:text-white w-1/3 text-center">
        {title}
      </h1>

      {/* User Avatar */}
      <div className="w-1/3 flex justify-end">
        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300">
          US
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
