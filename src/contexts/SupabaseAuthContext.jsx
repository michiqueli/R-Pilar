
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { authService } from '@/services/authService';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Guard: ensure loading=false is set exactly once during init
  const initComplete = useRef(false);

  const fetchProfile = async (userId, authUser) => {
    if (!userId) {
      setUserProfile(null);
      return;
    }
    try {
      let profile = await authService.getUserProfile(userId);
      
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
        console.warn("User profile not found or inaccessible via RLS");
        setUserProfile(null);
      }
    } catch (err) {
      console.error("Error fetching user profile in context:", err);
      setUserProfile(null);
    }
  };

  // finishInit: resolves initial loading state ONCE, non-blocking
  const finishInit = useCallback((currentSession) => {
    if (initComplete.current) return;
    initComplete.current = true;

    const currentUser = currentSession?.user ?? null;
    setSession(currentSession);
    setUser(currentUser);

    // KEY FIX: Don't await fetchProfile here — set loading=false immediately
    // so ProtectedRoute unblocks. Profile will update via state when ready.
    if (currentUser) {
      fetchProfile(currentUser.id, currentUser); // fire and forget
    } else {
      setUserProfile(null);
    }

    setLoading(false);
  }, []);

  // handleSession: for subsequent auth changes AFTER init
  const handleSession = useCallback(async (currentSession) => {
    const currentUser = currentSession?.user ?? null;
    setSession(currentSession);
    setUser(currentUser);

    if (currentUser) {
      await fetchProfile(currentUser.id, currentUser);
    } else {
      setUserProfile(null);
    }

    // Safety: also unblock loading if init somehow didn't complete
    if (!initComplete.current) {
      initComplete.current = true;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // 1. Auth state listener (handles login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;

        // If this fires before getSession resolves, use it to complete init
        if (!initComplete.current) {
          finishInit(newSession);
          return;
        }

        // Post-init events
        if (event === 'SIGNED_OUT') {
          await handleSession(null);
        } else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          await handleSession(newSession);
        }
      }
    );

    // 2. Primary init: getSession()
    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (error) {
          console.error("getSession error:", error);
          finishInit(null);
          return;
        }
        finishInit(data?.session ?? null);
      } catch (error) {
        console.error("getSession exception:", error);
        if (isMounted) finishInit(null);
      }
    };

    initAuth();

    // 3. SAFETY NET: if everything above somehow fails/hangs, unblock after 4s
    const safetyTimeout = setTimeout(() => {
      if (!initComplete.current && isMounted) {
        console.warn('[Auth] Safety timeout triggered — forcing loading=false');
        finishInit(null);
      }
    }, 4000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [handleSession, finishInit]);

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
    if (userProfile) {
      const { allowed } = authService.validateUserAccess(userProfile);
      return allowed;
    }
    // Fallback: if authenticated but profile not yet loaded, allow access
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
