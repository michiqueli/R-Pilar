
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { authService } from '@/services/authService';
import { useTheme } from '@/contexts/ThemeProvider';

const ConfirmLogoutModal = ({ isOpen, onCancel }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return; // Prevent double clicks
    
    setLoading(true);
    try {
      console.log("Logout triggered from modal");
      
      // Call service
      const result = await authService.logout();
      
      if (result.success) {
        toast({
          title: t('auth.logout') || "Sesión cerrada",
          description: "Has cerrado sesión correctamente.",
        });
        
        // Force navigate to login
        navigate('/login');
        
        // Close modal (optional since we navigate away, but good practice)
        if (onCancel) onCancel();
      } else {
        throw new Error(result.error || "Error desconocido");
      }
    } catch (error) {
      console.error("Logout error in modal:", error);
      toast({
        variant: "destructive",
        title: t('common.error') || "Error",
        description: error.message || "No se pudo cerrar sesión. Intente nuevamente.",
      });
    } finally {
      if(mounted.current) {
          setLoading(false);
      }
    }
  };

  // Safe ref to avoid setting state on unmounted component
  const mounted = React.useRef(true);
  React.useEffect(() => {
      return () => { mounted.current = false; };
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 dark:border-slate-800"
        >
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
              <LogOut className="w-8 h-8 text-red-500" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {t('auth.logoutConfirmTitle') || "Cerrar sesión"}
            </h3>
            
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
              {t('auth.logoutConfirmDesc') || "¿Estás seguro que deseas cerrar tu sesión actual?"}
            </p>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-transparent border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {t('common.cancel') || "Cancelar"}
              </button>
              
              <button
                onClick={handleLogout}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center shadow-lg shadow-red-500/20 disabled:opacity-70 disabled:cursor-not-allowed min-w-[120px]"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t('auth.logout') || "Cerrar sesión"
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmLogoutModal;
