import { useState, useEffect } from 'react';
import { getAll, getById, formatMoney, formatDate } from '../data/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Calendar, DollarSign, Package, Briefcase } from 'lucide-react';

export default function Reportes() {
    const [tab, setTab] = useState('ventas');
    const [fechaDesde, setFechaDesde] = useState(() => {
        const d = new Date(); d.setMonth(d.getMonth() - 1);
        return d.toISOString().split('T')[0];
    });
    const [fechaHasta, setFechaHasta] = useState(() => new Date().toISOString().split('T')[0]);

    const [facturas, setFacturas] = useState([]);
    const [items, setItems] = useState([]);
    const [trabajos, setTrabajos] = useState([]);
    const [categoriasMap, setCategoriasMap] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            setFacturas(await getAll('facturas'));
            setItems(await getAll('items'));
            setTrabajos(await getAll('trabajos'));

            const cats = await getAll('categorias');
            const cMap = {};
            for (const c of cats) cMap[c.id] = c;
            setCategoriasMap(cMap);

            setLoading(false);
        }
        load();
    }, []);

    // Ventas filtradas
    const ventasFiltradas = facturas.filter(f => {
        const fecha = f.fecha.split('T')[0];
        return fecha >= fechaDesde && fecha <= fechaHasta && f.estado !== 'anulada';
    });

    const totalVentas = ventasFiltradas.reduce((sum, f) => sum + Number(f.total), 0);
    const totalFacturas = ventasFiltradas.length;

    // Ventas por día para gráfico
    const ventasPorDia = {};
    ventasFiltradas.forEach(f => {
        const dia = f.fecha.split('T')[0];
        ventasPorDia[dia] = (ventasPorDia[dia] || 0) + Number(f.total);
    });
    const chartVentas = Object.entries(ventasPorDia).map(([dia, total]) => ({
        dia: new Date(dia).toLocaleDateString('es-DO', { month: 'short', day: 'numeric' }),
        total,
    }));

    // Stock bajo
    const productosBajoStock = items.filter(i => i.es_producto && i.activo && i.stock <= i.stock_minimo)
        .sort((a, b) => a.stock - b.stock);

    // Trabajos por estado
    const trabajosPorEstado = [
        { name: 'Pendiente', value: trabajos.filter(t => t.estado === 'pendiente').length, color: '#f59e0b' },
        { name: 'En Proceso', value: trabajos.filter(t => t.estado === 'en_proceso').length, color: '#3b82f6' },
        { name: 'Entregado', value: trabajos.filter(t => t.estado === 'entregado').length, color: '#22c55e' },
        { name: 'Cancelado', value: trabajos.filter(t => t.estado === 'cancelado').length, color: '#ef4444' },
    ].filter(t => t.value > 0);

    const totalTrabajosActivos = trabajos.filter(t => t.estado === 'pendiente' || t.estado === 'en_proceso').length;
    const totalSaldoPendiente = trabajos.reduce((sum, t) => sum + Number(t.saldo_pendiente), 0);

    const tabStyle = (active) => ({
        padding: 'var(--space-2) var(--space-4)',
        background: active ? 'var(--color-primary)' : 'transparent',
        color: active ? 'white' : 'var(--text-secondary)',
        border: active ? 'none' : '1px solid var(--border-input)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        fontSize: 'var(--text-sm)',
        fontWeight: 500,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        transition: 'all var(--transition-fast)',
    });

    if (loading) return <div style={{ padding: 'var(--space-8)' }}>Cargando reportes...</div>;

    return (
        <div>
            <div className="flex gap-2" style={{ marginBottom: 'var(--space-4)' }}>
                <button style={tabStyle(tab === 'ventas')} onClick={() => setTab('ventas')}>
                    <DollarSign size={14} /> Ventas
                </button>
                <button style={tabStyle(tab === 'stock')} onClick={() => setTab('stock')}>
                    <Package size={14} /> Bajo Stock
                </button>
                <button style={tabStyle(tab === 'trabajos')} onClick={() => setTab('trabajos')}>
                    <Briefcase size={14} /> Trabajos
                </button>
            </div>

            {tab === 'ventas' && (
                <div>
                    {/* Date Filter */}
                    <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                        <div className="card-body">
                            <div className="flex items-center gap-3">
                                <Calendar size={16} className="text-muted" />
                                <span className="form-label" style={{ margin: 0 }}>Desde:</span>
                                <input type="date" className="form-input" style={{ width: 160 }} value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
                                <span className="form-label" style={{ margin: 0 }}>Hasta:</span>
                                <input type="date" className="form-input" style={{ width: 160 }} value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="stat-grid">
                        <div className="stat-card">
                            <div className="stat-icon blue"><DollarSign size={22} /></div>
                            <div className="stat-info">
                                <div className="stat-label">Total Vendido</div>
                                <div className="stat-value">RD$ {formatMoney(totalVentas)}</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon green"><Calendar size={22} /></div>
                            <div className="stat-info">
                                <div className="stat-label">Facturas</div>
                                <div className="stat-value">{totalFacturas}</div>
                            </div>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="card">
                        <div className="card-header"><span className="card-title">Ventas por Día</span></div>
                        <div className="card-body" style={{ height: 320 }}>
                            {chartVentas.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartVentas}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                                        <XAxis dataKey="dia" fontSize={12} tick={{ fill: '#64748b' }} />
                                        <YAxis fontSize={12} tick={{ fill: '#64748b' }} />
                                        <Tooltip formatter={(v) => [`RD$ ${formatMoney(v)}`, 'Ventas']} />
                                        <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="empty-state"><p>No hay ventas en el período seleccionado</p></div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {tab === 'stock' && (
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Productos con Stock Bajo ({productosBajoStock.length})</span>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Categoría</th>
                                    <th className="text-right">Stock Actual</th>
                                    <th className="text-right">Stock Mínimo</th>
                                    <th className="text-right">Precio</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productosBajoStock.map(p => (
                                    <tr key={p.id}>
                                        <td className="font-bold">{p.nombre}</td>
                                        <td className="text-muted">{categoriasMap[p.categoria_id]?.nombre || '—'}</td>
                                        <td className="text-right">
                                            <span className={`badge ${p.stock === 0 ? 'badge-red' : 'badge-orange'}`}>{p.stock}</span>
                                        </td>
                                        <td className="text-right text-muted">{p.stock_minimo}</td>
                                        <td className="text-right font-mono">RD$ {formatMoney(p.precio_venta)}</td>
                                    </tr>
                                ))}
                                {productosBajoStock.length === 0 && (
                                    <tr><td colSpan={5} className="text-center text-muted" style={{ padding: 'var(--space-8)' }}>No hay productos con stock bajo</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === 'trabajos' && (
                <div>
                    <div className="stat-grid">
                        <div className="stat-card">
                            <div className="stat-icon orange"><Briefcase size={22} /></div>
                            <div className="stat-info">
                                <div className="stat-label">Trabajos Activos</div>
                                <div className="stat-value">{totalTrabajosActivos}</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon red"><DollarSign size={22} /></div>
                            <div className="stat-info">
                                <div className="stat-label">Saldo Pendiente Total</div>
                                <div className="stat-value">RD$ {formatMoney(totalSaldoPendiente)}</div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header"><span className="card-title">Trabajos por Estado</span></div>
                        <div className="card-body" style={{ height: 300 }}>
                            {trabajosPorEstado.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={trabajosPorEstado} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                                            {trabajosPorEstado.map((entry, idx) => (
                                                <Cell key={idx} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Legend />
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="empty-state"><p>No hay trabajos registrados</p></div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
