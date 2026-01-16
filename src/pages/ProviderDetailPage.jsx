
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Phone, Mail, FileText, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProviderModal from '@/components/providers/ProviderModal';
import ProviderMovementsTab from '@/components/providers/tabs/ProviderMovementsTab';
import ProviderStatementsTab from '@/components/providers/tabs/ProviderStatementsTab';
import usePageTitle from '@/hooks/usePageTitle';

function ProviderDetailPage() {
  usePageTitle('Detalle del proveedor');
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [provider, setProvider] = useState(null);
  const [movements, setMovements] = useState([]);
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchProviderData = async () => {
    try {
      setLoading(true);
      
      // Fetch provider info
      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .select(`
          *,
          catalog_provider_type (
            id,
            name
          )
        `)
        .eq('id', id)
        .single();

      if (providerError) throw providerError;
      setProvider(providerData);

      // Fetch movements (expenses)
      const { data: expensesData, error: expensesError } = await supabase
        .from('project_expenses')
        .select(`
          *,
          projects (name)
        `)
        .eq('provider_id', id)
        .eq('is_deleted', false)
        .order('expense_date', { ascending: false });
        
      if (expensesError) throw expensesError;
      setMovements(expensesData || []);

      // Fetch statements
      const { data: statementsData, error: statementsError } = await supabase
        .from('provider_statements')
        .select('*')
        .eq('provider_id', id)
        .order('statement_month', { ascending: false });

      if (statementsError) throw statementsError;
      setStatements(statementsData || []);

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
      navigate('/providers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviderData();
  }, [id]);

  if (loading || !provider) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div className="p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/providers')}
              className="text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Providers
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-slate-900">{provider.name}</h1>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    {provider.catalog_provider_type?.name}
                  </span>
                  {!provider.is_active && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
                      Inactive
                    </span>
                  )}
                </div>
                
                <div className="flex flex-col gap-1 text-slate-600 mt-2">
                   {provider.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>{provider.email}</span>
                    </div>
                  )}
                  {provider.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{provider.phone}</span>
                    </div>
                  )}
                </div>
                {provider.notes && (
                  <p className="mt-4 text-slate-500 text-sm max-w-2xl">{provider.notes}</p>
                )}
              </div>
              
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Provider
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <Tabs defaultValue="movements" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="movements">
                  <Activity className="w-4 h-4 mr-2" />
                  Movimientos
                </TabsTrigger>
                <TabsTrigger value="statements">
                  <FileText className="w-4 h-4 mr-2" />
                  Cuentas Corrientes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="movements">
                <ProviderMovementsTab movements={movements} />
              </TabsContent>
              
              <TabsContent value="statements">
                <ProviderStatementsTab 
                  providerId={id} 
                  statements={statements} 
                  onRefresh={fetchProviderData}
                />
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </div>

      <ProviderModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchProviderData}
        provider={provider}
      />
    </>
  );
}

export default ProviderDetailPage;
