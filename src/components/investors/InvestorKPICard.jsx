
import React from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatCurrencyARS, formatCurrencyUSD } from '@/lib/formatUtils';
import KpiCard from '@/components/ui/KpiCard';

const ICONS = {
  green: TrendingUp,
  red: TrendingDown,
  blue: Wallet
};

const InvestorKPICard = ({ label, usdValue, arsValue, color, onClick }) => {
  const icon = ICONS[color] || Wallet;
  const tone = color === 'green' ? 'emerald' : color === 'red' ? 'red' : 'blue';

  return (
    <KpiCard
      title={label}
      value={formatCurrencyUSD(usdValue)}
      secondaryValue={formatCurrencyARS(arsValue)}
      icon={icon}
      tone={tone}
      onClick={onClick}
      showBar
    />
  );
};

export default InvestorKPICard;
