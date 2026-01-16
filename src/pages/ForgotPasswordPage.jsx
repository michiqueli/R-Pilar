
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { t } from '@/lib/i18n';
import { Mail, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import LoginInput from '@/components/auth/LoginInput';
import LoginButton from '@/components/auth/LoginButton';
import { authService } from '@/services/authService';
import usePageTitle from '@/hooks/usePageTitle';

const ForgotPasswordPage = () => {
  usePageTitle('Recuperar contraseña');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError(t('auth.fillRequired'));
      return;
    }

    setLoading(true);
    try {
      await authService.resetPasswordForEmail(email);
      toast({
        title: t('auth.emailSent'),
        description: t('auth.emailSentDesc'),
        className: "bg-green-50 border-green-200"
      });
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(t('auth.error'));
      toast({
        variant: "destructive",
        title: t('auth.error'),
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F5F5] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 animate-in zoom-in-95 duration-500">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">{t('auth.recoverPassword')}</h1>
            <p className="text-slate-500">{t('auth.recoverSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <LoginInput
              label={t('auth.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              icon={Mail}
              error={error}
              disabled={loading}
            />

            <LoginButton
              type="submit"
              label={loading ? t('auth.sending') : t('auth.sendInstructions')}
              loading={loading}
              fullWidth
              variant="primary"
            />
          </form>

          <div className="text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('auth.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
