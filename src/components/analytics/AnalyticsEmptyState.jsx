
import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeProvider';

const AnalyticsEmptyState = () => {
  const { t } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center rounded-[12px] border border-gray-200 dark:border-[#374151] bg-white dark:bg-[#111827] shadow-sm p-12 text-center max-w-2xl mx-auto mt-8"
    >
      <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-6 shadow-inner">
        <BarChart3 className="w-10 h-10 text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
      </div>

      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
        {t('analytics.noDataTitle')}
      </h3>

      <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-8 text-sm leading-relaxed">
        {t('analytics.noDataDesc')}
      </p>
    </motion.div>
  );
};

export default AnalyticsEmptyState;
