
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeProvider';
import { projectService } from '@/services/projectService';
import { Activity, Loader2 } from 'lucide-react';
import KpiCard from '@/components/ui/KpiCard';

const GlobalProgressKPI = ({ projectId }) => {
  const { t } = useTheme();
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) fetchGlobalProgress();
  }, [projectId]);

  const fetchGlobalProgress = async () => {
    setLoading(true);
    try {
      // Fetch breakdown to get weighted progress of all partidas
      const items = await projectService.getPartidaBreakdown(projectId);
      
      let totalBudget = 0;
      let weightedProgressSum = 0;
      let totalItems = 0;
      let simpleProgressSum = 0;

      items.forEach(item => {
        const budget = Number(item.budget || 0);
        const p = Number(item.progress || 0);
        
        if (budget > 0) {
          totalBudget += budget;
          weightedProgressSum += (p * budget);
        }
        
        simpleProgressSum += p;
        totalItems++;
      });

      let calculatedProgress = 0;
      if (totalBudget > 0) {
        calculatedProgress = weightedProgressSum / totalBudget;
      } else if (totalItems > 0) {
        calculatedProgress = simpleProgressSum / totalItems;
      }

      setProgress(Math.round(calculatedProgress));
    } catch (error) {
      console.error("Error calculating global progress:", error);
    } finally {
      setLoading(false);
    }
  };

  // Donut Chart Configuration
  const size = 180;
  const strokeWidth = 16;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <KpiCard
      title={t('projects.avanceGlobal')}
      icon={Activity}
      tone="blue"
    >
      <div className="text-center mb-6">
        <p className="text-xs text-slate-500 mt-1">
          {t('projects.promediosPonderado')}
        </p>
      </div>

      <div className="relative flex items-center justify-center">
        {loading ? (
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        ) : (
          <>
            {/* SVG Donut */}
            <svg width={size} height={size} className="transform -rotate-90">
              {/* Background Circle */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-slate-100 dark:text-slate-800"
              />
              {/* Progress Circle */}
              <motion.circle
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeLinecap="round"
                className="text-blue-600 dark:text-blue-500"
              />
            </svg>
            
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-4xl font-bold text-slate-900 dark:text-white"
              >
                {progress}%
              </motion.span>
            </div>
          </>
        )}
      </div>
      
      {!loading && (
        <div className="mt-6 flex items-center gap-2 text-sm text-slate-500 justify-center">
           <div className="w-3 h-3 rounded-full bg-blue-600"></div>
           <span>Completado</span>
           <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800 ml-4"></div>
           <span>Restante</span>
        </div>
      )}
    </KpiCard>
  );
};

export default GlobalProgressKPI;
