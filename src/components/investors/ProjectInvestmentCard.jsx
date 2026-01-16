
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrencyARS } from '@/lib/formatUtils';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const ProjectInvestmentCard = ({ project, invested, returned, balance }) => {
  const navigate = useNavigate();
  
  // Determine status color based on balance (simplified logic: positive balance is generally expected for active investments)
  // Green: Active balance > 0
  // Red: Balance <= 0 (either fully returned or loss, though technically 0 balance might be "neutral")
  // For this context: Green if there is net capital invested.
  const statusColor = balance > 0 ? 'bg-green-500' : (balance < 0 ? 'bg-red-500' : 'bg-yellow-500');

  return (
    <div 
      onClick={() => navigate(`/projects/${project.id}`)}
      className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer border border-slate-100 dark:border-slate-800 w-full md:w-[320px] shrink-0 relative overflow-hidden group"
    >
      <div className={`absolute top-0 right-0 w-16 h-16 -mr-4 -mt-4 rounded-full opacity-10 group-hover:opacity-20 transition-opacity ${balance >= 0 ? 'bg-blue-500' : 'bg-orange-500'}`} />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="font-bold text-slate-900 dark:text-white truncate pr-4 text-lg" title={project.name}>
          {project.name}
        </h3>
        <div className={`w-3 h-3 rounded-full ${statusColor}`} title="Status Indicator" />
      </div>

      <div className="space-y-3 relative z-10">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center text-slate-500 gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            <span>Invertido</span>
          </div>
          <span className="font-semibold text-green-600 dark:text-green-400">
            {formatCurrencyARS(invested)}
          </span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center text-slate-500 gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
            <span>Devuelto</span>
          </div>
          <span className="font-semibold text-red-600 dark:text-red-400">
            {formatCurrencyARS(returned)}
          </span>
        </div>

        <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center text-slate-700 dark:text-slate-300 font-medium gap-1.5">
            <DollarSign className="w-4 h-4 text-blue-500" />
            <span>Saldo Neto</span>
          </div>
          <span className="font-bold text-blue-600 dark:text-blue-400 text-base">
            {formatCurrencyARS(balance)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProjectInvestmentCard;
