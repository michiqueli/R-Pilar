
import { supabase } from '@/lib/customSupabaseClient';
import { addDays, format, startOfDay } from 'date-fns';

/**
 * Service to handle projected liquidity calculations based on accounts and future movements.
 * Aggregates data from 'cuentas' and 'inversiones'/'project_income'.
 */
export const liquidezProyectadaService = {

  /**
   * Calculates projected liquidity day by day for the given horizon.
   * Returns an array of objects: { date, [accountId]: balance, total }
   */
  async getLiquidezPorFecha(horizonte = 30, soloEnRiesgo = false) {
    console.log(`[liquidezProyectadaService] Calculating liquidity for ${horizonte} days (Risk only: ${soloEnRiesgo})`);
    
    try {
      // 1. Fetch Accounts
      const { data: cuentas, error: errorCuentas } = await supabase
        .from('cuentas')
        .select('id, titulo, tipo, moneda')
        .eq('is_deleted', false);

      if (errorCuentas) throw errorCuentas;

      // 2. Fetch Future Movements (Inversiones, Project Income)
      const today = startOfDay(new Date());
      const endDate = addDays(today, horizonte);
      const strToday = format(today, 'yyyy-MM-dd');
      const strEndDate = format(endDate, 'yyyy-MM-dd');

      // Helper to fetch range
      const fetchMovements = async (table, dateField, additionalFilters = []) => {
        let query = supabase
          .from(table)
          .select('*')
          .gte(dateField, strToday)
          .lte(dateField, strEndDate);
        
        // Apply additional filters if any
        additionalFilters.forEach(filter => {
          query = query.filter(filter.column, filter.operator, filter.value);
        });

        const { data, error } = await query;
        if (error) throw error;
        return data;
      };

      const [inversiones, incomes] = await Promise.all([
        fetchMovements('inversiones', 'fecha'),
        fetchMovements('project_income', 'income_date', [{ column: 'is_deleted', operator: 'eq', value: false }])
      ]);

      // Normalize movements
      const allMovements = [
        ...inversiones.map(m => {
          // Determine sign based on type
          let amount = Number(m.monto_ars || 0);
          if (['GASTO', 'DEVOLUCION', 'RETIRO'].includes(m.tipo)) {
            amount = -amount;
          }
          // 'INVERSION' is typically an inflow to the account
          
          return { 
            date: m.fecha, 
            amount: amount,
            accountId: m.cuenta_id 
          };
        }),
        ...incomes.map(m => ({ 
          date: m.income_date, 
          amount: Number(m.amount || 0), // Income is positive
          accountId: m.account_id 
        }))
      ];

      // 3. Initialize Balances
      // Try to fetch current balances from 'accounts' table if 'cuentas' doesn't have it, 
      // or assume 0 if not available.
      // Note: 'cuentas' table in schema doesn't show balance, but 'accounts' does.
      // We'll try to map by ID or just start from 0 for projection if not linked.
      let currentBalances = {};
      
      // Attempt to fetch balances from 'accounts' table which matches 'cuentas' IDs usually
      const { data: accountBalances } = await supabase
        .from('accounts')
        .select('id, balance');

      cuentas.forEach(c => {
        const bal = accountBalances?.find(b => b.id === c.id)?.balance || 0;
        currentBalances[c.id] = Number(bal);
      });

      // 4. Project Day by Day
      const projection = [];
      let runningBalances = { ...currentBalances };
      
      for (let d = 0; d <= horizonte; d++) {
        const currentDate = addDays(today, d);
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        
        // Find movements for this day
        const dailyMoves = allMovements.filter(m => m.date === dateStr);
        
        // Apply movements
        dailyMoves.forEach(m => {
          if (runningBalances[m.accountId] !== undefined) {
            runningBalances[m.accountId] += m.amount;
          }
        });

        // Create data point
        const dataPoint = {
          date: dateStr,
          total: 0,
          details: []
        };

        let dailyTotal = 0;
        Object.keys(runningBalances).forEach(accId => {
          const bal = runningBalances[accId];
          const acc = cuentas.find(c => c.id === accId);
          if (acc) {
            dataPoint[acc.titulo] = bal; // Use name as key for Recharts
            dataPoint[accId] = bal; // Keep ID as key for safe reference
            dailyTotal += bal;
            dataPoint.details.push({
              id: accId,
              name: acc.titulo,
              balance: bal,
              currency: acc.moneda
            });
          }
        });
        
        dataPoint.total = dailyTotal;
        projection.push(dataPoint);
      }

      // Filter for risk if requested
      if (soloEnRiesgo) {
        const riskyAccounts = new Set();
        projection.forEach(day => {
          day.details.forEach(det => {
            if (det.balance < 0) riskyAccounts.add(det.id);
          });
        });

        return { data: projection, riskyIds: Array.from(riskyAccounts), allAccounts: cuentas };
      }

      return { data: projection, riskyIds: [], allAccounts: cuentas };

    } catch (error) {
      console.error('[liquidezProyectadaService] Error:', error);
      return { data: [], riskyIds: [], allAccounts: [], error };
    }
  },

  async getResumenRiesgo(horizonte, soloEnRiesgo) {
    const { data, allAccounts } = await this.getLiquidezPorFecha(horizonte, false);
    
    if (!data || data.length === 0) return null;

    const cuentasEnRiesgo = [];
    let peorSaldo = { amount: 0, date: null, account: null };

    allAccounts.forEach(acc => {
      let minBalance = Infinity;
      let minDate = null;
      let isRisk = false;

      data.forEach(day => {
        const bal = day[acc.id];
        if (bal < 0) isRisk = true;
        if (bal < minBalance) {
          minBalance = bal;
          minDate = day.date;
        }
      });

      if (isRisk) {
        cuentasEnRiesgo.push({
          id: acc.id,
          name: acc.titulo,
          minBalance,
          minDate
        });

        if (minBalance < peorSaldo.amount) {
          peorSaldo = { amount: minBalance, date: minDate, account: acc.titulo };
        }
      }
    });

    return {
      totalCuentas: allAccounts.length,
      cuentasEnRiesgoCount: cuentasEnRiesgo.length,
      peorSaldo,
      listaRiesgo: cuentasEnRiesgo
    };
  }
};
