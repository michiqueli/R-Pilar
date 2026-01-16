
import React from 'react';
import { t } from '@/lib/i18n';
import { Building2, TrendingUp, BarChart3 } from 'lucide-react';

const FeatureItem = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-4 text-white/90">
    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
      <Icon className="w-6 h-6 text-[#FFC107]" />
    </div>
    <span className="text-lg font-medium">{text}</span>
  </div>
);

const LoginLeftPanel = () => {
  return (
    <div className="hidden md:flex flex-col justify-between w-full h-full bg-[#1A2332] p-10 lg:p-16 relative overflow-hidden">
      {/* Decorative Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-[#FFC107]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand */}
      <div className="relative z-10">
        <h1 className="text-2xl font-bold tracking-widest text-white mb-2">CAISHA S R L</h1>
        <div className="h-1 w-12 bg-[#FFC107] rounded-full" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 space-y-8">
        <div className="space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
            {t('auth.welcome')}
          </h2>
          <p className="text-xl text-slate-300 font-light max-w-md">
            {t('auth.systemAccess')}
          </p>
        </div>

        <div className="space-y-6 pt-4">
          <FeatureItem icon={Building2} text={t('auth.featureConstruction')} />
          <FeatureItem icon={TrendingUp} text={t('auth.featureMovements')} />
          <FeatureItem icon={BarChart3} text={t('auth.featureReports')} />
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10">
        <p className="text-xs text-slate-500 font-medium">
          {t('auth.copyright')}
        </p>
      </div>
    </div>
  );
};

export default LoginLeftPanel;
