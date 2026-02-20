
import { supabase } from '@/lib/customSupabaseClient';
import { t } from '@/lib/i18n';

export const requestAccessService = {
  async registerUser({ nombre_usuario, email, telefono, password }) {
    try {
      // 1. Sign up the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre_usuario,
            telefono
          }
        }
      });

      if (authError) {
        // Check for specific error message
        if (authError.message.includes('User already registered') || authError.message.includes('already registered')) {
           return { success: false, error: t('auth.userAlreadyRegistered') };
        }
        throw authError;
      }

      const user = authData.user;
      
      if (!user) {
         return { success: false, error: t('auth.genericRegistrationError') };
      }

      // 2. Insert into usuarios
      const { error: profileError } = await supabase
        .from('usuarios')
        .insert([{
          user_id: user.id,
          nombre: nombre_usuario,
          email: email,
          telefono: telefono,
          estado: 'pendiente', // Auto-accepted for this flow
          rol: 'TECNICO',     // Default role
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (profileError) {
         console.error('Error creating user profile:', profileError);
         return { success: false, error: t('auth.genericRegistrationError') };
      }

      return { success: true, user };

    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message || t('auth.genericRegistrationError') };
    }
  }
};
