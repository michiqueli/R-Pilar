
import React from 'react';
import { motion } from 'framer-motion';

const SettingsCard = ({ title, icon: Icon, description, children }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-[var(--color-bg)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] border border-[var(--color-border)] p-5 md:p-6 overflow-hidden transition-all duration-200"
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-[var(--radius-md)] shrink-0 flex items-center justify-center">
          <Icon className="w-6 h-6 text-[var(--color-primary)]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[var(--color-text)] leading-tight">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-[var(--color-muted-text)] mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      
      <div className="pl-0 md:pl-[68px]">
        {children}
      </div>
    </motion.div>
  );
};

export default SettingsCard;
