
import { supabase } from '@/lib/customSupabaseClient';

// Helper to sanitize dates in objects
const sanitizeObjectDates = (obj) => {
  const newObj = { ...obj };
  Object.keys(newObj).forEach(key => {
    if (typeof newObj[key] === 'string' && newObj[key].trim() === '') {
      // Check if key looks like a date field
      if (key.includes('date') || key.includes('fecha') || key.includes('at')) {
        newObj[key] = null;
      }
    }
  });
  return newObj;
};

export const cuentaService = {
  async getCuentasActivas() {
    try {
      const { data, error } = await supabase
        .from('cuentas')
        .select('id, titulo, tipo, moneda, estado')
        .eq('is_deleted', false)
        .eq('estado', 'activa')
        .order('titulo', { ascending: true });

      if (error) {
        console.error("Error fetching active accounts:", error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error("Error in getCuentasActivas:", error);
      throw error;
    }
  },

  async getCuentas() {
    try {
      const { data, error } = await supabase
        .from('cuentas')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching cuentas:', error);
      throw error;
    }
  },

  async getCuentaById(id) {
    try {
      const { data, error } = await supabase
        .from('cuentas')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching cuenta:', error);
      throw error;
    }
  },

  async createCuenta(cuenta) {
    try {
      // FIX: Sanitize input
      const safeCuenta = sanitizeObjectDates(cuenta);
      
      const { data, error } = await supabase
        .from('cuentas')
        .insert([safeCuenta])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating cuenta:', error);
      throw error;
    }
  },

  async updateCuenta(id, updates) {
    try {
      // FIX: Sanitize input
      const safeUpdates = sanitizeObjectDates(updates);

      const { data, error } = await supabase
        .from('cuentas')
        .update(safeUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating cuenta:', error);
      throw error;
    }
  },

  async deleteCuenta(id) {
    try {
      const { error } = await supabase
        .from('cuentas')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting cuenta:', error);
      throw error;
    }
  },

  // Added to support KPI calculations using correct tables
  async getSaldoCuenta(id) {
    try {
      // 1. Get Incomes from project_income
      const { data: incomes, error: incomeError } = await supabase
        .from('project_income')
        .select('amount')
        .eq('account_id', id)
        .eq('is_deleted', false);
      
      if (incomeError) throw incomeError;

      // 2. Get Movements from inversiones
      const { data: movements, error: moveError } = await supabase
        .from('inversiones')
        .select('monto_ars, tipo')
        .eq('cuenta_id', id);

      if (moveError) throw moveError;

      let total = 0;

      // Sum incomes
      incomes?.forEach(i => {
        total += Number(i.amount || 0);
      });

      // Sum movements (investments/expenses)
      movements?.forEach(m => {
        const amount = Number(m.monto_ars || 0);
        if (m.tipo === 'INVERSION') {
          total += amount;
        } else {
          // Assume GASTO, DEVOLUCION, RETIRO are outflows
          total -= amount;
        }
      });

      return total;
    } catch (error) {
      console.error('Error calculating account balance:', error);
      return 0;
    }
  }
};
