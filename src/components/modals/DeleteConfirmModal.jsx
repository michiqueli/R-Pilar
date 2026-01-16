
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/contexts/LanguageContext';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, description }) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {title || t('messages.confirm_delete')}
            </h3>
            
            <p className="text-sm text-slate-500 mb-6">
              {description}
            </p>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={onClose} className="w-full">
                {t('common.cancel')}
              </Button>
              <Button variant="destructive" onClick={onConfirm} className="w-full bg-red-600 hover:bg-red-700 text-white">
                {t('common.delete')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmModal;
