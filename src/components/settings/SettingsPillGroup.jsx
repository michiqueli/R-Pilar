
import React from 'react';
import { motion } from 'framer-motion';

const SettingsPillGroup = ({ options, value, onChange, disabled }) => {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((option) => {
        const isActive = value === option.id;
        
        return (
          <motion.button
            key={option.id}
            whileHover={{ scale: 1.02, opacity: 0.9 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => !disabled && onChange(option.id)}
            disabled={disabled}
            className={`
              relative px-5 py-2.5 rounded-[var(--radius-full)] text-sm font-medium transition-all duration-150 border-2
              flex items-center gap-2 cursor-pointer
              ${isActive 
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-blue-50/50 dark:bg-blue-900/10' 
                : 'border-[var(--color-border)] text-[var(--color-muted-text)] bg-transparent hover:border-gray-300 dark:hover:border-gray-600'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {option.icon && <span className="text-lg">{option.icon}</span>}
            <span>{option.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default SettingsPillGroup;
