
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CatalogManager from '@/components/catalogs/CatalogManager';
import usePageTitle from '@/hooks/usePageTitle';

function CatalogsPage() {
  usePageTitle('Catálogos');
  const [activeTab, setActiveTab] = useState('payment_status');

  return (
    <>
      <div className="p-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Catalogs</h1>
            <p className="text-slate-600">Manage system-wide configuration lists</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="payment_status">Payment Statuses</TabsTrigger>
                <TabsTrigger value="expense_type">Expense Types</TabsTrigger>
                <TabsTrigger value="provider_type">Provider Types</TabsTrigger>
              </TabsList>

              <TabsContent value="payment_status">
                <CatalogManager 
                  tableName="catalog_payment_status" 
                  title="Payment Status"
                  description="Manage payment status options for expenses"
                />
              </TabsContent>

              <TabsContent value="expense_type">
                <CatalogManager 
                  tableName="catalog_expense_type"
                  title="Expense Type" 
                  description="Manage categories for project expenses"
                />
              </TabsContent>

              <TabsContent value="provider_type">
                <CatalogManager 
                  tableName="catalog_provider_type"
                  title="Provider Type"
                  description="Manage categories for providers and vendors"
                />
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default CatalogsPage;
