
import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeProvider';

const AnalyticsHeader = ({ onExport }) => {
  const { t } = useTheme();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <h1 className="text-[32px] font-bold text-[#1F2937] dark:text-white leading-tight">
        {t('analytics.title')}
      </h1>
      
      <Button 
        variant="outline"
        onClick={onExport}
        className="rounded-full border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium h-9 text-sm"
      >
        <Download className="w-4 h-4 mr-2" />
        {t('analytics.export')}
      </Button>
    </div>
  );
};

export default AnalyticsHeader;
