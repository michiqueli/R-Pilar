
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

      // 2. Insert into solicitudes_acceso
      const { error: solicitudError } = await supabase
        .from('solicitudes_acceso')
        .insert([{
          nombre: nombre_usuario,
          email: email,
          telefono: telefono,
          estado: 'aceptado', // Auto-accepted for this flow
          created_at: new Date().toISOString()
        }]);

      if (solicitudError) {
        console.error('Error creating access request:', solicitudError);
        // Continue anyway to try to create the user profile
      }

      // 3. Insert into usuarios
      const { error: profileError } = await supabase
        .from('usuarios')
        .insert([{
          user_id: user.id,
          nombre: nombre_usuario,
          email: email,
          telefono: telefono,
          estado: 'aceptado', // Auto-accepted for this flow
          rol: 'TECNICO',     // Default role
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (profileError) {
         console.error('Error creating user profile:', profileError);
         // If profile creation fails, we might want to cleanup the auth user, 
         // but for now we return error. The user exists in Auth but not in our system.
         return { success: false, error: t('auth.genericRegistrationError') };
      }

      return { success: true, user };

    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message || t('auth.genericRegistrationError') };
    }
  }
};
