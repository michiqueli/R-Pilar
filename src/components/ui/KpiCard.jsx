import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const TONES = {
  emerald: {
    border: 'border-emerald-200 dark:border-emerald-800',
    gradient: 'from-white to-emerald-50 dark:from-slate-900 dark:to-emerald-950/30',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900',
    text: 'text-emerald-600 dark:text-emerald-400',
    bar: 'bg-emerald-500',
    barTrack: 'bg-emerald-100 dark:bg-emerald-900/50'
  },
  red: {
    border: 'border-red-200 dark:border-red-800',
    gradient: 'from-white to-red-50 dark:from-slate-900 dark:to-red-950/30',
    iconBg: 'bg-red-100 dark:bg-red-900',
    text: 'text-red-600 dark:text-red-400',
    bar: 'bg-red-500',
    barTrack: 'bg-red-100 dark:bg-red-900/50'
  },
  blue: {
    border: 'border-blue-200 dark:border-blue-800',
    gradient: 'from-white to-blue-50 dark:from-slate-900 dark:to-blue-950/30',
    iconBg: 'bg-blue-100 dark:bg-blue-900',
    text: 'text-blue-600 dark:text-blue-400',
    bar: 'bg-blue-500',
    barTrack: 'bg-blue-100 dark:bg-blue-900/50'
  },
  orange: {
    border: 'border-orange-200 dark:border-orange-800',
    gradient: 'from-white to-orange-50 dark:from-slate-900 dark:to-orange-950/30',
    iconBg: 'bg-orange-100 dark:bg-orange-900',
    text: 'text-orange-600 dark:text-orange-400',
    bar: 'bg-orange-500',
    barTrack: 'bg-orange-100 dark:bg-orange-900/50'
  },
  purple: {
    border: 'border-purple-200 dark:border-purple-800',
    gradient: 'from-white to-purple-50 dark:from-slate-900 dark:to-purple-950/30',
    iconBg: 'bg-purple-100 dark:bg-purple-900',
    text: 'text-purple-600 dark:text-purple-400',
    bar: 'bg-purple-500',
    barTrack: 'bg-purple-100 dark:bg-purple-900/50'
  },
  amber: {
    border: 'border-amber-200 dark:border-amber-800',
    gradient: 'from-white to-amber-50 dark:from-slate-900 dark:to-amber-950/30',
    iconBg: 'bg-amber-100 dark:bg-amber-900',
    text: 'text-amber-600 dark:text-amber-400',
    bar: 'bg-amber-500',
    barTrack: 'bg-amber-100 dark:bg-amber-900/50'
  },
  slate: {
    border: 'border-slate-200 dark:border-slate-800',
    gradient: 'from-white to-slate-50 dark:from-slate-900 dark:to-slate-950/30',
    iconBg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-300',
    bar: 'bg-slate-500',
    barTrack: 'bg-slate-100 dark:bg-slate-800/50'
  }
};

const KpiCard = ({
  title,
  value,
  icon: Icon,
  tone = 'blue',
  description,
  secondaryValue,
  showBar = false,
  valueClassName,
  onClick,
  children
}) => {
  const styles = TONES[tone] || TONES.blue;

  return (
    <Card
      className={cn(
        'relative overflow-hidden bg-gradient-to-br',
        styles.border,
        styles.gradient,
        onClick && 'cursor-pointer transition-transform hover:-translate-y-0.5'
      )}
      onClick={onClick}
    >
      {Icon && (
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <Icon className="w-24 h-24" />
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className={cn('text-sm font-medium flex items-center gap-2', styles.text)}>
          {Icon && (
            <div className={cn('p-1.5 rounded-full', styles.iconBg)}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children ? (
          children
        ) : (
          <>
            <div className={cn('text-2xl font-bold text-slate-900 dark:text-white mb-2', valueClassName)}>
              {value}
            </div>
            {secondaryValue && (
              <div className="text-sm text-slate-500 dark:text-slate-400">{secondaryValue}</div>
            )}
            {showBar && (
              <div className={cn('h-1.5 w-full rounded-full overflow-hidden mt-2', styles.barTrack)}>
                <div className={cn('h-full rounded-full', styles.bar)} style={{ width: '100%' }} />
              </div>
            )}
            {description && (
              <p className="text-xs text-slate-500 mt-2">{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default KpiCard;
