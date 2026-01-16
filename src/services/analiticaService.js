
import { supabase } from '@/lib/customSupabaseClient';

export const analiticaService = {
  
  /**
   * Helper to build date range filter
   */
  getDateRange(periodo, year, month) {
    let startDate, endDate;
    
    if (periodo === 'mes') {
      const y = parseInt(year);
      const m = parseInt(month) - 1; // 0-11
      startDate = new Date(y, m, 1).toISOString();
      // Last day of month
      endDate = new Date(y, m + 1, 0, 23, 59, 59).toISOString();
    } else {
      // Annual
      startDate = `${year}-01-01T00:00:00`;
      endDate = `${year}-12-31T23:59:59`;
    }
    return { startDate, endDate };
  },

  /**
   * 1. KPIs Generales (Ingresos, Egresos, Beneficio, Saldo)
   */
  async getKPIs(periodo, year, month, moneda) {
    console.log('Fetching KPIs...', { periodo, year, month, moneda });
    const { startDate, endDate } = this.getDateRange(periodo, year, month);
    
    const { data, error } = await supabase
      .from('inversiones')
      .select('tipo, monto_ars, monto_usd, estado')
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .eq('estado', 'CONFIRMADO');

    if (error) {
      console.error('Error fetching KPIs:', error);
      throw error;
    }

    let ingresos = 0;
    let egresos = 0;

    data.forEach(m => {
      const monto = moneda === 'USD' ? (m.monto_usd || 0) : (m.monto_ars || 0);
      
      if (['INGRESO', 'COBRO'].includes(m.tipo)) {
        ingresos += monto;
      } else if (['GASTO', 'PAGO', 'INVERSION'].includes(m.tipo)) {
        egresos += monto;
      }
    });

    const beneficio = ingresos - egresos;
    
    // Calculate total balance separately as it is a snapshot
    const saldoTotal = await this.getSaldoTotal(moneda);

    return {
      ingresos,
      egresos,
      beneficio,
      saldoTotal
    };
  },

  /**
   * 2. Ingresos por Proyecto
   */
  async getIngresosPorProyecto(periodo, year, month, moneda) {
    const { startDate, endDate } = this.getDateRange(periodo, year, month);

    const { data, error } = await supabase
      .from('inversiones')
      .select(`
        monto_ars, monto_usd, proyecto_id,
        projects:proyecto_id (name)
      `)
      .in('tipo', ['INGRESO', 'COBRO'])
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .not('proyecto_id', 'is', null);

    if (error) throw error;

    const agrupado = {};
    let total = 0;

    data.forEach(d => {
      const monto = moneda === 'USD' ? (d.monto_usd || 0) : (d.monto_ars || 0);
      const nombre = d.projects?.name || 'Sin Nombre';
      
      if (!agrupado[nombre]) agrupado[nombre] = 0;
      agrupado[nombre] += monto;
      total += monto;
    });

    const resultado = Object.entries(agrupado)
      .map(([nombre, monto]) => ({ nombre, monto }))
      .sort((a, b) => b.monto - a.monto);

    return { datos: resultado, total };
  },

  /**
   * 3. Egresos por Proyecto
   */
  async getEgresosPorProyecto(periodo, year, month, moneda) {
    const { startDate, endDate } = this.getDateRange(periodo, year, month);

    const { data, error } = await supabase
      .from('inversiones')
      .select(`
        monto_ars, monto_usd, proyecto_id,
        projects:proyecto_id (name)
      `)
      .in('tipo', ['GASTO', 'PAGO', 'INVERSION'])
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .not('proyecto_id', 'is', null);

    if (error) throw error;

    const agrupado = {};
    let total = 0;

    data.forEach(d => {
      const monto = moneda === 'USD' ? (d.monto_usd || 0) : (d.monto_ars || 0);
      const nombre = d.projects?.name || 'Sin Nombre';
      
      if (!agrupado[nombre]) agrupado[nombre] = 0;
      agrupado[nombre] += monto;
      total += monto;
    });

    const resultado = Object.entries(agrupado)
      .map(([nombre, monto]) => ({ nombre, monto }))
      .sort((a, b) => b.monto - a.monto);

    return { datos: resultado, total };
  },

  /**
   * 4. Ingresos vs Egresos (Chart Data)
   */
  async getIngresosVsEgresos(periodo, year, month, moneda) {
    const { startDate, endDate } = this.getDateRange(periodo, year, month);
    
    const { data, error } = await supabase
      .from('inversiones')
      .select('fecha, tipo, monto_ars, monto_usd')
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .eq('estado', 'CONFIRMADO')
      .order('fecha');

    if (error) throw error;

    const grouped = {};
    
    data.forEach(d => {
      const dateObj = new Date(d.fecha);
      let key;
      let label;

      if (periodo === 'anio') {
        key = dateObj.getMonth(); 
        label = dateObj.toLocaleString('es-ES', { month: 'short' });
      } else {
        key = dateObj.getDate();
        label = `${key}/${dateObj.getMonth() + 1}`;
      }

      if (!grouped[key]) {
        grouped[key] = { name: label, ingresos: 0, egresos: 0, order: key };
      }

      const monto = moneda === 'USD' ? (d.monto_usd || 0) : (d.monto_ars || 0);

      if (['INGRESO', 'COBRO'].includes(d.tipo)) {
        grouped[key].ingresos += monto;
      } else if (['GASTO', 'PAGO', 'INVERSION'].includes(d.tipo)) {
        grouped[key].egresos += monto;
      }
    });

    return Object.values(grouped).sort((a, b) => a.order - b.order);
  },

  /**
   * 5. Beneficio por Obra (Legacy - can use getTopBottomObras instead)
   */
  async getBeneficioPorObra(periodo, year, month, moneda) {
    return (await this.getTopBottomObras(periodo, year, month, moneda)).sort((a,b) => b.beneficio - a.beneficio);
  },

  /**
   * 6. Top Proveedores
   */
  async getTopProveedores(periodo, year, month, moneda) {
    const { startDate, endDate } = this.getDateRange(periodo, year, month);

    const { data, error } = await supabase
      .from('inversiones')
      .select(`
        monto_ars, monto_usd, proveedor_id,
        providers:proveedor_id (name)
      `)
      .in('tipo', ['GASTO', 'PAGO'])
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .eq('estado', 'CONFIRMADO')
      .not('proveedor_id', 'is', null);

    if (error) throw error;

    const agrupado = {};

    data.forEach(d => {
      const monto = moneda === 'USD' ? (d.monto_usd || 0) : (d.monto_ars || 0);
      const nombre = d.providers?.name || 'Sin Nombre';

      if (!agrupado[nombre]) {
        agrupado[nombre] = { nombre, monto: 0, cantidad: 0 };
      }
      agrupado[nombre].monto += monto;
      agrupado[nombre].cantidad += 1;
    });

    return Object.values(agrupado).sort((a, b) => b.monto - a.monto).slice(0, 5);
  },

  /**
   * 7. Top Clientes
   */
  async getTopClientes(periodo, year, month, moneda) {
    const { startDate, endDate } = this.getDateRange(periodo, year, month);

    const { data, error } = await supabase
      .from('inversiones')
      .select(`
        tipo, monto_ars, monto_usd, proyecto_id
      `)
      .in('tipo', ['INGRESO', 'COBRO'])
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .eq('estado', 'CONFIRMADO')
      .not('proyecto_id', 'is', null);

    if (error) throw error;
    if (!data.length) return [];

    const projectIds = [...new Set(data.map(d => d.proyecto_id))];
    
    const { data: projectsData } = await supabase
      .from('projects')
      .select('id, client_id, clients:client_id(name)')
      .in('id', projectIds);
    
    const projectMap = {};
    projectsData?.forEach(p => {
      projectMap[p.id] = p.clients?.name || 'Sin Cliente';
    });

    const agrupado = {};

    data.forEach(d => {
      const clientName = projectMap[d.proyecto_id];
      if (!clientName) return;

      const monto = moneda === 'USD' ? (d.monto_usd || 0) : (d.monto_ars || 0);

      if (!agrupado[clientName]) {
        agrupado[clientName] = { nombre: clientName, beneficio: 0, nroProyectos: new Set() };
      }
      agrupado[clientName].beneficio += monto;
      agrupado[clientName].nroProyectos.add(d.proyecto_id);
    });

    return Object.values(agrupado).map(item => ({
      ...item,
      nroProyectos: item.nroProyectos.size
    })).sort((a, b) => b.beneficio - a.beneficio).slice(0, 5);
  },

  /**
   * 8. Saldo Total (Real Balance from Active Cuentas)
   * Calculates balance by summing all historical confirmed movements for active accounts.
   */
  async getSaldoTotal(moneda) {
    console.log('Calculating real saldo for:', moneda);
    
    // 1. Get all active accounts
    const { data: cuentas, error: cuentasError } = await supabase
      .from('cuentas')
      .select('id, moneda')
      .eq('is_deleted', false)
      .eq('estado', 'ACTIVA'); // Assuming 'ACTIVA' is the status for active accounts

    if (cuentasError) {
      console.error('Error fetching cuentas:', cuentasError);
      throw cuentasError;
    }

    if (!cuentas || cuentas.length === 0) return 0;

    const cuentaIds = cuentas.map(c => c.id);

    // 2. Fetch ALL confirmed movements for these accounts (no date filter)
    const { data: movimientos, error: movError } = await supabase
      .from('inversiones')
      .select('cuenta_id, tipo, monto_ars, monto_usd')
      .in('cuenta_id', cuentaIds)
      .eq('estado', 'CONFIRMADO');

    if (movError) {
      console.error('Error fetching movements for balance:', movError);
      throw movError;
    }

    let saldoTotal = 0;

    // 3. Sum up based on currency filter
    movimientos.forEach(m => {
      // Determine movement amount based on selected view currency
      // If filtering by specific currency (e.g. USD), we only sum USD amounts
      // If filtering by ARS, sum ARS amounts
      // If 'TODAS', it's tricky, but usually means sum of base currency equivalents. 
      // For now, we follow the requested pattern:
      
      const monto = moneda === 'USD' ? (m.monto_usd || 0) : (m.monto_ars || 0);
      
      // Add or Subtract based on type
      if (['INGRESO', 'COBRO', 'DEVOLUCION'].includes(m.tipo)) {
        saldoTotal += monto;
      } else {
        saldoTotal -= monto;
      }
    });

    return saldoTotal;
  },

  /**
   * New: Get Top and Bottom Projects by Benefit
   */
  async getTopBottomObras(periodo, year, month, moneda) {
    const { startDate, endDate } = this.getDateRange(periodo, year, month);

    const { data, error } = await supabase
      .from('inversiones')
      .select(`
        tipo, monto_ars, monto_usd, proyecto_id,
        projects:proyecto_id (name)
      `)
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .eq('estado', 'CONFIRMADO')
      .not('proyecto_id', 'is', null);

    if (error) throw error;

    const projectMap = {};

    data.forEach(d => {
      const pid = d.proyecto_id;
      const pname = d.projects?.name || 'Desconocido';
      const monto = moneda === 'USD' ? (d.monto_usd || 0) : (d.monto_ars || 0);

      if (!projectMap[pid]) {
        projectMap[pid] = { id: pid, name: pname, ingresos: 0, egresos: 0, beneficio: 0 };
      }

      if (['INGRESO', 'COBRO'].includes(d.tipo)) {
        projectMap[pid].ingresos += monto;
      } else {
        projectMap[pid].egresos += monto;
      }
    });

    // Calculate benefits and margins
    const results = Object.values(projectMap).map(p => {
      p.beneficio = p.ingresos - p.egresos;
      p.margen = p.ingresos > 0 ? (p.beneficio / p.ingresos) * 100 : 0;
      return p;
    });

    // Sort by benefit
    return results.sort((a, b) => b.beneficio - a.beneficio);
  }
};
