
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/ThemeProvider';
import { cuentaService } from '@/services/cuentaService';
import usePageTitle from '@/hooks/usePageTitle';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Components
import CuentasKPIs from '@/components/cuentas/CuentasKPIs';
import CuentasCards from '@/components/cuentas/CuentasCards';
import CuentaModal from '@/components/cuentas/CuentaModal';
import SearchBar from '@/components/common/SearchBar';

const CuentasPage = () => {
  usePageTitle('Cuentas');
  const { t } = useTheme();
  const { toast } = useToast();
  
  // State
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCuenta, setSelectedCuenta] = useState(null);

  // Fetch Data
  const loadCuentas = async () => {
    try {
      setLoading(true);
      const data = await cuentaService.getCuentas();
      setCuentas(data || []);
    } catch (error) {
      console.error("Error fetching cuentas:", error);
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('cuentas.error')
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCuentas();
  }, []);

  // Filter Data
  const filteredCuentas = useMemo(() => {
    if (!searchTerm) return cuentas;
    const lowerTerm = searchTerm.toLowerCase();
    return cuentas.filter(c => 
      c.titulo?.toLowerCase().includes(lowerTerm)
    );
  }, [cuentas, searchTerm]);

  // Handlers
  const handleCreate = () => {
    setSelectedCuenta(null);
    setIsModalOpen(true);
  };

  const handleEdit = (cuenta) => {
    setSelectedCuenta(cuenta);
    setIsModalOpen(true);
  };

  const handleDelete = async (cuenta) => {
    if (!window.confirm(t('messages.confirm_delete'))) return;

    try {
      await cuentaService.deleteCuenta(cuenta.id);
      toast({ title: t('common.success'), description: t('cuentas.deleted') });
      loadCuentas();
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: error.message });
    }
  };

  return (
    <>
      <div className="min-h-screen p-6 md:p-8 bg-slate-50/50 dark:bg-[#111827] transition-colors duration-200 font-sans">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto space-y-8"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-[32px] font-bold text-[#1F2937] dark:text-white leading-tight">
                {t('cuentas.title')}
              </h1>
              <p className="text-slate-500 mt-1">Gestión de cuentas bancarias y cajas</p>
            </div>
            
            <Button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 shadow-md transition-all hover:shadow-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('cuentas.addCuenta')}
            </Button>
          </div>

          {/* KPIs */}
          <CuentasKPIs />

          {/* Search Bar */}
          <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
             <SearchBar 
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder={t('cuentas.search')}
                className="w-full border-none shadow-none bg-transparent"
              />
          </div>

          {/* Content */}
          <CuentasCards 
            cuentas={filteredCuentas}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

        </motion.div>
      </div>

      <CuentaModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadCuentas}
        cuenta={selectedCuenta}
      />
    </>
  );
};

export default CuentasPage;
