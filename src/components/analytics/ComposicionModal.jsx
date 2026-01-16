
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import BarraComposicion from '@/components/BarraComposicion';

const ComposicionModal = ({ 
  isOpen, 
  onClose, 
  defaultTab = 'ingresos',
  dataIngresos, 
  dataEgresos,
  moneda 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-white">
            Composición de Flujo
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={defaultTab} className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-900 p-1">
            <TabsTrigger 
              value="ingresos"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 text-xs"
            >
              Ingresos
            </TabsTrigger>
            <TabsTrigger 
              value="egresos"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-rose-600 dark:data-[state=active]:text-rose-400 text-xs"
            >
              Egresos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ingresos" className="space-y-4 mt-6">
            <div className="space-y-4">
               <div>
                  <h4 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Por Proyecto</h4>
                  <BarraComposicion 
                    datos={dataIngresos.datos} 
                    total={dataIngresos.total} 
                    moneda={moneda} 
                  />
               </div>
               <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center text-sm">
                     <span className="font-medium text-slate-600 dark:text-slate-300">Total Ingresos</span>
                     <span className="font-bold text-emerald-600">{dataIngresos.total?.toLocaleString()} {moneda}</span>
                  </div>
               </div>
            </div>
          </TabsContent>

          <TabsContent value="egresos" className="space-y-4 mt-6">
            <div className="space-y-4">
               <div>
                  <h4 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Por Proyecto</h4>
                  <BarraComposicion 
                    datos={dataEgresos.datos} 
                    total={dataEgresos.total} 
                    moneda={moneda} 
                  />
               </div>
               <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center text-sm">
                     <span className="font-medium text-slate-600 dark:text-slate-300">Total Egresos</span>
                     <span className="font-bold text-rose-600">{dataEgresos.total?.toLocaleString()} {moneda}</span>
                  </div>
               </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ComposicionModal;
