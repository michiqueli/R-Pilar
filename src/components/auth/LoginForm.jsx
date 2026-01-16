
import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { t } from '@/lib/i18n';
import LoginInput from './LoginInput';
import LoginButton from './LoginButton';
import { Checkbox } from '@/components/ui/checkbox';

const LoginForm = ({
  email,
  password,
  rememberMe,
  showPassword,
  loading,
  errors,
  onEmailChange,
  onPasswordChange,
  onRememberMeChange,
  onTogglePassword,
  onSubmit
}) => {
  return (
    <div className="w-full max-w-md mx-auto p-6 md:p-8 bg-white md:rounded-2xl md:shadow-lg space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">{t('auth.loginTitle')}</h1>
        <p className="text-slate-500">{t('auth.loginSubtitle')}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-4">
          <LoginInput
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={onEmailChange}
            placeholder={t('auth.emailPlaceholder')}
            icon={Mail}
            error={errors.email}
            disabled={loading}
          />

          <div className="space-y-1">
            <LoginInput
              label={t('auth.password')}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={onPasswordChange}
              placeholder={t('auth.passwordPlaceholder')}
              icon={Lock}
              rightIcon={showPassword ? EyeOff : Eye}
              onRightIconClick={onTogglePassword}
              error={errors.password}
              disabled={loading}
            />
            <div className="flex justify-end">
              <Link 
                to="/forgot-password" 
                className="text-sm font-medium text-[#D9A606] hover:text-[#B38905] transition-colors"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="remember" 
            checked={rememberMe} 
            onCheckedChange={onRememberMeChange}
            className="data-[state=checked]:bg-[#FFC107] data-[state=checked]:border-[#FFC107]"
          />
          <label 
            htmlFor="remember" 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600"
          >
            {t('auth.rememberMe')}
          </label>
        </div>

        <LoginButton
          type="submit"
          label={loading ? t('auth.loggingIn') : t('auth.signIn')}
          loading={loading}
          fullWidth
          variant="primary"
        />

        {errors.form && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 text-center animate-in zoom-in-95">
            {errors.form}
          </div>
        )}
      </form>

      <div className="pt-4 text-center border-t border-slate-100">
        <p className="text-sm text-slate-500">
          {t('auth.noAccess')}{' '}
          <Link 
            to="/request-access" 
            className="font-bold text-slate-900 hover:text-[#D9A606] transition-colors"
          >
            {t('auth.requestAccess')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
