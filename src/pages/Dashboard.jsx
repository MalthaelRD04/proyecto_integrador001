import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Briefcase, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatMoney } from '../data/store';

// Custom Hooks & Components
import { useDashboard } from '../hooks/useDashboard';
import StatCard from '../components/dashboard/StatCard';
import LowStockList from '../components/dashboard/LowStockList';
import ActiveJobsList from '../components/dashboard/ActiveJobsList';

export default function Dashboard() {
    const { stats, clientesMap, loading, triggerRefresh } = useDashboard();
    const [lastRefresh, setLastRefresh] = useState(new Date());

    if (loading) return <div style={{ padding: 'var(--space-8)' }}>Cargando Dashboard...</div>;
    if (!stats) return null;

    const handleRefresh = () => {
        triggerRefresh();
        setLastRefresh(new Date());
    };

    return (
        <div className="flex-col gap-md">
            <div className="flex-between mb-space-4">
                <div>
                    <h1 className="text-xl font-bold">Panel de Control</h1>
                    <p className="text-muted text-sm">Resumen general de la operación de JRJ</p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={handleRefresh}>
                    Actualizar Datos
                </button>
            </div>

            {/* Stat Cards */}
            <div className="stat-grid">
                <StatCard 
                    label="Ventas del Día" 
                    value={`RD$ ${formatMoney(stats.ventasHoy)}`} 
                    icon={DollarSign} 
                    colorClass="blue" 
                />
                <StatCard 
                    label="Trabajos Pendientes" 
                    value={stats.trabajosPendientes} 
                    icon={Briefcase} 
                    colorClass="orange" 
                />
                <StatCard 
                    label="Bajo Stock" 
                    value={stats.productosBajoStock.length} 
                    subtext="productos críticos"
                    icon={AlertTriangle} 
                    colorClass="red" 
                />
                <StatCard 
                    label="Ingresos del Mes" 
                    value={`RD$ ${formatMoney(stats.ingresosMensuales)}`} 
                    icon={TrendingUp} 
                    colorClass="green" 
                />
            </div>

            <div className="dashboard-2col">
                {/* Chart */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Ventas - Últimos 7 Días</span>
                    </div>
                    <div className="card-body" style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.ventasPorDia}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                                <XAxis dataKey="dia" fontSize={12} tick={{ fill: '#64748b' }} />
                                <YAxis fontSize={12} tick={{ fill: '#64748b' }} tickFormatter={v => `$${v}`} />
                                <Tooltip
                                    formatter={(value) => [`RD$ ${formatMoney(value)}`, 'Ventas']}
                                    contentStyle={{
                                        background: 'white',
                                        border: '1px solid rgba(0,0,0,0.08)',
                                        borderRadius: 8,
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.06)',
                                    }}
                                />
                                <Bar dataKey="total" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Low Stock List - Componentized */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Productos con Bajo Stock</span>
                        <Link to="/items" className="btn btn-sm btn-ghost">
                            Ver todos <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <LowStockList products={stats.productosBajoStock} />
                    </div>
                </div>
            </div>

            {/* Active Jobs List - Componentized */}
            <div className="card" style={{ marginTop: 'var(--space-4)' }}>
                <div className="card-header">
                    <span className="card-title">Trabajos Activos</span>
                    <Link to="/trabajos" className="btn btn-sm btn-ghost">
                        Ver todos <ArrowRight size={14} />
                    </Link>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    <ActiveJobsList jobs={stats.ultimosTrabajos} clientsMap={clientesMap} />
                </div>
            </div>
            
            <div className="text-center text-muted" style={{ fontSize: '10px', marginTop: 'var(--space-8)' }}>
                Última actualización: {lastRefresh.toLocaleTimeString()}
            </div>
        </div>
    );
}
