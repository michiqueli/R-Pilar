
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';
import { t } from '@/lib/i18n';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, userProfile, isAccessAllowed } = useAuth();
  const [accessChecked, setAccessChecked] = useState(false);

  // We need to wait for both auth loading AND profile loading
  // The context handles profile loading within the session handler
  
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#F5F5F5]">
        <Loader2 className="h-10 w-10 animate-spin text-[#FFC107] mb-4" />
        <p className="text-slate-500 animate-pulse">{t('common.loading')}</p>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (!isAccessAllowed()) {
    // If authenticated but access denied (e.g. pending/rejected or no profile)
    // We should ideally redirect to a "Status" page or just back to login with error
    // For simplicity, back to login, the login page will show the error via logic check
    // OR we could render a "Not Authorized" screen here.
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
