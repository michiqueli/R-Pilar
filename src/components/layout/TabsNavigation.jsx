
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { tokens } from '@/lib/designTokens';

const TabsNavigation = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex justify-center mb-8">
      <div 
        className="flex p-1 bg-slate-100 dark:bg-slate-800"
        style={{ borderRadius: tokens.radius.button }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative px-6 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-full",
                isActive 
                  ? "text-slate-900 dark:text-slate-50" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              )}
              style={{ borderRadius: tokens.radius.button }}
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute inset-0 bg-white dark:bg-slate-950 shadow-sm border border-slate-200 dark:border-slate-700"
                  style={{ borderRadius: tokens.radius.button }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabsNavigation;
