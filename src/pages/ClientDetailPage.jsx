
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { tokens } from '@/lib/designTokens';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Card } from '@/components/ui/Card';
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
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setClient(data);

      // Fetch KPIs
      // 1. Active Projects
      const { count: activeProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', id)
        .eq('status', 'active');

      // 2. Invoices (Simplified calc for now, would ideally use DB functions for date diffs or fetch relevant rows)
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', id);

      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('client_id', id);

      const now = new Date();
      const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(now.getDate() - 30);
      const twelveMonthsAgo = new Date(); twelveMonthsAgo.setMonth(now.getMonth() - 12);

      let billed30 = 0;
      let billed12 = 0;
      let totalBilled = 0;
      let totalPaid = 0;

      invoices?.forEach(inv => {
         const d = new Date(inv.date);
         const amount = Number(inv.total);
         if (['paid', 'approved', 'sent'].includes(inv.status)) { // Assuming sent invoices count towards billing metrics? Or only approved? Let's say approved/paid for recognized revenue
             if (d >= thirtyDaysAgo) billed30 += amount;
             if (d >= twelveMonthsAgo) billed12 += amount;
         }
         if (inv.status !== 'draft') totalBilled += amount;
      });

      payments?.forEach(p => {
         if (p.status === 'completed' || p.status === 'pending') totalPaid += Number(p.amount);
      });

      setKpis({
        activeProjects: activeProjects || 0,
        billedLast30Days: billed30,
        billedLast12Months: billed12,
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
          {/* Header */}
          <PageHeader 
             title={client.name} 
             breadcrumbs={['Inicio', 'Clientes', client.name]} 
          />
          
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
                  <Button 
                    variant="primary" 
                    className="rounded-full shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
                    onClick={() => toast({ title: "Próximamente", description: "Crear presupuesto no implementado aún" })}
                  >
                     <DollarSign className="w-4 h-4 mr-2" /> Crear Presupuesto
                  </Button>
               </div>
            </div>
          </Card>

          {/* KPIs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 flex flex-col justify-between h-28">
               <div className="flex items-start justify-between">
                  <span className="text-slate-500 text-sm font-medium">Proyectos Activos</span>
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                     <TrendingUp className="w-4 h-4" />
                  </div>
               </div>
               <div className="text-3xl font-bold text-slate-900 dark:text-white">{kpis.activeProjects}</div>
            </Card>

            <Card className="p-4 flex flex-col justify-between h-28">
               <div className="flex items-start justify-between">
                  <span className="text-slate-500 text-sm font-medium">Facturado 30 días</span>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600">
                     <DollarSign className="w-4 h-4" />
                  </div>
               </div>
               <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(kpis.billedLast30Days)}</div>
            </Card>

            <Card className="p-4 flex flex-col justify-between h-28">
               <div className="flex items-start justify-between">
                  <span className="text-slate-500 text-sm font-medium">Facturado 12 meses</span>
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600">
                     <DollarSign className="w-4 h-4" />
                  </div>
               </div>
               <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(kpis.billedLast12Months)}</div>
            </Card>

            <Card className="p-4 flex flex-col justify-between h-28 border-l-4 border-l-red-500">
               <div className="flex items-start justify-between">
                  <span className="text-slate-500 text-sm font-medium">Deuda Pendiente</span>
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600">
                     <AlertTriangle className="w-4 h-4" />
                  </div>
               </div>
               <div className="text-2xl font-bold text-red-600">{formatCurrency(kpis.outstandingDebt)}</div>
            </Card>
          </div>

          {/* Tabs Section */}
          <div className="space-y-4">
             <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="overflow-x-auto pb-2">
                   <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full inline-flex w-auto min-w-full md:min-w-0 h-auto">
                      <TabsTrigger value="contacts" className="rounded-full px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">Contactos</TabsTrigger>
                      <TabsTrigger value="projects" className="rounded-full px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">Proyectos</TabsTrigger>
                      <TabsTrigger value="budgets" className="rounded-full px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm" onClick={() => toast({ title: "Próximamente", description: "La pestaña Presupuestos no implementada aún" })}>Presupuestos</TabsTrigger>
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
                   
                   {/* Budgets Tab - Placeholder as per user's last instruction */}
                   <TabsContent value="budgets">
                      <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-slate-500">Funcionalidad de Presupuestos no implementada todavía.</p>
                      </div>
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
