
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const STORAGE_KEY_PREFIX = 'sidebar_collapsed_';

export const useSidebarState = () => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load initial state
  useEffect(() => {
    if (user) {
      const savedState = localStorage.getItem(`${STORAGE_KEY_PREFIX}${user.id}`);
      if (savedState !== null) {
        setIsCollapsed(JSON.parse(savedState));
      }
    }
  }, [user]);

  // Toggle function
  const toggleCollapsed = () => {
    setIsCollapsed(prev => {
      const newState = !prev;
      if (user) {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${user.id}`, JSON.stringify(newState));
      }
      return newState;
    });
  };

  return { isCollapsed, toggleCollapsed };
};
