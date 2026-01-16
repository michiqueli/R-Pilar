
import { supabase } from '@/lib/customSupabaseClient';

export const setupFinancialTables = async () => {
  console.log("Checking financial tables status...");
  
  const tables = ['ingresos', 'gastos', 'balance_mensual', 'kpis_proyecto'];
  const status = {};

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error(`Table ${table} check failed:`, error.message);
      status[table] = 'MISSING or ERROR';
    } else {
      console.log(`Table ${table} exists.`);
      status[table] = 'OK';
    }
  }

  console.table(status);
  return status;
};
