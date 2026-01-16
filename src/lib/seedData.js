
import { supabase } from '@/lib/customSupabaseClient';

export const seedData = async () => {
  try {
    // 1. Check and Seed Accounts
    const { count: accountsCount } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true });

    if (accountsCount === 0) {
      console.log('Seeding Accounts...');
      const accountsToCreate = [
        { name: 'Cuenta Empresa ARS', type: 'EMPRESA', currency: 'ARS', is_active: true, is_deleted: false },
        { name: 'Tarjeta Personal ARS', type: 'TARJETA_PERSONAL', currency: 'ARS', is_active: true, is_deleted: false },
        { name: 'Caja Chica ARS', type: 'CAJA_CHICA', currency: 'ARS', is_active: true, is_deleted: false }
      ];
      await supabase.from('accounts').insert(accountsToCreate);
    }

    // 2. Check and Seed Provider Types (Prerequisite for Providers)
    const { data: providerTypes } = await supabase
      .from('catalog_provider_type')
      .select('id, name');
    
    let contractorTypeId, supplierTypeId;

    if (!providerTypes || providerTypes.length === 0) {
       // Create types if they don't exist
       const { data: newTypes } = await supabase.from('catalog_provider_type').insert([
         { name: 'PROVEEDOR', is_active: true, is_deleted: false },
         { name: 'CONTRATISTA', is_active: true, is_deleted: false }
       ]).select();
       if (newTypes) {
         supplierTypeId = newTypes.find(t => t.name === 'PROVEEDOR')?.id;
         contractorTypeId = newTypes.find(t => t.name === 'CONTRATISTA')?.id;
       }
    } else {
      supplierTypeId = providerTypes.find(t => t.name === 'PROVEEDOR')?.id || providerTypes[0].id;
      contractorTypeId = providerTypes.find(t => t.name === 'CONTRATISTA')?.id || providerTypes[0].id;
    }

    // 3. Check and Seed Providers
    const { count: providersCount } = await supabase
      .from('providers')
      .select('*', { count: 'exact', head: true });

    if (providersCount === 0 && supplierTypeId) {
      console.log('Seeding Providers...');
      const providersToCreate = [
        { name: 'Sakura', provider_type_id: supplierTypeId, is_active: true, is_deleted: false, type: 'PROVEEDOR' },
        { name: 'Contratista - Mano de obra', provider_type_id: contractorTypeId, is_active: true, is_deleted: false, type: 'CONTRATISTA' }
      ];
      await supabase.from('providers').insert(providersToCreate);
    }

  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

export const createTestScenario = async () => {
  try {
    // 1. Create Project
    const { data: project, error: pError } = await supabase.from('projects').insert([{
      name: 'Casa Ulloa',
      code: 'TST-001',
      client_name: 'Familia Ulloa',
      status: 'ACTIVO',
      base_currency: 'ARS',
      start_date: new Date().toISOString().split('T')[0],
      is_deleted: false
    }]).select().single();

    if (pError) throw pError;

    // Get reference IDs
    const { data: accounts } = await supabase.from('accounts').select('id').limit(1);
    const { data: providers } = await supabase.from('providers').select('id').limit(1);
    const { data: expenseTypes } = await supabase.from('catalog_expense_type').select('id').limit(1);
    const { data: paymentStatuses } = await supabase.from('catalog_payment_status').select('id').limit(1);

    const accountId = accounts?.[0]?.id;
    const providerId = providers?.[0]?.id;
    const expenseTypeId = expenseTypes?.[0]?.id;
    const paymentStatusId = paymentStatuses?.[0]?.id;

    // 2. Create Expense
    if (accountId && expenseTypeId && paymentStatusId) {
      await supabase.from('expenses').insert([{
        project_id: project.id,
        account_id: accountId,
        provider_id: providerId, // Optional
        expense_type_id: expenseTypeId,
        payment_status_id: paymentStatusId,
        description: 'Compra de materiales iniciales',
        amount: 15000.50,
        currency: 'ARS',
        expense_date: new Date().toISOString().split('T')[0],
        is_deleted: false
      }]);
    }

    // 3. Create Income
    if (accountId) {
      await supabase.from('incomes').insert([{
        project_id: project.id,
        account_id: accountId,
        description: 'Anticipo Cliente',
        amount: 50000.00,
        currency: 'ARS',
        income_date: new Date().toISOString().split('T')[0],
        is_deleted: false
      }]);
    }

    // 4. Create Daily Report
    await supabase.from('daily_reports').insert([{
      project_id: project.id,
      report_date: new Date().toISOString().split('T')[0],
      work_done: 'Inicio de obra. Limpieza de terreno y replanteo.',
      workers: 'Juan, Pedro, Miguel',
      is_deleted: false
    }]);

    return { success: true, message: 'Test scenario created: Project "Casa Ulloa" with expense, income and report.' };
  } catch (error) {
    console.error('Test scenario error:', error);
    return { success: false, message: error.message };
  }
};
