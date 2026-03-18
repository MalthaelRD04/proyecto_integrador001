import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, formatMoney, getAll, getById } from '../data/store';
import { DollarSign, Briefcase, AlertTriangle, TrendingUp, Package, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        setStats(getDashboardStats());
    }, []);

    if (!stats) return null;

    return (
        <div>
            {/* Stat Cards */}
            <div className="stat-grid">
                <div className="stat-card">
                    <div className="stat-icon blue"><DollarSign size={22} /></div>
                    <div className="stat-info">
                        <div className="stat-label">Ventas del Día</div>
                        <div className="stat-value">RD$ {formatMoney(stats.ventasHoy)}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon orange"><Briefcase size={22} /></div>
                    <div className="stat-info">
                        <div className="stat-label">Trabajos Pendientes</div>
                        <div className="stat-value">{stats.trabajosPendientes}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon red"><AlertTriangle size={22} /></div>
                    <div className="stat-info">
                        <div className="stat-label">Bajo Stock</div>
                        <div className="stat-value">{stats.productosBajoStock.length}</div>
                        <div className="stat-sub">productos por debajo del mínimo</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon green"><TrendingUp size={22} /></div>
                    <div className="stat-info">
                        <div className="stat-label">Ingresos del Mes</div>
                        <div className="stat-value">RD$ {formatMoney(stats.ingresosMensuales)}</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
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
                                <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Productos bajo stock */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Productos con Bajo Stock</span>
                        <Link to="/items" className="btn btn-sm btn-ghost">
                            Ver todos <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {stats.productosBajoStock.length === 0 ? (
                            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                                <Package size={32} />
                                <p>Todos los productos tienen stock suficiente</p>
                            </div>
                        ) : (
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th className="text-right">Stock</th>
                                            <th className="text-right">Mínimo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.productosBajoStock.map(p => (
                                            <tr key={p.id}>
                                                <td>{p.nombre}</td>
                                                <td className="text-right">
                                                    <span className={`badge ${p.stock === 0 ? 'badge-red' : 'badge-orange'}`}>
                                                        {p.stock}
                                                    </span>
                                                </td>
                                                <td className="text-right text-muted">{p.stock_minimo}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Últimos trabajos */}
            <div className="card" style={{ marginTop: 'var(--space-4)' }}>
                <div className="card-header">
                    <span className="card-title">Trabajos Activos</span>
                    <Link to="/trabajos" className="btn btn-sm btn-ghost">
                        Ver todos <ArrowRight size={14} />
                    </Link>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {stats.ultimosTrabajos.length === 0 ? (
                        <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                            <Briefcase size={32} />
                            <p>No hay trabajos activos</p>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Cliente</th>
                                        <th>Descripción</th>
                                        <th>Estado</th>
                                        <th className="text-right">Saldo</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.ultimosTrabajos.map(t => {
                                        const cliente = getById('clientes', t.cliente_id);
                                        return (
                                            <tr key={t.id}>
                                                <td className="font-bold">{cliente?.nombre || '—'}</td>
                                                <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {t.descripcion}
                                                </td>
                                                <td>
                                                    <span className={`badge ${t.estado === 'pendiente' ? 'badge-amber' : t.estado === 'en_proceso' ? 'badge-blue' : 'badge-green'}`}>
                                                        {t.estado === 'en_proceso' ? 'En Proceso' : t.estado.charAt(0).toUpperCase() + t.estado.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="text-right font-mono">RD$ {formatMoney(t.saldo_pendiente)}</td>
                                                <td>
                                                    <Link to={`/trabajos/${t.id}`} className="btn btn-sm btn-ghost">
                                                        <ArrowRight size={14} />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
