
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { authService } from '@/services/authService';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId, authUser) => {
    if (!userId) {
      setUserProfile(null);
      return;
    }
    try {
      let profile = await authService.getUserProfile(userId);
      
      // If profile doesn't exist but we have an authenticated user, try to create it
      if (!profile && authUser) {
        try {
          profile = await authService.createUserProfile(authUser);
        } catch (createError) {
          console.error("Failed to create default profile in context:", createError);
        }
      }

      if (profile) {
        setUserProfile(profile);
      } else {
        // Fallback: if profile not found or RLS error, we still have the auth user
        console.warn("User profile not found or inaccessible via RLS");
        setUserProfile(null);
      }
    } catch (err) {
      console.error("Error fetching user profile in context:", err);
      // Graceful fallback - don't crash, just have no profile data
      setUserProfile(null);
    }
  };

  const handleSession = useCallback(async (currentSession) => {
    setSession(currentSession);
    const currentUser = currentSession?.user ?? null;
    setUser(currentUser);
    
    if (currentUser) {
      await fetchProfile(currentUser.id, currentUser);
    } else {
      setUserProfile(null);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    // Initial load
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        await handleSession(session);
      } catch (error) {
        console.error("Session init error:", error);
        await handleSession(null);
      }
    };

    initAuth();

    // Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          await handleSession(null);
        } else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          await handleSession(session);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const login = useCallback(async (email, password) => {
    return await authService.loginWithEmail(email, password);
  }, []);

  const logout = useCallback(async () => {
    return await authService.logout();
  }, []);

  const getUserRole = useCallback(() => {
    return userProfile?.rol || null;
  }, [userProfile]);

  const isAuthenticated = useCallback(() => {
    return !!session && !!user;
  }, [session, user]);

  const isAccessAllowed = useCallback(() => {
    // If we have a profile, check it against business rules
    if (userProfile) {
      const { allowed } = authService.validateUserAccess(userProfile);
      return allowed;
    }
    
    // Fallback: if authenticated (user exists) but profile fetch failed (e.g. RLS error), 
    // we allow access based on the existence of the auth user alone.
    return !!user;
  }, [userProfile, user]);

  const value = useMemo(() => ({
    user,
    userProfile,
    session,
    loading,
    login,
    logout,
    getUserRole,
    isAuthenticated,
    isAccessAllowed
  }), [user, userProfile, session, loading, login, logout, getUserRole, isAuthenticated, isAccessAllowed]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
