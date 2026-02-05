import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Wallet, CreditCard, Banknote, Edit2, TrendingUp, TrendingDown,
    AlertTriangle, Activity, Plus, Loader2, ArrowUpDown
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/ThemeProvider';
import { cuentaService } from '@/services/cuentaService';
import { investmentService } from '@/services/investmentService';
import { movimientoService } from '@/services/movimientoService';
import usePageTitle from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/Button';
import { formatCurrencyARS, formatCurrencyUSD } from '@/lib/formatUtils';
import { formatDate } from '@/lib/dateUtils';
import CuentaModal from '@/components/cuentas/CuentaModal';
import KpiCard from '@/components/ui/KpiCard';
import TablePaginationBar from '@/components/common/TablePaginationBar';
import { cn } from '@/lib/utils';

const CuentaDetallePage = () => {
    const { cuenta_id } = useParams();
    const navigate = useNavigate();
    const { t } = useTheme();
    const { toast } = useToast();
    usePageTitle('Detalle de Cuenta');

    // -- State --
    const [cuenta, setCuenta] = useState(null);
    const [kpis, setKpis] = useState({ totalIngresado: 0, totalGastos: 0, mayorGasto: 0, cantMovimientos: 0 });
    const [loading, setLoading] = useState(true);
    const [movements, setMovements] = useState([]);
    const [movementsLoading, setMovementsLoading] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // -- Pagination & Sort State --
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

    const handleEdit = (movimientoId) => {
        // Redirigimos a la página de NewMovement pasando el ID para activar el modo EDICIÓN
        navigate(`/movements/new?id=${movimientoId}`);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [cuentaData, kpisData] = await Promise.all([
                cuentaService.getCuentaById(cuenta_id),
                investmentService.getAccountKPIs(cuenta_id)
            ]);
            if (!cuentaData) throw new Error('Cuenta not found');
            setCuenta(cuentaData);
            setKpis(kpisData);
            loadMovements();
        } catch (error) {
            toast({ variant: 'destructive', title: t('common.error'), description: t('cuentas.notFound') });
            navigate('/cuentas');
        } finally {
            setLoading(false);
        }
    };

    const loadMovements = async () => {
        try {
            setMovementsLoading(true);
            const data = await movimientoService.getAccountMovements(cuenta_id);
            setMovements(data || []);
        } catch (error) {
            toast({ variant: 'destructive', title: t('common.error'), description: t('finanzas.errorLoadingMovements') });
        } finally {
            setMovementsLoading(false);
        }
    };

    useEffect(() => { if (cuenta_id) fetchData(); }, [cuenta_id]);

    // -- Sorting & Pagination Logic --
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const processedMovements = useMemo(() => {
        let result = [...movements];
        // Sort
        result.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return result;
    }, [movements, sortConfig]);

    const paginatedMovements = useMemo(() => {
        const start = (page - 1) * pageSize;
        return processedMovements.slice(start, start + pageSize);
    }, [processedMovements, page, pageSize]);

    // -- Helpers --
    const getIcon = (tipo) => {
        switch (tipo?.toLowerCase()) {
            case 'banco': return CreditCard;
            case 'efectivo': return Banknote;
            default: return Wallet;
        }
    };

    const getBadgeStyle = (type, tipoMovimiento) => {
        const tm = tipoMovimiento || type;
        if (tm === 'INVERSION') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200';
        if (tm === 'DEVOLUCION') return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200';
        if (tm === 'INGRESO') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200';
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200';
    };

    if (loading && !cuenta) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div>;

    const Icon = getIcon(cuenta?.tipo);

    return (
        <>
            <div className="min-h-screen p-6 md:p-8 bg-slate-50/50 dark:bg-[#111827] transition-colors duration-200">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-8">

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" onClick={() => navigate('/cuentas')} className="rounded-full h-10 w-10 p-0 hover:bg-white dark:hover:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-blue-600">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{cuenta?.titulo}</h1>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{cuenta?.tipo}</span>
                                        <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border",
                                            cuenta?.estado === 'activa' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700')}>
                                            {cuenta?.estado}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(true)} className="rounded-full gap-2 border-slate-200 dark:border-slate-700">
                            <Edit2 className="w-4 h-4" /> {t('common.edit')}
                        </Button>
                    </div>

                    {/* KPIs Unificados con el estilo de la App */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard title={t('finanzas.totalIngresado')} value={formatCurrencyARS(kpis.totalIngresado)} icon={TrendingUp} tone="emerald" showBar />
                        <KpiCard title={t('finanzas.totalGastos')} value={formatCurrencyARS(kpis.totalGastos)} icon={TrendingDown} tone="red" showBar />
                        <KpiCard title={t('finanzas.mayorGasto')} value={formatCurrencyARS(kpis.mayorGasto)} icon={AlertTriangle} tone="amber" showBar />
                        <KpiCard title={t('finanzas.cantMovimientos')} value={kpis.cantMovimientos.toString()} icon={Activity} tone="blue" />
                    </div>

                    {/* Movements Table Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-600" /> {t('cuentas.movimientos')}
                            </h2>
                            <Button onClick={() => navigate(`/movements/new?cuenta_id=${cuenta_id}`)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 shadow-lg shadow-blue-500/20">
                                <Plus className="w-4 h-4 mr-2" /> {t('movimientos.new_movimiento')}
                            </Button>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead className="bg-slate-50/50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <SortableHeader label={t('common.type')} sortKey="type" current={sortConfig} onSort={handleSort} />
                                            <th className="px-4 py-4 font-semibold text-slate-500 uppercase text-[11px]">{t('common.description')}</th>
                                            <SortableHeader label={t('common.date')} sortKey="date" current={sortConfig} onSort={handleSort} />
                                            <SortableHeader label={t('finanzas.montoARS')} sortKey="amount_ars" current={sortConfig} onSort={handleSort} align="right" />
                                            <th className="px-4 py-4 font-semibold text-slate-500 uppercase text-[11px] text-right">{t('finanzas.montoUSD')}</th>
                                            <th className="px-4 py-4 font-semibold text-slate-500 uppercase text-[11px] text-center">{t('common.status')}</th>
                                            <th className="px-4 py-3 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {movementsLoading ? (
                                            <tr><td colSpan="6" className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-slate-300" /></td></tr>
                                        ) : paginatedMovements.length === 0 ? (
                                            <tr><td colSpan="6" className="py-20 text-center text-slate-500">{t('finanzas.noMovimientos')}</td></tr>
                                        ) : (
                                            paginatedMovements.map((mov) => (
                                                <tr key={mov.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-4 py-4">
                                                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase border", getBadgeStyle(mov.type, mov.tipo_movimiento))}>
                                                            {mov.tipo_movimiento || mov.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 font-medium text-slate-700 dark:text-slate-200 max-w-[200px] truncate">{mov.description}</td>
                                                    <td className="px-4 py-4 text-slate-500 font-mono text-xs">{formatDate(mov.date)}</td>
                                                    <td className="px-4 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                        {formatCurrencyARS(mov.amount_ars || mov.amount)}
                                                    </td>
                                                    <td className="px-4 py-4 text-right font-mono text-slate-600 dark:text-slate-400">
                                                        {formatCurrencyUSD(mov.usd_amount)}
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <StatusBadge status={mov.status} />
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <Button
                                                            variant="primary"
                                                            size="iconSm"
                                                            onClick={() => handleEdit(mov.id)}
                                                            className="opacity-70 group-hover:opacity-100 transition-opacity rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <TablePaginationBar
                                page={page}
                                pageSize={pageSize}
                                totalItems={processedMovements.length}
                                onPageChange={setPage}
                                onPageSizeChange={(val) => { setPageSize(val); setPage(1); }}
                                labels={{ showing: 'Mostrando', of: 'de', rowsPerPage: 'Filas:' }}
                            />
                        </div>
                    </div>
                </motion.div>
            </div>

            <CuentaModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSuccess={fetchData} cuenta={cuenta} />
        </>
    );
};

// --- Sub-componentes para Limpieza ---

const SortableHeader = ({ label, sortKey, current, onSort, align = 'left' }) => (
    <th
        className={cn(
            "px-4 py-4 font-semibold text-slate-500 uppercase text-[11px] cursor-pointer hover:text-blue-600 transition-colors group",
            align === 'right' && 'text-right'
        )}
        onClick={() => onSort(sortKey)}
    >
        <div className={cn("flex items-center gap-1", align === 'right' && 'justify-end')}>
            {label}
            <ArrowUpDown className={cn("w-3 h-3 transition-opacity", current.key === sortKey ? "opacity-100 text-blue-600" : "opacity-0 group-hover:opacity-50")} />
        </div>
    </th>
);

const StatusBadge = ({ status }) => {
    const isOk = ['CONFIRMADO', 'PAGADO', 'COBRADO', 'approved'].includes(status?.toLowerCase()) || ['CONFIRMADO', 'PAGADO', 'COBRADO'].includes(status);
    return (
        <span className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
            isOk ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
        )}>
            {status || 'PENDIENTE'}
        </span>
    );
};

export default CuentaDetallePage;