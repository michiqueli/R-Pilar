
import { supabase } from '@/lib/customSupabaseClient';

const TABLE_MOVIMIENTOS = 'inversiones'; // Using the main movements table
const TABLE_CUENTAS = 'cuentas';

export const movimientosTesoreriaService = {
  // Helper to log with emoji
  log: (msg, data = null) => {
    console.log(`💰 [Tesoreria] ${msg}`, data || '');
  },

  getError: (msg, error) => {
    console.error(`❌ [Tesoreria] ${msg}`, error);
    return { success: false, error: error.message };
  },

  getSuccess: (data) => {
    return { success: true, data };
  },

  // 1. Get next payments within horizon
  async getProximosPagos(diasHorizonte = 30) {
    this.log(`Getting upcoming payments (next ${diasHorizonte} days)...`);
    try {
      const today = new Date();
      const horizonDate = new Date();
      horizonDate.setDate(today.getDate() + diasHorizonte);

      const { data, error } = await supabase
        .from(TABLE_MOVIMIENTOS)
        .select(`
          *,
          cuentas (id, titulo, tipo, moneda),
          providers (id, name),
          inversionistas (id, nombre)
        `)
        .in('tipo', ['GASTO', 'DEVOLUCION'])
        .eq('estado', 'PENDIENTE')
        .lte('fecha', horizonDate.toISOString())
        .gte('fecha', today.toISOString())
        .order('fecha', { ascending: true });

      if (error) throw error;
      this.log(`Found ${data.length} upcoming payments.`);
      return this.getSuccess(data);
    } catch (error) {
      return this.getError('Error fetching upcoming payments', error);
    }
  },

  // 2. Get next collections within horizon
  async getProximosCobros(diasHorizonte = 30) {
    this.log(`Getting upcoming collections (next ${diasHorizonte} days)...`);
    try {
      const today = new Date();
      const horizonDate = new Date();
      horizonDate.setDate(today.getDate() + diasHorizonte);

      const { data, error } = await supabase
        .from(TABLE_MOVIMIENTOS)
        .select(`
          *,
          cuentas (id, titulo, tipo, moneda),
          providers (id, name),
          inversionistas (id, nombre)
        `)
        .in('tipo', ['INGRESO', 'INVERSION'])
        .eq('estado', 'PENDIENTE')
        .lte('fecha', horizonDate.toISOString())
        .gte('fecha', today.toISOString())
        .order('fecha', { ascending: true });

      if (error) throw error;
      this.log(`Found ${data.length} upcoming collections.`);
      return this.getSuccess(data);
    } catch (error) {
      return this.getError('Error fetching upcoming collections', error);
    }
  },

  // 3. Get all payments (history + pending)
  async getTodosLosPagos() {
    this.log('Getting all payments history...');
    try {
      const { data, error } = await supabase
        .from(TABLE_MOVIMIENTOS)
        .select('*')
        .in('tipo', ['GASTO', 'DEVOLUCION'])
        .order('fecha', { ascending: false });

      if (error) throw error;
      return this.getSuccess(data);
    } catch (error) {
      return this.getError('Error fetching all payments', error);
    }
  },

  // 4. Get all collections (history + pending)
  async getTodosCobros() {
    this.log('Getting all collections history...');
    try {
      const { data, error } = await supabase
        .from(TABLE_MOVIMIENTOS)
        .select('*')
        .in('tipo', ['INGRESO', 'INVERSION'])
        .order('fecha', { ascending: false });

      if (error) throw error;
      return this.getSuccess(data);
    } catch (error) {
      return this.getError('Error fetching all collections', error);
    }
  },

  // 5. Get pending confirmation
  async getPendientesConfirmacion() {
    this.log('Getting items pending confirmation...');
    try {
      const { data, error } = await supabase
        .from(TABLE_MOVIMIENTOS)
        .select(`
          *,
          cuentas (titulo),
          providers (name),
          inversionistas (nombre)
        `)
        .eq('estado', 'PENDIENTE')
        .order('fecha', { ascending: true });

      if (error) throw error;
      return this.getSuccess(data);
    } catch (error) {
      return this.getError('Error fetching pending items', error);
    }
  },

  // 6. Get account status and balances
  async getEstadoCuentas() {
    this.log('Getting account status...');
    try {
      // Get all active accounts
      const { data: accounts, error: accError } = await supabase
        .from(TABLE_CUENTAS)
        .select('*')
        .neq('is_deleted', true)
        .eq('estado', 'ACTIVA'); // Assuming 'estado' column exists or using active logic

      if (accError) throw accError;

      // For each account, we could calculate the real balance if needed, 
      // but assuming 'balance' column is maintained or we rely on 'inversiones' sum.
      // For now, let's fetch current movements to calculate a live balance if necessary.
      // Or if the accounts table has a balance field, use it.
      // Based on schema, accounts has 'balance' numeric.

      return this.getSuccess(accounts);
    } catch (error) {
      return this.getError('Error fetching account status', error);
    }
  },

  // 7. Get accounts at risk (balance < 0)
  async getCuentasEnRiesgo() {
    this.log('Checking for accounts at risk...');
    try {
      const { data: accounts, error } = await supabase
        .from(TABLE_CUENTAS)
        .select('*')
        .lt('balance', 0)
        .neq('is_deleted', true);

      if (error) throw error;
      this.log(`Found ${accounts.length} accounts at risk.`);
      return this.getSuccess(accounts);
    } catch (error) {
      return this.getError('Error fetching risky accounts', error);
    }
  },

  // 8. Calculate projected liquidity
  async getLiquidezProyectada(diasHorizonte = 30) {
    this.log(`Calculating projected liquidity (${diasHorizonte} days)...`);
    try {
      // 1. Get current accounts state
      const { data: accounts } = await this.getEstadoCuentas();
      if (!accounts) throw new Error("Could not fetch accounts");

      // 2. Get pending movements within horizon
      const { data: pagos } = await this.getProximosPagos(diasHorizonte);
      const { data: cobros } = await this.getProximosCobros(diasHorizonte);

      // 3. Project balance per account
      const projection = accounts.map(acc => {
        const accPagos = (pagos?.data || []).filter(p => p.cuenta_id === acc.id);
        const accCobros = (cobros?.data || []).filter(c => c.cuenta_id === acc.id);

        const totalPagos = accPagos.reduce((sum, p) => sum + Number(p.monto_ars || 0), 0);
        const totalCobros = accCobros.reduce((sum, c) => sum + Number(c.monto_ars || 0), 0);

        const currentBalance = Number(acc.balance || 0);
        const projectedBalance = currentBalance + totalCobros - totalPagos;

        return {
          ...acc,
          saldoActual: currentBalance,
          pagosProyectados: totalPagos,
          cobrosProyectados: totalCobros,
          saldoProyectado: projectedBalance,
          enRiesgo: projectedBalance < 0
        };
      });

      return this.getSuccess(projection);
    } catch (error) {
      return this.getError('Error calculating projected liquidity', error);
    }
  },

  // 9. Get all movements with relations
  async getTodosMovimientos() {
    this.log('Fetching all movements...');
    try {
      const { data, error } = await supabase
        .from(TABLE_MOVIMIENTOS)
        .select(`
          *,
          cuentas (id, titulo, moneda),
          providers (id, name),
          inversionistas (id, nombre)
        `)
        .order('fecha', { ascending: false });

      if (error) throw error;
      return this.getSuccess(data);
    } catch (error) {
      return this.getError('Error fetching all movements', error);
    }
  },

  // 10. Filtered movements
  async getMovimientosPorFiltros(filtros = {}) {
    this.log('Fetching movements with filters...', filtros);
    try {
      let query = supabase
        .from(TABLE_MOVIMIENTOS)
        .select(`
          *,
          cuentas (id, titulo, moneda),
          providers (id, name),
          inversionistas (id, nombre)
        `);

      if (filtros.tipo) query = query.eq('tipo', filtros.tipo);
      if (filtros.estado) query = query.eq('estado', filtros.estado);
      if (filtros.cuenta_id) query = query.eq('cuenta_id', filtros.cuenta_id);
      if (filtros.fechaDesde) query = query.gte('fecha', filtros.fechaDesde);
      if (filtros.fechaHasta) query = query.lte('fecha', filtros.fechaHasta);
      if (filtros.search) {
        query = query.ilike('descripcion', `%${filtros.search}%`);
      }

      const { data, error } = await query.order('fecha', { ascending: false });

      if (error) throw error;
      return this.getSuccess(data);
    } catch (error) {
      return this.getError('Error filtering movements', error);
    }
  }
};
