
import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatCurrencyARS, formatCurrencyUSD } from '@/lib/formatUtils';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const RankingObras = ({ data = [], loading = false, moneda = 'ARS' }) => {
  const format = moneda === 'USD' ? formatCurrencyUSD : formatCurrencyARS;

  // Filter top and bottom 5
  const top5 = [...data].slice(0, 5);
  // Bottom 5 are the last 5 reversed (worst first)
  const bottom5 = [...data].slice(-5).reverse();

  const renderList = (items, isTop) => {
    if (!items.length) {
      return <div className="p-8 text-center text-xs text-slate-400">No hay datos suficientes</div>;
    }
    
    // Find max value for progress bar scaling
    const maxVal = Math.max(...items.map(i => Math.abs(i.beneficio)), 1);

    return (
      <div className="space-y-3 mt-4">
        {items.map((item, idx) => {
          const isPositive = item.beneficio >= 0;
          const percent = Math.min((Math.abs(item.beneficio) / maxVal) * 100, 100);
          
          return (
            <div key={item.id || idx} className="group flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px]" title={item.name}>
                  {item.name}
                </span>
                <span className={cn(
                  "font-bold font-mono",
                  isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                )}>
                  {format(item.beneficio)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                 <div 
                   className={cn("h-full rounded-full transition-all duration-500", isPositive ? "bg-emerald-500" : "bg-rose-500")}
                   style={{ width: `${percent}%` }}
                 />
              </div>
              <div className="flex justify-end">
                <span className="text-[10px] text-slate-400">
                  Margen: <span className={item.margen >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{item.margen?.toFixed(1)}%</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="h-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Ranking de Proyectos</h3>
      </div>
      
      <div className="p-4 flex-1">
        {loading ? (
          <div className="h-full flex items-center justify-center">
             <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <Tabs defaultValue="top" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-8 bg-slate-100 dark:bg-slate-800 p-0.5 mb-2">
              <TabsTrigger 
                value="top" 
                className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm"
              >
                Top 5 (Beneficio)
              </TabsTrigger>
              <TabsTrigger 
                value="bottom" 
                className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm"
              >
                Bottom 5
              </TabsTrigger>
            </TabsList>

            <TabsContent value="top">
              {renderList(top5, true)}
            </TabsContent>
            <TabsContent value="bottom">
              {renderList(bottom5, false)}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Card>
  );
};

export default RankingObras;
