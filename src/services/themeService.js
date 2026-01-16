
import { supabase } from '@/lib/customSupabaseClient';

export const themeService = {
  getDefaultTheme() {
    return 'light';
  },

  async getThemePreference(userId) {
    if (!userId) {
      return localStorage.getItem('theme_preference') || this.getDefaultTheme();
    }

    try {
      const { data, error } = await supabase
        .from('user_config')
        .select('theme')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is 'not found'
        console.warn('Error fetching theme preference:', error);
      }

      if (data?.theme) {
        localStorage.setItem('theme_preference', data.theme); // Sync local
        return data.theme;
      }
    } catch (err) {
      console.error('Unexpected error fetching theme:', err);
    }

    return localStorage.getItem('theme_preference') || this.getDefaultTheme();
  },

  async saveThemePreference(userId, theme) {
    localStorage.setItem('theme_preference', theme);
    
    // Apply immediately to DOM for responsiveness
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    if (theme === 'system') {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    if (!userId) return { success: true, localOnly: true };

    try {
      // Upsert logic
      const { error } = await supabase
        .from('user_config')
        .upsert({ 
          user_id: userId, 
          theme: theme,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Error saving theme preference:', err);
      return { success: false, error: err };
    }
  }
};
