
import { supabase } from '@/lib/customSupabaseClient';
import { t } from '@/lib/i18n';

export const authService = {
  // Login with email and password
  async loginWithEmail(email, password) {
    try {
      // 1. Authenticate with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { success: false, error: t('auth.invalidCredentials') || "Credenciales inválidas" };
      }
      
      if (!data.user) {
         return { success: false, error: t('auth.invalidCredentials') || "Credenciales inválidas" };
      }

      // 2. Check if profile exists
      let userProfile = await this.getUserProfile(data.user.id);

      // 3. If profile doesn't exist, create it (legacy/fallback support)
      if (!userProfile) {
        try {
          userProfile = await this.createUserProfile(data.user);
        } catch (err) {
          console.error("Error creating default profile during login:", err);
        }
      }

      return { success: true, user: userProfile, auth: data.user };
    } catch (err) {
      console.error("Login exception:", err);
      return { success: false, error: err.message };
    }
  },

  // Logout
  async logout() {
    try {
      console.log("Initiating logout sequence...");
      
      // Attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Supabase signOut error:", error);
        // Even if Supabase throws an error (e.g. network), we should proceed with local cleanup
        // to ensure the user isn't stuck.
      } else {
        console.log("Supabase session ended successfully.");
      }

      // Clear local storage items related to auth
      // Note: Supabase client handles its own persistence, but we clear explicit keys if used
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
      
      // We explicitly return success to ensure the UI can proceed
      return { success: true };
    } catch (err) {
      console.error("Logout exception:", err);
      // In case of a crash, we still want the UI to attempt to redirect
      return { success: false, error: err.message };
    }
  },

  // Get User Profile from public.usuarios
  async getUserProfile(userId) {
    if (!userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching user profile:', error.message);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error('Exception fetching user profile:', err);
      return null;
    }
  },

  // Create a new user profile
  async createUserProfile(authUser) {
    if (!authUser) return null;

    const newProfile = {
      user_id: authUser.id,
      email: authUser.email,
      nombre: authUser.email.split('@')[0],
      estado: 'pendiente', 
      rol: 'TÉCNICO' 
    };USD

    const { data, error } = await supabase
      .from('usuarios')
      .insert([newProfile])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  // Validate User Access based on state (Utility for UI checks)
  validateUserAccess(usuario) {
    if (!usuario) {
      return { 
        allowed: false, 
        message: t('auth.noProfile') || "Sin perfil",
        role: null
      };
    }

    if (usuario.estado === 'pendiente') {
      return { 
        allowed: false, 
        message: t('auth.accessPending') || "Acceso pendiente",
        role: usuario.rol
      };
    }

    if (usuario.estado === 'rechazado') {
      return { 
        allowed: false, 
        message: t('auth.accessRejected') || "Acceso denegado",
        role: usuario.rol
      };
    }

    if (usuario.estado === 'aceptado' || usuario.estado === 'ACTIVO') {
      return { 
        allowed: true, 
        message: 'OK',
        role: usuario.rol
      };
    }

    return { allowed: false, message: t('auth.accessDenied') || "Acceso denegado", role: null };
  },

  // Password Reset
  async resetPasswordForEmail(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) throw error;
    return true;
  }
};
