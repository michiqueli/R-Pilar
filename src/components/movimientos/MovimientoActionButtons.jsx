
import React from 'react';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeProvider';
import { tokens } from '@/lib/designTokens';

const MovimientoActionButtons = ({ onCobro, onGasto, projectId }) => {
  const { t } = useTheme();

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={onCobro}
        className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-medium shadow-md hover:shadow-lg transition-all hover:scale-105"
        style={{ borderRadius: tokens.radius.button }}
      >
        <ArrowUpCircle className="w-5 h-5 mr-2" />
        <span className="hidden sm:inline">{t('movimientos.ingreso')}</span>
        <span className="sm:hidden">{t('movimientos.ingreso_short') || 'Cobro'}</span>
      </Button>
      
      <Button
        onClick={onGasto}
        className="bg-[#EF4444] hover:bg-[#DC2626] text-white font-medium shadow-md hover:shadow-lg transition-all hover:scale-105"
        style={{ borderRadius: tokens.radius.button }}
      >
        <ArrowDownCircle className="w-5 h-5 mr-2" />
        <span className="hidden sm:inline">{t('movimientos.gasto')}</span>
        <span className="sm:hidden">{t('movimientos.gasto_short') || 'Gasto'}</span>
      </Button>
    </div>
  );
};

export default MovimientoActionButtons;
