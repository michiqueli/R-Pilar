
import React from 'react';
import { Info } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeProvider';

const AnalyticsMultiCurrencyBanner = () => {
  const { t } = useTheme();

  return (
    <div className="flex items-center gap-3 rounded-[12px] bg-[#FEF3C7] dark:bg-[#78350F] border border-[#FCD34D] dark:border-[#B45309] shadow-sm px-4 py-3 mb-6 transition-all duration-200">
      <div className="flex-shrink-0">
        <Info className="w-[18px] h-[18px] text-[#B45309] dark:text-[#FCD34D]" />
      </div>
      <p className="text-[14px] font-normal text-[#374151] dark:text-[#FCD34D]">
        {t('analytics.multiCurrencyWarning')}
      </p>
    </div>
  );
};

export default AnalyticsMultiCurrencyBanner;
