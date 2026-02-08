
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '@/lib/i18n';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import LoginLeftPanel from '@/components/auth/LoginLeftPanel';
import LoginForm from '@/components/auth/LoginForm';
import { authService } from '@/services/authService';
import usePageTitle from '@/hooks/usePageTitle';

const LoginPage = () => {
  usePageTitle('Iniciar sesión');
  const navigate = useNavigate();
  const { login, isAuthenticated, userProfile } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // If already authenticated and valid, redirect
  useEffect(() => {
    if (isAuthenticated() && userProfile) {
      const access = authService.validateUserAccess(userProfile);
      if (access.allowed) {
        navigate('/projects');
      }
    }
  }, [isAuthenticated, userProfile, navigate]);

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.email) newErrors.email = t('auth.emailRequired');
    else if (!emailRegex.test(formData.email)) newErrors.email = t('auth.invalidEmail');
    
    if (!formData.password) newErrors.password = t('auth.fillRequired');
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setErrors({});
  
  if (!validate()) return;

  setLoading(true);
  try {
    const result = await authService.loginWithEmail(formData.email, formData.password);
    
    if (result.success) {
      // VALIDACIÓN DE ESTADO DE PERFIL
      const access = authService.validateUserAccess(result.user);

      if (!access.allowed) {
        // Si no está permitido (pendiente o rechazado), cerramos la sesión de Supabase
        // para que no quede un token válido en un perfil no activo
        await authService.logout();
        
        setErrors({ form: access.message });
        toast({
          variant: "warning", // Usamos warning para estados pendientes
          title: t('auth.attention') || "Atención",
          description: access.message // Aquí dirá "Acceso pendiente"
        });
        setLoading(false);
        return; // Detenemos el flujo aquí
      }

      // Si llegó aquí, el acceso es permitido ('aceptado')
      toast({
        title: `${t('auth.welcomeUser')}, ${result.user?.nombre || 'Usuario'}`,
        description: t('auth.welcome'),
        className: "bg-green-50 border-green-200"
      });
      
      navigate('/projects');
    } else {
      setErrors({ form: result.error });
      toast({
        variant: "destructive",
        title: t('auth.error'),
        description: result.error
      });
    }
  } catch (err) {
    console.error(err);
    setErrors({ form: t('auth.invalidCredentials') });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F5F5] p-4">
      {/* Left Panel - 50% width on desktop */}
      <div className="hidden md:block md:w-1/2 lg:w-1/2 h-screen sticky top-0">
        <LoginLeftPanel />
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full md:w-1/2 lg:w-1/2 flex items-center justify-center p-4">
        <LoginForm 
          email={formData.email}
          password={formData.password}
          rememberMe={formData.rememberMe}
          showPassword={showPassword}
          loading={loading}
          errors={errors}
          onEmailChange={(e) => setFormData({...formData, email: e.target.value})}
          onPasswordChange={(e) => setFormData({...formData, password: e.target.value})}
          onRememberMeChange={(checked) => setFormData({...formData, rememberMe: checked})}
          onTogglePassword={() => setShowPassword(!showPassword)}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default LoginPage;
