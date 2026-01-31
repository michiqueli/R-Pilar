
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { tokens } from '@/lib/designTokens';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Card } from '@/components/ui/Card';
import KpiCard from '@/components/ui/KpiCard';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Mail, Phone, MapPin, Building2, TrendingUp, AlertTriangle, CheckCircle2, DollarSign } from 'lucide-react';
import ClientModal from '@/components/clients/ClientModal';
import ClientContactsTab from '@/components/clients/ClientContactsTab';
import ClientDocumentsTab from '@/components/clients/ClientDocumentsTab';
import ClientProjectsTab from '@/components/clients/ClientProjectsTab';
import ClientPaymentsTab from '@/components/clients/ClientPaymentsTab';
import usePageTitle from '@/hooks/usePageTitle';

const ClientDetailPage = () => {
  usePageTitle('Detalle del cliente');
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('client_detail_last_tab') || 'contacts'); // Changed default to 'contacts'
  
  // KPIs
  const [kpis, setKpis] = useState({
    activeProjects: 0,
    billedLast30Days: 0,
    billedLast12Months: 0,
    outstandingDebt: 0
  });

  const fetchClientData = async () => {
    setLoading(true);
    try {
      // 1. Datos del Cliente
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setClient(data);

      // 2. Proyectos Activos (Para el KPI de la izquierda)
      const { count: activeProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', id)
        .eq('status', 'active');

      // 3. Facturas (Para saber cuánto le cobramos)
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', id);

      // 4. Inversiones/Pagos (Para saber cuánto nos pagó realmente)
      // Nota: Asumimos que 'inversiones' aquí actúa como registro de cobros/entradas
      const { data: movimientos } = await supabase
        .from('inversiones')
        .select('monto_ars, estado, fecha') // Traemos solo lo necesario
        .eq('cliente_id', id);

      // --- CÁLCULOS ---
      const now = new Date();
      const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(now.getDate() - 30);
      const twelveMonthsAgo = new Date(); twelveMonthsAgo.setMonth(now.getMonth() - 12);

      let billed30 = 0;   // KPI: Facturado 30 días
      let billed12 = 0;   // KPI: Facturado 12 meses
      let totalBilled = 0; // Total histórico facturado
      let totalPaid = 0;   // Total histórico cobrado (Realmente ingresado)

      // A. Procesar Facturas
      invoices?.forEach(inv => {
         const d = new Date(inv.date);
         const amount = Number(inv.total);
         
         // Solo sumamos facturas que no sean borrador
         if (inv.status !== 'draft') {
             totalBilled += amount;
             
             // Filtros de fecha para los KPIs
             if (d >= thirtyDaysAgo) billed30 += amount;
             if (d >= twelveMonthsAgo) billed12 += amount;
         }
      });

      // B. Procesar Pagos (Desde Inversiones)
      movimientos?.forEach(p => {
         // CORRECCIÓN: Para calcular deuda, usualmente solo cuentan los CONFIRMADOS.
         // Si incluyes 'PENDIENTE', la deuda desaparecerá aunque no tengas el dinero todavía.
         if (p.estado === 'CONFIRMADO') { 
             totalPaid += Number(p.monto_ars);
         }
      });

      // C. Setear KPIs
      setKpis({
        activeProjects: activeProjects || 0,
        billedLast30Days: billed30,
        billedLast12Months: billed12,
        // Cálculo final: Lo que facturé MENOS lo que me pagaron (Confirmado)
        outstandingDebt: Math.max(0, totalBilled - totalPaid) 
      });

    } catch (error) {
      console.error("Error fetching client details:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar el cliente' });
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchClientData();
  }, [id]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    localStorage.setItem('client_detail_last_tab', value);
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!client) return null;

  return (
    <>
      <div className="p-6 md:p-8 min-h-screen bg-slate-50/50 dark:bg-slate-950">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto space-y-6"
        >
          {/* Main Card */}
          <Card className="p-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row gap-8 items-start">
               {/* Avatar */}
               <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-4xl font-bold shadow-lg shadow-blue-500/30 shrink-0">
                  {client.name.charAt(0).toUpperCase()}
               </div>

               {/* Info */}
               <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                     <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{client.name}</h2>
                     <Chip label={client.status} variant={client.status === 'active' ? 'success' : 'default'} className="uppercase" />
                     {kpis.outstandingDebt > 0 ? (
                        <Chip label="DEUDA PENDIENTE" variant="danger" size="sm" />
                     ) : (
                        <Chip label="AL DÍA" variant="success" size="sm" />
                     )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-600 dark:text-slate-400">
                     <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{client.tax_id || 'Sin ID Fiscal'}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{client.email || 'Sin Email'}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{client.phone || 'Sin Teléfono'}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{client.address || 'Sin Dirección'}</span>
                     </div>
                  </div>
               </div>

               {/* Actions */}
               <div className="flex flex-col gap-3 w-full md:w-auto">
                  <Button variant="outline" className="rounded-full" onClick={() => setIsEditModalOpen(true)}>
                     <Edit className="w-4 h-4 mr-2" /> Editar Cliente
                  </Button>
                 {/* <Button 
                    variant="primary" 
                    className="rounded-full shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
                    onClick={() => toast({ title: "Próximamente", description: "Crear presupuesto no implementado aún" })}
                  >
                     <DollarSign className="w-4 h-4 mr-2" /> Crear Presupuesto
                  </Button>
                  */}
               </div>
            </div>
          </Card>

          {/* KPIs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Proyectos Activos"
              value={kpis.activeProjects}
              icon={TrendingUp}
              tone="blue"
            />

            <KpiCard
              title="Facturado 30 días"
              value={formatCurrency(kpis.billedLast30Days)}
              icon={DollarSign}
              tone="emerald"
              showBar
            />

            <KpiCard
              title="Facturado 12 meses"
              value={formatCurrency(kpis.billedLast12Months)}
              icon={DollarSign}
              tone="purple"
              showBar
            />

            <KpiCard
              title="Deuda Pendiente"
              value={formatCurrency(kpis.outstandingDebt)}
              icon={AlertTriangle}
              tone="red"
              valueClassName="text-red-600 dark:text-red-400"
            />
          </div>

          {/* Tabs Section */}
          <div className="space-y-4">
             <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="overflow-x-auto pb-2">
                   <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full inline-flex w-auto min-w-full md:min-w-0 h-auto">
                      <TabsTrigger value="contacts" className="rounded-full px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">Contactos</TabsTrigger>
                      <TabsTrigger value="projects" className="rounded-full px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">Proyectos</TabsTrigger>
                      <TabsTrigger value="documents" className="rounded-full px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">Documentos</TabsTrigger>
                      <TabsTrigger value="payments" className="rounded-full px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">Cobros</TabsTrigger>
                   </TabsList>
                </div>

                <div className="mt-6">
                   <TabsContent value="contacts">
                      <ClientContactsTab clientId={id} />
                   </TabsContent>

                   <TabsContent value="projects">
                      <ClientProjectsTab clientId={id} />
                   </TabsContent>
                   <TabsContent value="documents">
                      <ClientDocumentsTab clientId={id} />
                   </TabsContent>

                   <TabsContent value="payments">
                      <ClientPaymentsTab clientId={id} />
                   </TabsContent>
                </div>
             </Tabs>
          </div>

        </motion.div>
      </div>

      <ClientModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        client={client}
        onSuccess={fetchClientData}
      />
    </>
  );
};

export default ClientDetailPage;
