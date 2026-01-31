import { supabase } from '@/lib/customSupabaseClient';

export const analiticaService = {

  /**
    * Helper para construir el rango de fechas corregido
    */
  getDateRange(periodo, year, month) {
    let startDate, endDate;
    if (periodo === 'mes') {
      const y = parseInt(year);
      const m = parseInt(month);
      // Formato YYYY-MM-DD para evitar problemas de zona horaria en el filtro
      startDate = `${y}-${m.toString().padStart(2, '0')}-01`;
      endDate = `${y}-${m.toString().padStart(2, '0')}-31`; // Supabase lte corregirá el fin de mes
    } else {
      startDate = `${year}-01-01`;
      endDate = `${year}-12-31`;
    }
    return { startDate, endDate };
  },

  async getKPIs(periodo, year, month, moneda) {
    const { startDate, endDate } = this.getDateRange(periodo, year, month);

    const { data, error } = await supabase
      .from('inversiones')
      .select('tipo, monto_ars, monto_usd, estado')
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .eq('is_deleted', false);

    if (error) throw error;

    let ingresos = 0;
    let egresos = 0;

    data.forEach(m => {
      // Normalizamos el estado y el tipo (quitamos espacios y pasamos a MAYÚSCULAS)
      const estado = m.estado?.toString().trim().toUpperCase();
      const tipo = m.tipo?.toString().trim().toUpperCase();

      // Debug para ver qué tipos están llegando realmente si sigue en cero
      // console.log(`Registro: Tipo=${tipo}, Estado=${estado}`);

      // Solo procesamos lo confirmado
      if (estado === 'CONFIRMADO' || estado === 'PAGADO' || estado === 'COBRADO' || estado === 'APPROVED') {

        const monto = moneda === 'USD' ? (Number(m.monto_usd) || 0) : (Number(m.monto_ars) || 0);

        // Lista expandida de posibles nombres de tipos
        const esIngreso = ['INGRESO', 'COBRO', 'INVERSION', 'INVERSION_RECIBIDA', 'CAPITAL'].includes(tipo);
        const esGasto = ['GASTO', 'PAGO', 'DEVOLUCION_INVERSION', 'DEVOLUCION', 'EGRESO', 'COMPRA'].includes(tipo);

        if (esIngreso) {
          ingresos += monto;
        } else if (esGasto) {
          egresos += monto;
        }
      }
    });

    return {
      ingresos,
      egresos,
      beneficio: ingresos - egresos,
      saldoTotal: await this.getSaldoTotal(moneda)
    };
  },

  /**
   * 2. Ingresos por Proyecto (Para el Modal de Composición)
   */
  async getIngresosPorProyecto(periodo, year, month, moneda) {
    const { startDate, endDate } = this.getDateRange(periodo, year, month);
    const { data, error } = await supabase
      .from('inversiones')
      .select(`monto_ars, monto_usd, proyecto_id, projects:proyecto_id (name)`)
      .in('tipo', ['INGRESO', 'COBRO', 'INVERSION'])
      .eq('estado', 'CONFIRMADO')
      .eq('is_deleted', false)
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .not('proyecto_id', 'is', null);

    if (error) throw error;

    const agrupado = {};
    let total = 0;
    data.forEach(d => {
      const monto = moneda === 'USD' ? (d.monto_usd || 0) : (d.monto_ars || 0);
      const nombre = d.projects?.name || 'Sin Nombre';
      agrupado[nombre] = (agrupado[nombre] || 0) + monto;
      total += monto;
    });

    const datos = Object.entries(agrupado)
      .map(([nombre, monto]) => ({ nombre, monto }))
      .sort((a, b) => b.monto - a.monto);

    return { datos, total };
  },

  /**
   * 3. Egresos por Proyecto (Para el Modal de Composición)
   */
  async getEgresosPorProyecto(periodo, year, month, moneda) {
    const { startDate, endDate } = this.getDateRange(periodo, year, month);
    const { data, error } = await supabase
      .from('inversiones')
      .select(`monto_ars, monto_usd, proyecto_id, projects:proyecto_id (name)`)
      .in('tipo', ['GASTO', 'PAGO', 'DEVOLUCION_INVERSION', 'DEVOLUCION'])
      .eq('estado', 'CONFIRMADO')
      .eq('is_deleted', false)
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .not('proyecto_id', 'is', null);

    if (error) throw error;

    const agrupado = {};
    let total = 0;
    data.forEach(d => {
      const monto = moneda === 'USD' ? (d.monto_usd || 0) : (d.monto_ars || 0);
      const nombre = d.projects?.name || 'Sin Nombre';
      agrupado[nombre] = (agrupado[nombre] || 0) + monto;
      total += monto;
    });

    const datos = Object.entries(agrupado)
      .map(([nombre, monto]) => ({ nombre, monto }))
      .sort((a, b) => b.monto - a.monto);

    return { datos, total };
  },

  /**
   * 4. Ingresos vs Egresos (Chart Data) - CORREGIDA
   */
  async getIngresosVsEgresos(periodo, year, month, moneda) {
    const { startDate, endDate } = this.getDateRange(periodo, year, month);
    const { data, error } = await supabase
      .from('inversiones')
      .select('fecha, tipo, monto_ars, monto_usd')
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .eq('estado', 'CONFIRMADO')
      .eq('is_deleted', false)
      .order('fecha');

    if (error) throw error;

    const grouped = {};
    data.forEach(d => {
      const dateObj = new Date(d.fecha);
      const key = periodo === 'anio' ? dateObj.getMonth() : dateObj.getDate();
      const label = periodo === 'anio'
        ? dateObj.toLocaleString('es-ES', { month: 'short' })
        : `${key}/${dateObj.getMonth() + 1}`;

      if (!grouped[key]) {
        grouped[key] = { name: label, ingresos: 0, egresos: 0, order: key };
      }

      const monto = moneda === 'USD' ? (d.monto_usd || 0) : (d.monto_ars || 0);
      if (['INGRESO', 'COBRO', 'INVERSION'].includes(d.tipo)) {
        grouped[key].ingresos += monto;
      } else {
        grouped[key].egresos += monto;
      }
    });

    return Object.values(grouped).sort((a, b) => a.order - b.order);
  },

  /**
   * 5. Top Bottom Obras (Ranking)
   */
  async getTopBottomObras(periodo, year, month, moneda) {
    const { startDate, endDate } = this.getDateRange(periodo, year, month);
    const { data, error } = await supabase
      .from('inversiones')
      .select(`tipo, monto_ars, monto_usd, proyecto_id, projects:proyecto_id (name)`)
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .eq('estado', 'CONFIRMADO')
      .eq('is_deleted', false)
      .not('proyecto_id', 'is', null);

    if (error) throw error;

    const projectMap = {};
    data.forEach(d => {
      const pid = d.proyecto_id;
      const monto = moneda === 'USD' ? (d.monto_usd || 0) : (d.monto_ars || 0);
      if (!projectMap[pid]) {
        projectMap[pid] = { id: pid, name: d.projects?.name || 'Desconocido', ingresos: 0, egresos: 0 };
      }
      if (['INGRESO', 'COBRO', 'INVERSION'].includes(d.tipo)) {
        projectMap[pid].ingresos += monto;
      } else {
        projectMap[pid].egresos += monto;
      }
    });

    return Object.values(projectMap).map(p => ({
      ...p,
      beneficio: p.ingresos - p.egresos,
      margen: p.ingresos > 0 ? ((p.ingresos - p.egresos) / p.ingresos) * 100 : -100
    })).sort((a, b) => b.beneficio - a.beneficio);
  },

  /**
   * 6. Top Proveedores - CORREGIDA
   */
  async getTopProveedores(periodo, year, month, moneda) {
    const { startDate, endDate } = this.getDateRange(periodo, year, month);
    const { data, error } = await supabase
      .from('inversiones')
      .select(`monto_ars, monto_usd, proveedor_id, providers:proveedor_id (name)`)
      .in('tipo', ['GASTO', 'PAGO'])
      .eq('estado', 'CONFIRMADO')
      .eq('is_deleted', false)
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .not('proveedor_id', 'is', null);

    if (error) throw error;

    const agrupado = {};
    data.forEach(d => {
      const monto = moneda === 'USD' ? (d.monto_usd || 0) : (d.monto_ars || 0);
      const nombre = d.providers?.name || 'Sin Nombre';
      if (!agrupado[nombre]) agrupado[nombre] = { nombre, monto: 0, cantidad: 0 };
      agrupado[nombre].monto += monto;
      agrupado[nombre].cantidad += 1;
    });

    return Object.values(agrupado).sort((a, b) => b.monto - a.monto).slice(0, 5);
  },

  /**
   * 7. Top Clientes - CORREGIDA
   */
  async getTopClientes(periodo, year, month, moneda) {
    const { startDate, endDate } = this.getDateRange(periodo, year, month);
    const { data, error } = await supabase
      .from('inversiones')
      .select(`proyecto_id, monto_ars, monto_usd, tipo`)
      .in('tipo', ['INGRESO', 'COBRO', 'INVERSION'])
      .eq('estado', 'CONFIRMADO')
      .eq('is_deleted', false)
      .gte('fecha', startDate)
      .lte('fecha', endDate);

    if (error) throw error;
    if (!data.length) return [];

    // Necesitamos saber de quién es cada proyecto
    const projectIds = [...new Set(data.map(d => d.proyecto_id))];
    const { data: projectsData } = await supabase
      .from('projects')
      .select('id, clients:client_id(name)')
      .in('id', projectIds);

    const clientMap = {};
    projectsData?.forEach(p => {
      clientMap[p.id] = p.clients?.name || 'Sin Cliente';
    });

    const agrupado = {};
    data.forEach(d => {
      const clientName = clientMap[d.proyecto_id];
      if (!clientName) return;
      const monto = moneda === 'USD' ? (d.monto_usd || 0) : (d.monto_ars || 0);
      if (!agrupado[clientName]) agrupado[clientName] = { nombre: clientName, beneficio: 0, proyectos: new Set() };
      agrupado[clientName].beneficio += monto;
      agrupado[clientName].proyectos.add(d.proyecto_id);
    });

    return Object.values(agrupado).map(c => ({
      nombre: c.nombre,
      beneficio: c.beneficio,
      nroProyectos: c.proyectos.size
    })).sort((a, b) => b.beneficio - a.beneficio).slice(0, 5);
  },

  async getSaldoTotal(moneda) {
    const { data, error } = await supabase
      .from('inversiones')
      .select('tipo, monto_ars, monto_usd, estado')
      .eq('is_deleted', false);

    if (error) throw error;

    return data.reduce((acc, m) => {
      const estado = m.estado?.toString().trim().toUpperCase();
      const tipo = m.tipo?.toString().trim().toUpperCase();

      // Solo saldo de lo que ya pasó realmente
      if (estado === 'CONFIRMADO' || estado === 'PAGADO' || estado === 'COBRADO' || estado === 'APPROVED') {
        const monto = moneda === 'USD' ? (Number(m.monto_usd) || 0) : (Number(m.monto_ars) || 0);

        const esSuma = ['INGRESO', 'COBRO', 'INVERSION', 'INVERSION_RECIBIDA', 'CAPITAL'].includes(tipo);
        const esResta = ['GASTO', 'PAGO', 'DEVOLUCION', 'DEVOLUCION_INVERSION', 'EGRESO', 'COMPRA'].includes(tipo);

        if (esSuma) return acc + monto;
        if (esResta) return acc - monto;
      }
      return acc;
    }, 0);
  }
};