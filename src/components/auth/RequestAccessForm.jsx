
import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, User, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { t } from '@/lib/i18n';
import LoginInput from './LoginInput';
import LoginButton from './LoginButton';

const RequestAccessForm = ({
  nombre_usuario,
  email,
  telefono,
  password,
  password_confirm,
  showPassword,
  showPasswordConfirm,
  loading,
  errors,
  onNombreUsuarioChange,
  onEmailChange,
  onTelefonoChange,
  onPasswordChange,
  onPasswordConfirmChange,
  onShowPasswordChange,
  onShowPasswordConfirmChange,
  onSubmit
}) => {
  return (
    <div className="w-full max-w-md mx-auto p-6 md:p-8 bg-white md:rounded-2xl md:shadow-lg space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">{t('auth.requestTitle')}</h1>
        <p className="text-slate-500">{t('auth.requestSubtitle')}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <LoginInput
          label={t('auth.username')}
          value={nombre_usuario}
          onChange={onNombreUsuarioChange}
          placeholder={t('auth.usernamePlaceholder')}
          icon={User}
          error={errors.nombre_usuario}
          disabled={loading}
        />

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

        <LoginInput
          label={t('auth.phone')}
          type="tel"
          value={telefono}
          onChange={onTelefonoChange}
          placeholder={t('auth.phonePlaceholder')}
          icon={Phone}
          error={errors.telefono}
          disabled={loading}
        />

        <LoginInput
          label={t('auth.password')}
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={onPasswordChange}
          placeholder={t('auth.passwordPlaceholder')}
          icon={Lock}
          rightIcon={showPassword ? EyeOff : Eye}
          onRightIconClick={onShowPasswordChange}
          error={errors.password}
          disabled={loading}
        />

        <LoginInput
          label={t('auth.confirmPassword')}
          type={showPasswordConfirm ? 'text' : 'password'}
          value={password_confirm}
          onChange={onPasswordConfirmChange}
          placeholder={t('auth.passwordPlaceholder')}
          icon={Lock}
          rightIcon={showPasswordConfirm ? EyeOff : Eye}
          onRightIconClick={onShowPasswordConfirmChange}
          error={errors.password_confirm}
          disabled={loading}
        />

        <div className="pt-2">
          <LoginButton
            type="submit"
            label={loading ? t('auth.sending') : t('auth.sendRequest')}
            loading={loading}
            fullWidth
            variant="primary"
          />
        </div>

        {errors.form && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 text-center animate-in zoom-in-95">
            {errors.form}
          </div>
        )}
      </form>

      <div className="text-center border-t border-slate-100 pt-4">
        <Link 
          to="/login" 
          className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          {t('auth.backToLogin')}
        </Link>
      </div>
    </div>
  );
};

export default RequestAccessForm;
