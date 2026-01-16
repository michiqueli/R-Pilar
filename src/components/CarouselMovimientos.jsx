
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Eye, Calendar, DollarSign, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrencyARS, formatDate } from '@/lib/formatUtils';
import { cn } from '@/lib/utils';

const CarouselMovimientos = ({ 
  items = [], 
  titulo, 
  tipo = 'PAGO', // 'PAGO' or 'COBRO'
  onViewAll, 
  onItemClick 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef(null);

  const isPago = tipo === 'PAGO';
  const colorClass = isPago ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400';
  const bgClass = isPago ? 'bg-red-50 dark:bg-red-900/10' : 'bg-emerald-50 dark:bg-emerald-900/10';
  const borderClass = isPago ? 'border-red-100 dark:border-red-900/20' : 'border-emerald-100 dark:border-emerald-900/20';

  useEffect(() => {
    if (items.length <= 1 || isPaused) return;

    timeoutRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 4000); // 4 seconds per slide

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIndex, items.length, isPaused]);

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  if (!items || items.length === 0) {
    return (
      <div className="h-full min-h-[160px] rounded-xl border border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center p-6 text-center bg-gray-50/50 dark:bg-gray-900/50">
        <div className={`p-3 rounded-full mb-3 ${bgClass}`}>
          <Wallet className={`w-5 h-5 ${colorClass}`} />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{titulo}</h3>
        <p className="text-xs text-gray-500">No hay movimientos pendientes</p>
      </div>
    );
  }

  const currentItem = items[currentIndex];

  return (
    <div 
      className="relative flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center justify-between p-4 pb-2">
        <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
          {titulo}
          <span className="text-xs font-normal text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            {currentIndex + 1}/{items.length}
          </span>
        </h3>
        <Button variant="ghost" size="sm" onClick={onViewAll} className="h-6 text-xs text-blue-600 hover:text-blue-700 p-0 hover:bg-transparent">
          Ver todos
        </Button>
      </div>

      <div className="flex-1 relative p-4 pt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "rounded-lg p-4 border cursor-pointer transition-all hover:shadow-md h-full flex flex-col justify-between",
              bgClass,
              borderClass
            )}
            onClick={() => onItemClick(currentItem)}
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {currentItem.cuentas?.titulo || 'Cuenta principal'}
                </span>
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20", colorClass)}>
                  {currentItem.estado}
                </span>
              </div>
              
              <h4 className="font-bold text-gray-900 dark:text-white text-base line-clamp-2 mb-3">
                {currentItem.descripcion}
              </h4>
            </div>

            <div className="flex items-end justify-between mt-auto">
              <div className="space-y-1">
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                  {formatDate(currentItem.fecha)}
                </div>
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-medium mr-1">{currentItem.providers?.name || currentItem.inversionistas?.nombre || 'Sin entidad'}</span>
                </div>
              </div>
              
              <div className={cn("text-lg font-bold font-mono", colorClass)}>
                {formatCurrencyARS(currentItem.monto_ars || currentItem.amount)}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        {items.length > 1 && (
          <>
            <button 
              onClick={handlePrev}
              className="absolute left-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white dark:bg-slate-800 shadow-md border border-gray-100 dark:border-gray-700 text-gray-500 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={handleNext}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white dark:bg-slate-800 shadow-md border border-gray-100 dark:border-gray-700 text-gray-500 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Progress Bar */}
      {items.length > 1 && !isPaused && (
        <div className="h-1 bg-gray-100 dark:bg-gray-800 w-full">
           <motion.div 
             key={currentIndex}
             initial={{ width: "0%" }}
             animate={{ width: "100%" }}
             transition={{ duration: 4, ease: "linear" }}
             className={cn("h-full", isPago ? "bg-red-500" : "bg-emerald-500")}
           />
        </div>
      )}
    </div>
  );
};

export default CarouselMovimientos;
