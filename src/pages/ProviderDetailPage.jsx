import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Card } from '@/components/ui/Card';
import KpiCard from '@/components/ui/KpiCard';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Edit, Mail, Phone, MapPin, Building2,
  TrendingDown, AlertTriangle, CheckCircle2, DollarSign, Activity, FileText
} from 'lucide-react';
import ProviderModal from '@/components/providers/ProviderModal';
import ProviderMovementsTab from '@/components/providers/tabs/ProviderMovementsTab';
import ProviderStatementsTab from '@/components/providers/tabs/ProviderStatementsTab';
import usePageTitle from '@/hooks/usePageTitle';

const ProviderDetailPage = () => {
  usePageTitle('Detalle del proveedor');
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('provider_detail_last_tab') || 'movements');

  // KPIs Financieros (Inversa de clientes: orientada a Gastos)
  const [kpis, setKpis] = useState({
    totalBilled: 0,        // Total histórico de gastos confirmados
    paidLast30Days: 0,     // Lo pagado realmente en los últimos 30 días
    paidLast12Months: 0,   // Lo pagado realmente en los últimos 12 meses
    outstandingDebt: 0     // Deuda pendiente (Gastos pendientes de pago)
  });

  const fetchProviderData = async () => {
    setLoading(true);
    try {
      // 1. Datos Básicos del Proveedor
      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .select('*, catalog_provider_type(name)')
        .eq('id', id)
        .single();

      if (providerError) throw providerError;
      setProvider(providerData);

      // 2. Movimientos (Inversiones de tipo GASTO)
      const { data: movimientos, error: movError } = await supabase
        .from('inversiones')
        .select('*')
        .eq('proveedor_id', id);

      if (movError) throw movError;

      // --- CÁLCULOS FINANCIEROS ---
      const now = new Date();
      const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(now.getDate() - 30);
      const twelveMonthsAgo = new Date(); twelveMonthsAgo.setMonth(now.getMonth() - 12);

      let totalFacturado = 0; // Gastos Confirmados
      let pago30 = 0;         // Gastos Confirmados últimos 30 días
      let pago12 = 0;         // Gastos Confirmados últimos 12 meses
      let deudaPendiente = 0;  // Gastos en estado PENDIENTE

      movimientos?.forEach(mov => {
        const d = new Date(mov.fecha);
        const amount = Number(mov.monto_ars || 0);

        if (mov.tipo === 'GASTO') {
          if (mov.estado === 'CONFIRMADO') {
            totalFacturado += amount;
            if (d >= thirtyDaysAgo) pago30 += amount;
            if (d >= twelveMonthsAgo) pago12 += amount;
          } else if (mov.estado === 'PENDIENTE') {
            deudaPendiente += amount;
          }
        }
      });

      setKpis({
        totalBilled: totalFacturado,
        paidLast30Days: pago30,
        paidLast12Months: pago12,
        outstandingDebt: deudaPendiente
      });

    } catch (error) {
      console.error("Error loading provider details:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar el proveedor' });
      navigate('/providers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProviderData();
  }, [id]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    localStorage.setItem('provider_detail_last_tab', value);
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!provider) return null;

  return (
    <>
      <div className="p-6 md:p-8 min-h-screen bg-slate-50/50 dark:bg-slate-950 transition-colors duration-200">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto space-y-6"
        >
          {/* Perfil del Proveedor */}
          <Card className="p-6 relative overflow-hidden border-slate-200 dark:border-slate-800">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar Dinámico */}
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center text-4xl font-bold shadow-lg shrink-0">
                {provider.name.charAt(0).toUpperCase()}
              </div>

              {/* Información Principal */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{provider.name}</h2>
                  <Chip label={provider.catalog_provider_type?.name || 'Proveedor'} variant="info" className="uppercase text-[10px]" />
                  <Chip
                    label={provider.is_active ? "ACTIVO" : "INACTIVO"}
                    variant={provider.is_active ? "success" : "default"}
                  />
                  {kpis.outstandingDebt > 0 && (
                    <Chip label="PAGOS PENDIENTES" variant="danger" size="sm" />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{provider.tax_id || 'Sin CUIT'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{provider.email || 'Sin Email'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{provider.phone || 'Sin Teléfono'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{provider.address || 'Sin Dirección'}</span>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex flex-col gap-3 w-full md:w-auto">
                <Button variant="outline" className="rounded-full" onClick={() => setIsEditModalOpen(true)}>
                  <Edit className="w-4 h-4 mr-2" /> Editar Proveedor
                </Button>
              </div>
            </div>
          </Card>

          {/* KPIs Grid - Corregido con barritas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Total Facturado"
              value={formatCurrency(kpis.totalBilled)}
              icon={TrendingDown}
              tone="blue"
              showBar // Barrita azul
            />

            <KpiCard
              title="Pagado 30 días"
              value={formatCurrency(kpis.paidLast30Days)}
              icon={DollarSign}
              tone="emerald"
              showBar // Barrita verde
            />

            <KpiCard
              title="Pagado 12 meses"
              value={formatCurrency(kpis.paidLast12Months)}
              icon={DollarSign}
              tone="purple"
              showBar // Barrita púrpura
            />

            <KpiCard
              title="Pendiente a Pagar"
              value={formatCurrency(kpis.outstandingDebt)}
              icon={AlertTriangle}
              tone="red"
              valueClassName="text-red-600 dark:text-red-400"
              showBar // Barrita roja para resaltar la deuda
            />
          </div>

          {/* Sección de Pestañas (Contenido Detallado) */}
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <div className="overflow-x-auto pb-2">
                <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full inline-flex w-auto min-w-full md:min-w-0 h-auto">
                  <TabsTrigger value="movements" className="rounded-full px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm transition-all">
                     Movimientos
                  </TabsTrigger>
                  <TabsTrigger value="statements" className="rounded-full px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm transition-all">
                     Cuentas Corrientes
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="mt-6">
                <TabsContent value="movements">
                  <ProviderMovementsTab providerId={id} />
                </TabsContent>

                <TabsContent value="statements">
                  <ProviderStatementsTab
                    providerId={id}
                    onRefresh={fetchProviderData}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>

        </motion.div>
      </div>

      <ProviderModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        provider={provider}
        onSuccess={fetchProviderData}
      />
    </>
  );
};

export default ProviderDetailPage;