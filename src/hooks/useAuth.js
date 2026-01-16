
// Wrapper hook for useAuth to ensure compatibility if other components try to import from here
// although the prompt asked for this specifically, it's safer to alias the context hook.

import { useAuth as useAuthContext } from '@/contexts/SupabaseAuthContext';

export const useAuth = () => {
  return useAuthContext();
};
