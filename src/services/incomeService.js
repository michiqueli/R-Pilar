
import { supabase } from '@/lib/customSupabaseClient';

export const incomeService = {
  /**
   * Validates if an account exists and is active
   * @param {string} accountId 
   * @returns {Promise<boolean>}
   */
  async validateAccount(accountId) {
    if (!accountId) return false;
    
    // Check both accounts and cuentas tables to be safe, or prefer accounts as per schema
    const { data, error } = await supabase
      .from('cuentas')
      .select('id')
      .eq('id', accountId)
      .eq('is_deleted', false)
      .maybeSingle();
    
    if (data) return true;

    // Fallback check in cuentas
    const { data: cuentaData } = await supabase
      .from('cuentas')
      .select('id')
      .eq('id', accountId)
      .eq('is_deleted', false)
      .maybeSingle();

    return !!cuentaData;
  },

  /**
   * Get all active incomes
   */
  async getIncomes() {
    const { data, error } = await supabase
      .from('project_income')
      .select(`
        *,
        projects (id, name),
        cuentas (id, name)
      `)
      .eq('is_deleted', false)
      .order('income_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Get income by ID
   * @param {string} id 
   */
  async getIncomeById(id) {
    const { data, error } = await supabase
      .from('project_income')
      .select(`
        *,
        projects (id, name),
        cuentas (id, name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create a new income
   * @param {object} incomeData 
   */
  async createIncome(incomeData) {
    // Validate account existence before insertion
    if (incomeData.account_id) {
      const isAccountValid = await this.validateAccount(incomeData.account_id);
      if (!isAccountValid) {
        throw new Error('The selected account does not exist or has been deleted. Please select a valid account.');
      }
    }

    const { data, error } = await supabase
      .from('project_income')
      .insert([incomeData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing income
   * @param {string} id 
   * @param {object} incomeData 
   */
  async updateIncome(id, incomeData) {
    // Validate account existence if it's being updated
    if (incomeData.account_id) {
      const isAccountValid = await this.validateAccount(incomeData.account_id);
      if (!isAccountValid) {
        throw new Error('The selected account does not exist or has been deleted. Please select a valid account.');
      }
    }

    const { data, error } = await supabase
      .from('project_income')
      .update(incomeData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Soft delete an income
   * @param {string} id 
   */
  async deleteIncome(id) {
    const { error } = await supabase
      .from('project_income')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};
