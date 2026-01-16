
import React from 'react';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/contexts/ThemeProvider';
import { tokens } from '@/lib/designTokens';

const WorkItemCosts = ({ workItem, expenses }) => {
  const { t } = useTheme();

  // Calculate costs
  const actualCost = expenses
    .filter(e => e.work_item_id === workItem.id && !e.is_deleted)
    .reduce((sum, e) => sum + (parseFloat(e.amount_ars || e.amount || 0)), 0);

  const budget = parseFloat(workItem.estimated_budget || 0);
  const deviation = budget - actualCost;
  const deviationPercent = budget > 0 ? (deviation / budget) * 100 : 0;
  
  // Color Logic: Positive deviation (Under budget) = Green, Negative (Over budget) = Red
  const isOverBudget = deviation < 0;
  const barColor = isOverBudget ? 'bg-red-500' : 'bg-green-500';
  const textColor = isOverBudget ? 'text-red-600' : 'text-green-600';

  return (
    <div className="space-y-2 text-sm">
      <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 mb-1">
         <div>Estimado: <span className="font-medium text-slate-700 dark:text-slate-300">${budget.toLocaleString()}</span></div>
         <div className="text-right">Real: <span className="font-medium text-slate-700 dark:text-slate-300">${actualCost.toLocaleString()}</span></div>
      </div>
      
      {/* Visual Bar for Budget usage */}
      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
         <div 
           className={`h-full rounded-full transition-all duration-500 ${barColor}`}
           style={{ width: `${Math.min((actualCost / (budget || 1)) * 100, 100)}%` }} 
         />
      </div>

      <div className="flex justify-between items-center text-xs">
         <span className="text-slate-400">Desvío:</span>
         <span className={`font-bold ${textColor}`}>
            {deviation > 0 ? '+' : ''}{deviation.toLocaleString()} ({deviationPercent.toFixed(1)}%)
         </span>
      </div>
    </div>
  );
};

export default WorkItemCosts;
