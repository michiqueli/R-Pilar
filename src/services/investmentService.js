
import { supabase } from '@/lib/customSupabaseClient';

export const investmentService = {
  /**
   * Fetches investment movements for a specific project.
   * Filters by types related to investments (contributions and returns).
   * @param {string} projectId 
   * @returns {Promise<Array>} Array of movement objects
   */
  async getInvestmentMovements(projectId) {
    try {
      const { data, error } = await supabase
        .from('inversiones_movimientos')
        .select(`
          *,
          inversionista:inversionistas(nombre)
        `)
        .eq('project_id', projectId)
        .in('tipo', ['INVERSION_RECIBIDA', 'DEVOLUCION_INVERSION', 'APORTE', 'DEVOLUCION', 'INGRESO', 'EGRESO'])
        .order('fecha', { ascending: false });

      if (error) {
        console.error('Error fetching investment movements:', error);
        throw error;
      }

      return data.map(mov => ({
        ...mov,
        investor_name: mov.inversionista?.nombre || 'Desconocido'
      }));
    } catch (error) {
      console.error('Error in getInvestmentMovements:', error);
      throw error;
    }
  },

  async createInvestmentMovement(payload) {
    try {
      const { data, error } = await supabase
        .from('inversiones_movimientos')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creating investment movement:', error);
      throw error;
    }
  },

  async getInvestorKPIs(investorId) {
    try {
      const { data, error } = await supabase
        .from('inversiones_movimientos')
        .select('tipo, monto_usd, monto_ars')
        .eq('inversionista_id', investorId);

      if (error) throw error;

      let totalInvertidoUSD = 0;
      let totalDevueltoUSD = 0;
      let totalInvertidoARS = 0;
      let totalDevueltoARS = 0;

      data.forEach(mov => {
        if (mov.tipo === 'INGRESO' || mov.tipo === 'INVERSION_RECIBIDA' || mov.tipo === 'APORTE') {
          totalInvertidoUSD += Number(mov.monto_usd || 0);
          totalInvertidoARS += Number(mov.monto_ars || 0);
        } else if (mov.tipo === 'EGRESO' || mov.tipo === 'DEVOLUCION_INVERSION' || mov.tipo === 'DEVOLUCION') {
          totalDevueltoUSD += Number(mov.monto_usd || 0);
          totalDevueltoARS += Number(mov.monto_ars || 0);
        }
      });

      return {
        totalInvertidoUSD,
        totalDevueltoUSD,
        totalInvertidoARS,
        totalDevueltoARS,
        saldoNetoUSD: totalInvertidoUSD - totalDevueltoUSD,
        saldoNetoARS: totalInvertidoARS - totalDevueltoARS
      };
    } catch (error) {
      console.error('Error fetching investor KPIs:', error);
      return {
        totalInvertidoUSD: 0,
        totalDevueltoUSD: 0,
        totalInvertidoARS: 0,
        totalDevueltoARS: 0,
        saldoNetoUSD: 0,
        saldoNetoARS: 0
      };
    }
  },

  async getAccountKPIs(accountId) {
    try {
      // 1. Fetch investment movements
      const { data: invData, error: invError } = await supabase
        .from('inversiones_movimientos')
        .select('tipo, monto_ars')
        .eq('cuenta_id', accountId);
      
      if (invError) throw invError;

      // 2. Fetch Expenses (Gastos)
      const { data: expData, error: expError } = await supabase
        .from('expenses')
        .select('amount, amount_ars')
        .eq('account_id', accountId)
        .is('is_deleted', false);

      if (expError) throw expError;

      // 3. Fetch Incomes (Ingresos)
      const { data: incData, error: incError } = await supabase
        .from('incomes')
        .select('amount, amount_ars')
        .eq('account_id', accountId)
        .is('is_deleted', false);

      if (incError) throw incError;
      
      let totalIngresado = 0;
      let totalGastos = 0;
      let mayorGasto = 0;
      let count = 0;
      
      // Process Investments
      invData.forEach(mov => {
        const monto = Number(mov.monto_ars || 0);
        if (mov.tipo === 'INGRESO' || mov.tipo === 'INVERSION_RECIBIDA') {
          totalIngresado += monto;
        } else if (mov.tipo === 'EGRESO' || mov.tipo === 'DEVOLUCION_INVERSION') {
          totalGastos += monto;
          if (monto > mayorGasto) mayorGasto = monto;
        }
        count++;
      });

      // Process Expenses
      expData.forEach(exp => {
        const monto = Number(exp.amount_ars || exp.amount || 0);
        totalGastos += monto;
        if (monto > mayorGasto) mayorGasto = monto;
        count++;
      });

      // Process Incomes
      incData.forEach(inc => {
        const monto = Number(inc.amount_ars || inc.amount || 0);
        totalIngresado += monto;
        count++;
      });

      return {
        totalIngresado,
        totalGastos,
        mayorGasto,
        cantMovimientos: count
      };
    } catch (error) {
      console.error('Error fetching account KPIs:', error);
      return { totalIngresado: 0, totalGastos: 0, mayorGasto: 0, cantMovimientos: 0 };
    }
  },

  async getAccountMovements(accountId) {
    try {
      const movements = [];

      // 1. Fetch Investment Movements
      const { data: invData } = await supabase
        .from('inversiones_movimientos')
        .select(`
          *,
          inversionista:inversionistas(nombre),
          proyecto:projects(name)
        `)
        .eq('cuenta_id', accountId)
        .order('fecha', { ascending: false });

      if (invData) {
        movements.push(...invData.map(mov => ({
          id: mov.id,
          tipo: mov.tipo === 'INVERSION_RECIBIDA' || mov.tipo === 'INGRESO' ? 'INGRESO' : 'EGRESO',
          origen: 'INVERSION',
          referencia: mov.inversionista?.nombre || 'Inversionista',
          fecha: mov.fecha,
          monto_ars: mov.monto_ars,
          monto_usd: mov.monto_usd,
          estado: mov.estado || 'CONFIRMADO',
          proyecto_nombre: mov.proyecto?.name
        })));
      }

      // 2. Fetch Expenses
      const { data: expData } = await supabase
        .from('expenses')
        .select(`
          *,
          provider:providers(name),
          project:projects(name)
        `)
        .eq('account_id', accountId)
        .is('is_deleted', false)
        .order('expense_date', { ascending: false });

      if (expData) {
        movements.push(...expData.map(exp => ({
          id: exp.id,
          tipo: 'EGRESO',
          origen: 'GASTO',
          referencia: exp.provider?.name || exp.description || 'Gasto',
          fecha: exp.expense_date,
          monto_ars: exp.amount_ars || exp.amount,
          estado: exp.payment_status === 'PAID' ? 'CONFIRMADO' : 'PENDIENTE',
          proyecto_nombre: exp.project?.name,
          descripcion: exp.description
        })));
      }

      // 3. Fetch Incomes
      const { data: incData } = await supabase
        .from('incomes')
        .select(`
          *,
          project:projects(name)
        `)
        .eq('account_id', accountId)
        .is('is_deleted', false)
        .order('income_date', { ascending: false });

      if (incData) {
        movements.push(...incData.map(inc => ({
          id: inc.id,
          tipo: 'INGRESO',
          origen: 'INGRESO',
          referencia: inc.project?.client_name || inc.description || 'Ingreso',
          fecha: inc.income_date,
          monto_ars: inc.amount_ars || inc.amount,
          estado: 'CONFIRMADO', // Incomes usually assumed confirmed if registered, or add status field
          proyecto_nombre: inc.project?.name,
          descripcion: inc.description
        })));
      }

      // Sort combined array by date desc
      return movements.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    } catch (error) {
      console.error('Error fetching account movements:', error);
      return [];
    }
  },

  async getInvestorMovements(investorId) {
    try {
      const { data, error } = await supabase
        .from('inversiones_movimientos')
        .select(`
          *,
          cuenta:cuentas(titulo),
          proyecto:projects(name)
        `)
        .eq('inversionista_id', investorId)
        .order('fecha', { ascending: false });

      if (error) throw error;

      return data.map(mov => ({
        ...mov,
        origen: 'INVERSION',
        cuenta_titulo: mov.cuenta?.titulo || 'N/A',
        proyecto_nombre: mov.proyecto?.name
      }));
    } catch (error) {
      console.error('Error fetching investor movements:', error);
      return [];
    }
  }
};
