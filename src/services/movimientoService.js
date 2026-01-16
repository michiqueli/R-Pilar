
import { supabase } from '@/lib/customSupabaseClient';
import { validateInvestmentMovement } from '@/lib/validationUtils';

// Helper to sanitize dates
const toNullableDate = (dateStr) => {
  if (!dateStr || dateStr.trim() === '') return null;
  return dateStr;
};

export const movimientoService = {
  // New function for Inversionista Movements Tab
  async getInversionistaMovements(inversionistaId) {
    console.log('[movimientoService] Getting movements for investor:', inversionistaId);
    try {
      const { data, error } = await supabase
        .from('inversiones')
        .select(`
          *,
          cuentas (id, titulo),
          projects (id, name),
          providers (id, name),
          inversionistas (id, nombre)
        `)
        .eq('inversionista_id', inversionistaId)
        .in('tipo', ['INVERSION', 'DEVOLUCION'])
        .order('fecha', { ascending: false });

      if (error) {
        console.error('[movimientoService] Error fetching investor movements:', error);
        throw error;
      }

      console.log(`[movimientoService] Found ${data?.length || 0} movements for investor ${inversionistaId}`);

      const normalized = (data || []).map(m => ({
        id: m.id,
        type: m.tipo,
        tipo_movimiento: m.tipo,
        description: m.descripcion,
        date: m.fecha,
        amount_ars: m.monto_ars,
        usd_amount: m.monto_usd,
        fx_rate: m.valor_usd,
        vat_amount: (m.monto_ars || 0) - (m.neto || 0),
        net_amount: m.neto,
        vat_included: m.iva_incluido,
        vat_percent: m.iva_porcentaje,
        status: m.estado,
        
        // Relations
        cuenta_titulo: m.cuentas?.titulo || '—',
        cuenta_id: m.cuenta_id,
        proyecto_nombre: m.projects?.name || '—',
        project_id: m.proyecto_id,
        inversionista_nombre: m.inversionistas?.nombre || '—',
        provider_name: m.providers?.name || '—'
      }));

      return normalized;

    } catch (error) {
      console.error('[movimientoService] getInversionistaMovements failed:', error);
      throw error;
    }
  },

  async getProjectMovements(proyectoId) {
    console.log('[movimientoService] Getting movements for project:', proyectoId);
    try {
      const { data, error } = await supabase
        .from('inversiones')
        .select(`
          *,
          cuentas (id, titulo),
          projects (id, name),
          providers (id, name),
          inversionistas (id, nombre)
        `)
        .eq('proyecto_id', proyectoId)
        .order('fecha', { ascending: false });

      if (error) {
        console.error('[movimientoService] Error fetching project movements:', error);
        throw error;
      }

      // Normalize data
      const normalized = (data || []).map(m => ({
        id: m.id,
        type: m.tipo, 
        tipo_movimiento: m.tipo,
        description: m.descripcion,
        date: m.fecha,
        
        // Economic details
        amount_ars: m.monto_ars,
        usd_amount: m.monto_usd,
        fx_rate: m.valor_usd,
        vat_amount: (m.monto_ars || 0) - (m.neto || 0),
        net_amount: m.neto,
        vat_included: m.iva_incluido,
        vat_percent: m.iva_porcentaje,
        
        status: m.estado,
        
        // Relations
        cuenta_titulo: m.cuentas?.titulo || '—',
        cuenta_id: m.cuenta_id,
        project_id: m.proyecto_id,
        
        // Helper for display
        provider_name: m.providers?.name || m.inversionistas?.nombre || '—'
      }));

      return normalized;

    } catch (error) {
      console.error('[movimientoService] getProjectMovements failed:', error);
      throw error;
    }
  },

  async getAccountMovements(cuentaId) {
    console.log('[movimientoService] Getting movements for account:', cuentaId);
    try {
      const { data, error } = await supabase
        .from('inversiones')
        .select(`
          *,
          projects (id, name),
          providers (id, name),
          inversionistas (id, nombre)
        `)
        .eq('cuenta_id', cuentaId)
        .order('fecha', { ascending: false });

      if (error) {
        console.error('[movimientoService] Error fetching account movements:', error);
        throw error;
      }

      // Normalize data to match the UI components expected structure
      const normalized = (data || []).map(m => ({
        id: m.id,
        type: m.tipo, 
        tipo_movimiento: m.tipo,
        description: m.descripcion,
        date: m.fecha,
        amount: m.monto_ars, 
        amount_ars: m.monto_ars,
        usd_amount: m.monto_usd,
        fx_rate: m.valor_usd,
        vat_amount: (m.monto_ars || 0) - (m.neto || 0), 
        net_amount: m.neto,
        status: m.estado,
        
        // Relations
        projects: m.projects, 
        providers: m.providers, 
        inversionistas: m.inversionistas,
        
        // Helper to get a displayable "Responsible" name
        responsibleName: m.inversionistas?.nombre || m.providers?.name || '-'
      }));

      return normalized;

    } catch (error) {
      console.error('[movimientoService] getAccountMovements failed:', error);
      throw error;
    }
  },

  // Legacy/Other functions preserved below
  async getMovimientos({ projectId, type, status, category, responsible, searchTerm, dateFrom, dateTo, currency } = {}) {
    try {
      // Replace 'expenses' with 'inversiones'
      let expensesQuery = supabase
        .from('inversiones')
        .select(`
          *,
          projects (id, name),
          providers (id, name),
          cuentas (id, titulo, tipo, moneda),
          inversionistas (id, nombre)
        `);

      // Replace 'incomes' with 'project_income'
      let incomesQuery = supabase
        .from('project_income')
        .select(`
          *,
          projects (id, name),
          accounts (id, name, type, currency)
        `)
        .eq('is_deleted', false);

      if (projectId) {
        expensesQuery = expensesQuery.eq('proyecto_id', projectId);
        incomesQuery = incomesQuery.eq('project_id', projectId);
      }
      
      // FIX: Sanitize date filters
      const safeDateFrom = toNullableDate(dateFrom);
      const safeDateTo = toNullableDate(dateTo);

      if (safeDateFrom) {
        expensesQuery = expensesQuery.gte('fecha', safeDateFrom);
        incomesQuery = incomesQuery.gte('income_date', safeDateFrom);
      }
      
      if (safeDateTo) {
        expensesQuery = expensesQuery.lte('fecha', safeDateTo);
        incomesQuery = incomesQuery.lte('income_date', safeDateTo);
      }

      const [expensesResult, incomesResult] = await Promise.all([
        expensesQuery,
        incomesQuery
      ]);

      if (expensesResult.error) throw expensesResult.error;
      if (incomesResult.error) throw incomesResult.error;

      const expenses = (expensesResult.data || []).map(e => ({
        ...e,
        type: 'gasto', // Map to generic 'gasto' for UI consistency or use e.tipo
        original_type: e.tipo,
        date: e.fecha,
        category: e.tipo || 'GASTO',
        categoryId: null,
        status: e.estado || 'PENDIENTE',
        statusId: e.estado,
        responsible: e.inversionistas?.nombre || e.providers?.name || '-',
        responsibleId: e.inversionista_id || e.proveedor_id,
        partida: null, // inversiones table doesn't seem to have work_item_id
        partidaId: null,
        amount_ars: e.monto_ars,
        usd_equivalent: e.monto_usd || (e.valor_usd > 0 ? e.monto_ars / e.valor_usd : 0),
        cuenta_nombre: e.cuentas?.titulo || '—',
        cuenta_tipo: e.cuentas?.tipo || '',
        cuenta_moneda: e.cuentas?.moneda || ''
      }));

      const incomes = (incomesResult.data || []).map(i => ({
        ...i,
        type: 'ingreso',
        date: i.income_date,
        category: 'Ingreso',
        categoryId: null,
        status: 'COBRADO',
        statusId: 'COBRADO',
        responsible: i.accounts?.name || '-',
        responsibleId: i.account_id,
        partida: null,
        partidaId: null,
        amount_ars: i.amount,
        usd_equivalent: 0, // project_income doesn't have fx_rate in schema provided
        cuenta_nombre: i.accounts?.name || '—',
        cuenta_tipo: i.accounts?.type || '',
        cuenta_moneda: i.accounts?.currency || ''
      }));

      let combined = [...expenses, ...incomes];
      
      combined = this.applyFilters(combined, { 
        type, 
        status, 
        category, 
        responsible, 
        searchTerm, 
        currency 
      });
      
      combined.sort((a, b) => new Date(b.date) - new Date(a.date));

      return combined;
    } catch (error) {
      console.error('Error fetching movimientos:', error);
      throw error;
    }
  },

  async getMonthlyBalance(projectId, month, year) {
    try {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0); 
      
      const dateFrom = startDate.toISOString().split('T')[0];
      const dateTo = endDate.toISOString().split('T')[0];

      const movimientos = await this.getMovimientos({ 
        projectId, 
        dateFrom, 
        dateTo 
      });

      return this.calculateBalanceFromMovimientos(movimientos);
    } catch (error) {
      console.error("Error calculating monthly balance:", error);
      return { balance: 0, income: 0, expense: 0 };
    }
  },

  async getTotalBalance(projectId) {
    try {
      const movimientos = await this.getMovimientos({ projectId });
      return this.calculateBalanceFromMovimientos(movimientos);
    } catch (error) {
      console.error("Error calculating total balance:", error);
      return { balance: 0, income: 0, expense: 0 };
    }
  },

  calculateBalanceFromMovimientos(movimientos) {
    let income = 0;
    let expense = 0;

    movimientos.forEach(m => {
      const amount = Number(m.amount_ars || m.amount || 0);
      
      if (m.type === 'ingreso') {
        income += amount;
      } else if (m.type === 'gasto' || m.original_type === 'GASTO' || m.original_type === 'DEVOLUCION') {
        // Assuming confirmed/paid status check if needed, but 'inversiones' status might be different
        // For now, sum all
        expense += amount;
      }
    });

    return {
      balance: income - expense,
      income,
      expense
    };
  },

  async getMovimientosByCuenta(cuentaId) {
    try {
      // Replace 'expenses' with 'inversiones'
      const { data: expenses, error: expenseError } = await supabase
        .from('inversiones')
        .select(`
          *,
          projects (id, name),
          providers (id, name),
          inversionistas (id, nombre)
        `)
        .eq('cuenta_id', cuentaId);
        
      if (expenseError) throw expenseError;

      // Replace 'incomes' with 'project_income'
      const { data: incomes, error: incomeError } = await supabase
        .from('project_income')
        .select(`
          *,
          projects (id, name)
        `)
        .eq('account_id', cuentaId)
        .eq('is_deleted', false);

      if (incomeError) throw incomeError;

      const normalizedExpenses = (expenses || []).map(e => ({
        ...e,
        type: 'gasto',
        date: e.fecha,
        status: e.estado || 'PENDIENTE',
        amount: Number(e.monto_ars),
        project_name: e.projects?.name,
        provider_name: e.providers?.name,
        inversionista_nombre: e.inversionistas?.nombre
      }));

      const normalizedIncomes = (incomes || []).map(i => ({
        ...i,
        type: 'ingreso',
        date: i.income_date,
        status: 'COBRADO',
        amount: Number(i.amount),
        project_name: i.projects?.name,
        inversionista_nombre: null // project_income doesn't link to investor directly
      }));

      const all = [...normalizedExpenses, ...normalizedIncomes];
      return all.sort((a, b) => new Date(b.date) - new Date(a.date));

    } catch (error) {
      console.error("Error getMovimientosByCuenta:", error);
      throw error;
    }
  },

  async getMovimientoStats(cuentaId) {
    try {
      const movimientos = await this.getMovimientosByCuenta(cuentaId);
      
      let totalIngresado = 0;
      let totalGastos = 0;
      let mayorGasto = 0;

      movimientos.forEach(m => {
        const val = Number(m.amount) || 0;
        if (m.type === 'ingreso') {
          totalIngresado += val;
        } else {
          totalGastos += val;
          if (val > mayorGasto) mayorGasto = val;
        }
      });

      return {
        totalIngresado,
        totalGastos,
        mayorGasto,
        cantidad: movimientos.length
      };
    } catch (error) {
      console.error("Error getMovimientoStats:", error);
      return { totalIngresado: 0, totalGastos: 0, mayorGasto: 0, cantidad: 0 };
    }
  },

  applyFilters(movimientos, { type, status, category, responsible, searchTerm, currency }) {
    return movimientos.filter(mov => {
      if (type && type !== 'todos' && mov.type !== type) return false;
      
      if (status && status.length > 0) {
        const normalizedStatus = (mov.status || '').toUpperCase();
        const hasMatch = status.some(s => normalizedStatus.includes(s.toUpperCase()));
        if (hasMatch) return false;
      }

      if (category && category.length > 0 && !category.includes(mov.categoryId)) return false;

      if (responsible && responsible.length > 0 && !responsible.includes(mov.responsibleId)) return false;

      if (currency && currency !== 'ALL' && mov.currency !== currency) return false;

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesDescription = mov.description?.toLowerCase().includes(searchLower);
        const matchesProject = mov.projects?.name?.toLowerCase().includes(searchLower);
        const matchesPartida = mov.partida?.toLowerCase().includes(searchLower);
        const matchesAmount = mov.amount?.toString().includes(searchTerm) || mov.amount_ars?.toString().includes(searchTerm);
        const matchesResponsible = mov.responsible?.toLowerCase().includes(searchLower);
        
        if (!matchesDescription && !matchesProject && !matchesAmount && !matchesPartida && !matchesResponsible) return false;
      }

      return true;
    });
  },

  sortMovimientos(movimientos, sortBy = 'date', sortOrder = 'desc') {
    if (!Array.isArray(movimientos)) return [];
    
    return [...movimientos].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'project') {
        valA = a.projects?.name || '';
        valB = b.projects?.name || '';
      } else if (sortBy === 'amount') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else if (sortBy === 'date') {
        valA = new Date(valA || 0).getTime();
        valB = new Date(valB || 0).getTime();
      } else {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  },

  paginateMovimientos(movimientos, page = 1, pageSize = 25) {
    if (!Array.isArray(movimientos)) return { data: [], totalPages: 0 };
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = movimientos.slice(startIndex, endIndex);
    const totalPages = Math.ceil(movimientos.length / pageSize);
    
    return {
      data: paginatedData,
      totalPages
    };
  },

  async createMovimiento(payload) {
    const isInvestment = payload.tipo_movimiento === 'INVERSION_RECIBIDA' || payload.tipo_movimiento === 'DEVOLUCION_INVERSION';
    
    if (isInvestment) {
      const validationForm = {
        inversionista_id: payload.inversionistaId || payload.inversionista_id,
        proyecto_id: payload.projectId || payload.project_id,
        tipo_movimiento: payload.tipo_movimiento,
        fecha: payload.date || payload.fecha,
        monto_ars: payload.amount_ars,
        cotizacion_ars_usd: payload.fx_rate,
        monto_usd: payload.usd_amount
      };

      const { isValid, errors } = validateInvestmentMovement(validationForm);
      if (!isValid) {
        const firstError = Object.values(errors)[0];
        throw new Error(firstError);
      }
    }

    return this.saveMovimiento(payload, true);
  },

  async updateMovimiento(id, payload) {
    return this.saveMovimiento({ ...payload, id }, false);
  },

  async saveMovimiento(payload, isNew) {
    const { 
      id, type, description, amount, category, projectId, date, responsible, notes, 
      amount_ars, fx_rate, usd_amount, vat_percent, vat_included, net_amount, vat_amount,
      partidaId, status, comprobante_url, tipo_movimiento, inversionista_id, account_id, cuenta_id
    } = payload;

    // FIX: Sanitize date
    const safeDate = toNullableDate(date);

    const isExpenseTable = type === 'gasto' || type === 'DEVOLUCION_INVERSION';
    
    if (isExpenseTable) {
      // Map to 'inversiones' table
      const inversionData = {
        descripcion: description,
        monto_ars: amount_ars || amount,
        fecha: safeDate, // Use sanitized date
        tipo: tipo_movimiento || 'GASTO',
        estado: status || 'PENDIENTE',
        cuenta_id: cuenta_id || account_id || null,
        proyecto_id: projectId || null,
        proveedor_id: responsible || null, // Assuming responsible is provider ID for expenses
        inversionista_id: inversionista_id || null,
        monto_usd: usd_amount,
        valor_usd: fx_rate,
        iva_incluido: vat_included,
        iva_porcentaje: vat_percent,
        neto: net_amount,
        notas: notes
      };

      if (isNew) {
        const { data, error } = await supabase.from('inversiones').insert([inversionData]).select().single();
        if (error) throw error;
        return { ...data, type: 'gasto' };
      } else {
        const { data, error } = await supabase.from('inversiones').update(inversionData).eq('id', id).select().single();
        if (error) throw error;
        return { ...data, type: 'gasto' };
      }
    } else {
      // Map to 'project_income' table
      const incomeData = {
        description,
        amount: amount_ars || amount,
        income_date: safeDate, // Use sanitized date
        project_id: projectId,
        account_id: account_id || responsible, // Assuming responsible is account ID for incomes sometimes
        notes: notes,
        vat_amount: vat_amount,
        attachment_url: comprobante_url,
        is_deleted: false
      };

      if (isNew) {
        const { data, error } = await supabase.from('project_income').insert([incomeData]).select().single();
        if (error) throw error;
        return { ...data, type: 'ingreso' };
      } else {
        const { data, error } = await supabase.from('project_income').update(incomeData).eq('id', id).select().single();
        if (error) throw error;
        return { ...data, type: 'ingreso' };
      }
    }
  },

  async deleteMovimiento(movimientoId, type) {
    const table = (type === 'gasto' || type === 'DEVOLUCION_INVERSION') ? 'inversiones' : 'project_income';
    
    if (table === 'project_income') {
      const { error } = await supabase
        .from(table)
        .update({ is_deleted: true })
        .eq('id', movimientoId);
      if (error) throw error;
    } else {
      // 'inversiones' doesn't have is_deleted in schema, so we might need to delete or update status
      // Assuming hard delete or status update based on schema limitations
      // Schema: id, created_at, tipo, descripcion, fecha, monto_ars, estado...
      // We'll try to delete row for now as no is_deleted column is visible in schema for inversiones
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', movimientoId);
      if (error) throw error;
    }
  },

  async getMovimientoById(id, type) {
    const table = (type === 'gasto' || type === 'DEVOLUCION_INVERSION') ? 'inversiones' : 'project_income';
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  },
  
  async uploadComprobante(file) {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from('movimientos-comprobantes')
      .upload(filePath, file);

    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage
      .from('movimientos-comprobantes')
      .getPublicUrl(filePath);
    return publicUrl;
  },

  async getMonthlyMovements(projectId, month, year) {
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    
    return this.getMovimientos({
      projectId,
      dateFrom: startDate,
      dateTo: endDate
    });
  }
};
