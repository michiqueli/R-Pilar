
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';
import RequestAccessForm from '@/components/auth/RequestAccessForm';
import { requestAccessService } from '@/services/requestAccessService';
import usePageTitle from '@/hooks/usePageTitle';

const RequestAccessPage = () => {
  usePageTitle('Solicitar acceso');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    email: '',
    telefono: '',
    password: '',
    password_confirm: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.nombre_usuario || formData.nombre_usuario.length < 3) {
      newErrors.nombre_usuario = t('auth.usernameLength');
    }
    
    if (!formData.email) {
      newErrors.email = t('auth.fillRequired');
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = t('auth.invalidEmail');
    }

    if (!formData.telefono || formData.telefono.length < 10) {
      newErrors.telefono = t('auth.phoneLength');
    }
    
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = t('auth.passLength');
    }

    if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = t('auth.passMatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await requestAccessService.registerUser({
        nombre_usuario: formData.nombre_usuario,
        email: formData.email,
        telefono: formData.telefono,
        password: formData.password
      });

      if (result.success) {
        toast({
          title: t('auth.success'),
          description: t('auth.requestSent'),
          className: "bg-green-50 border-green-200"
        });
        setTimeout(() => navigate('/login'), 2000);
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
      toast({
        variant: "destructive",
        title: t('auth.error'),
        description: t('auth.genericRegistrationError')
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F5F5] p-4">
      <RequestAccessForm 
        nombre_usuario={formData.nombre_usuario}
        email={formData.email}
        telefono={formData.telefono}
        password={formData.password}
        password_confirm={formData.password_confirm}
        showPassword={showPassword}
        showPasswordConfirm={showPasswordConfirm}
        loading={loading}
        errors={errors}
        onNombreUsuarioChange={(e) => setFormData({...formData, nombre_usuario: e.target.value})}
        onEmailChange={(e) => setFormData({...formData, email: e.target.value})}
        onTelefonoChange={(e) => setFormData({...formData, telefono: e.target.value})}
        onPasswordChange={(e) => setFormData({...formData, password: e.target.value})}
        onPasswordConfirmChange={(e) => setFormData({...formData, password_confirm: e.target.value})}
        onShowPasswordChange={() => setShowPassword(!showPassword)}
        onShowPasswordConfirmChange={() => setShowPasswordConfirm(!showPasswordConfirm)}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default RequestAccessPage;
