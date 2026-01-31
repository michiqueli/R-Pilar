import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { formatCurrencyARS, formatCurrencyUSD } from '@/lib/formatUtils';
import { analiticaService } from '@/services/analiticaService';
import PageHeader from '@/components/layout/PageHeader';

// Componentes del módulo
import AnalyticsKPICards from '@/components/analytics/AnalyticsKPICards';
import ComposicionModal from '@/components/analytics/ComposicionModal';
import RankingObras from '@/components/analytics/RankingObras';

const AnalyticsPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  // Estados de Filtros
  const [periodo, setPeriodo] = useState('anio'); // 'mes' | 'anio'
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [moneda, setMoneda] = useState('ARS'); // 'ARS' | 'USD'

  // Estados de Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('ingresos');

  // Estados de Datos
  const [kpis, setKpis] = useState({ ingresos: 0, egresos: 0, beneficio: 0, saldoTotal: 0 });
  const [ingresosProyectos, setIngresosProyectos] = useState({ datos: [], total: 0 });
  const [egresosProyectos, setEgresosProyectos] = useState({ datos: [], total: 0 });
  const [chartData, setChartData] = useState([]);
  const [rankingData, setRankingData] = useState([]);
  const [topProveedores, setTopProveedores] = useState([]);
  const [topClientes, setTopClientes] = useState([]);

  // Carga de datos al cambiar filtros
  useEffect(() => {
    loadData();
  }, [periodo, year, month, moneda]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Ejecutamos todas las consultas al analiticaService corregido
      const [
        kpisData,           // 1. getKPIs
        ingresosP,          // 2. getIngresosPorProyecto
        egresosP,           // 3. getEgresosPorProyecto
        chart,              // 4. getIngresosVsEgresos
        ranking,            // 5. getTopBottomObras
        provs,              // 6. getTopProveedores
        clientes            // 7. getTopClientes
      ] = await Promise.all([
        analiticaService.getKPIs(periodo, year, month, moneda),
        analiticaService.getIngresosPorProyecto(periodo, year, month, moneda),
        analiticaService.getEgresosPorProyecto(periodo, year, month, moneda),
        analiticaService.getIngresosVsEgresos(periodo, year, month, moneda),
        analiticaService.getTopBottomObras(periodo, year, month, moneda),
        analiticaService.getTopProveedores(periodo, year, month, moneda),
        analiticaService.getTopClientes(periodo, year, month, moneda)
      ]);

      // Seteamos los estados con la data real y confirmada
      setKpis(kpisData);
      setIngresosProyectos(ingresosP);
      setEgresosProyectos(egresosP);
      setChartData(chart);
      setRankingData(ranking);
      setTopProveedores(provs);
      setTopClientes(clientes);

    } catch (error) {
      console.error("Error loading analytics:", error);
      toast({
        variant: "destructive",
        title: "Error al cargar datos",
        description: "Hubo un problema al reconstruir el flujo de caja analítico."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenComposition = (tab) => {
    setModalTab(tab);
    setModalOpen(true);
  };

  const formatMoney = (val) => moneda === 'USD' ? formatCurrencyUSD(val) : formatCurrencyARS(val);

  return (
    <div className="min-h-screen p-6 md:p-8 bg-slate-50/50 dark:bg-[#111827] transition-colors duration-200">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-8"
      >

        {/* 1. Header & Filtros Modernos */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <PageHeader
            title="Analítica Financiera"
            description="Monitoreo de rendimiento, flujo de fondos y rentabilidad de proyectos."
          />

          {/* Panel de Control de Filtros */}
          <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
              <button
                onClick={() => setPeriodo('mes')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${periodo === 'mes' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'
                  }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setPeriodo('anio')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${periodo === 'anio' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'
                  }`}
              >
                Anual
              </button>
            </div>

            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-[100px] h-9 text-xs border-none bg-slate-50 dark:bg-slate-800 rounded-xl font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {[0, 1, 2, 3, 4].map(i => {
                  const y = new Date().getFullYear() - i;
                  return <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                })}
              </SelectContent>
            </Select>

            {periodo === 'mes' && (
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-[120px] h-9 text-xs border-none bg-slate-50 dark:bg-slate-800 rounded-xl font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(0, i).toLocaleString('es-ES', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

            <Select value={moneda} onValueChange={setMoneda}>
              <SelectTrigger className="w-[100px] h-9 text-xs font-bold text-blue-600 border-none bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="ARS">🇦🇷 ARS</SelectItem>
                <SelectItem value="USD">🇺🇸 USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 2. KPIs Grid - Pasamos datos al componente que tiene las barritas */}
        <AnalyticsKPICards kpiData={kpis} selectedCurrency={moneda} loading={loading} />

        {/* 3. Gráfico Principal & Ranking */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <Card className="lg:col-span-2 p-6 rounded-[32px] shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg px-2">Ingresos vs Egresos</h3>
              <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-emerald-500 mr-2" /> Ingresos</span>
                <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-rose-500 mr-2" /> Egresos</span>
              </div>
            </div>

            <div className="h-[350px] w-full">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickFormatter={(value) => `${value / 1000}k`}
                    />
                    <RechartsTooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{
                        borderRadius: '16px',
                        border: 'none',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        backgroundColor: '#1e293b',
                        color: '#fff'
                      }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value) => formatMoney(value)}
                    />
                    <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={50} />
                    <Bar dataKey="egresos" name="Egresos" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <div className="lg:col-span-1">
            <RankingObras data={rankingData} loading={loading} moneda={moneda} />
          </div>
        </div>

        {/* 4. Tablas Inferiores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <Card className="rounded-[32px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30">
              <h3 className="font-bold text-slate-900 dark:text-white">Top Proveedores</h3>
              <span className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Gastos por Periodo</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500">
                  <tr>
                    <th className="px-6 py-3 text-left font-bold text-[10px] uppercase">Proveedor</th>
                    <th className="px-6 py-3 text-center font-bold text-[10px] uppercase">Movs</th>
                    <th className="px-6 py-3 text-right font-bold text-[10px] uppercase">Total Pagado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {!loading && topProveedores.map((prov, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">{prov.nombre}</td>
                      <td className="px-6 py-4 text-center text-slate-500 font-mono text-xs">{prov.cantidad}</td>
                      <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">{formatMoney(prov.monto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="rounded-[32px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30">
              <h3 className="font-bold text-slate-900 dark:text-white">Top Clientes</h3>
              <span className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Rentabilidad</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500">
                  <tr>
                    <th className="px-6 py-3 text-left font-bold text-[10px] uppercase">Cliente</th>
                    <th className="px-6 py-3 text-center font-bold text-[10px] uppercase">Obras</th>
                    <th className="px-6 py-3 text-right font-bold text-[10px] uppercase">Beneficio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {!loading && topClientes.map((cli, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">{cli.nombre}</td>
                      <td className="px-6 py-4 text-center text-slate-500 font-mono text-xs">{cli.nroProyectos}</td>
                      <td className={`px-6 py-4 text-right font-black ${cli.beneficio >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatMoney(cli.beneficio)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <ComposicionModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          defaultTab={modalTab}
          dataIngresos={ingresosProyectos}
          dataEgresos={egresosProyectos}
          moneda={moneda}
        />
      </motion.div>
    </div>
  );
};

export default AnalyticsPage;