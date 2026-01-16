
import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

const SettingsColorPicker = ({ colors, value, onChange }) => {
  return (
    <div className="flex flex-wrap gap-4">
      {colors.map((color) => {
        const isSelected = value === color.id || value === color.hex;
        
        return (
          <motion.button
            key={color.id}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange(color)}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150
              ${isSelected 
                ? 'ring-2 ring-offset-2 ring-[var(--color-text)] ring-offset-[var(--color-bg)]' 
                : 'border-2 border-[var(--color-border)] hover:border-gray-400'}
            `}
            style={{ backgroundColor: color.hex }}
            title={color.name}
            type="button"
          >
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Check className="w-5 h-5 text-white drop-shadow-sm" strokeWidth={3} />
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

export default SettingsColorPicker;
