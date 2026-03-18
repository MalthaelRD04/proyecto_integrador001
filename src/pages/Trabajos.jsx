import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAll, crearTrabajo, update, getById, formatMoney, formatDate } from '../data/store';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import { Plus, Search, Eye, Briefcase } from 'lucide-react';

export default function Trabajos() {
    const { user } = useAuth();
    const [data, setData] = useState([]);
    const [search, setSearch] = useState('');
    const [filterEstado, setFilterEstado] = useState('all');
    const [modal, setModal] = useState(false);
    const [clientes, setClientes] = useState([]);
    const [form, setForm] = useState({
        cliente_id: '', descripcion: '', precio_total: '',
        tiene_descuento: false, monto_descuento: '', fecha_entrega_estimada: '', nota: ''
    });

    const reload = () => { setData(getAll('trabajos').reverse()); setClientes(getAll('clientes')); };
    useEffect(reload, []);

    const filtered = data.filter(t => {
        const cliente = getById('clientes', t.cliente_id);
        const matchSearch = t.descripcion.toLowerCase().includes(search.toLowerCase()) ||
            (cliente?.nombre || '').toLowerCase().includes(search.toLowerCase());
        const matchEstado = filterEstado === 'all' || t.estado === filterEstado;
        return matchSearch && matchEstado;
    });

    const estadoBadge = (estado) => {
        const map = {
            pendiente: 'badge-amber',
            en_proceso: 'badge-blue',
            entregado: 'badge-green',
            cancelado: 'badge-red',
        };
        return map[estado] || 'badge-slate';
    };

    const estadoLabel = (estado) => {
        const map = { pendiente: 'Pendiente', en_proceso: 'En Proceso', entregado: 'Entregado', cancelado: 'Cancelado' };
        return map[estado] || estado;
    };

    const handleSave = () => {
        if (!form.cliente_id || !form.descripcion || !form.precio_total) return;
        crearTrabajo({
            cliente_id: Number(form.cliente_id),
            usuario_id: user.id,
            descripcion: form.descripcion,
            precio_total: Number(form.precio_total),
            tiene_descuento: form.tiene_descuento,
            monto_descuento: form.tiene_descuento ? Number(form.monto_descuento) || 0 : 0,
            fecha_entrega_estimada: form.fecha_entrega_estimada || null,
            nota: form.nota,
        });
        setModal(false);
        setForm({ cliente_id: '', descripcion: '', precio_total: '', tiene_descuento: false, monto_descuento: '', fecha_entrega_estimada: '', nota: '' });
        reload();
    };

    return (
        <div>
            <div className="toolbar">
                <div className="toolbar-left">
                    <div className="search-input-wrapper">
                        <Search size={16} />
                        <input type="text" className="form-input" placeholder="Buscar trabajos..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className="form-select" style={{ width: 160 }} value={filterEstado} onChange={e => setFilterEstado(e.target.value)}>
                        <option value="all">Todos los estados</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="en_proceso">En Proceso</option>
                        <option value="entregado">Entregado</option>
                        <option value="cancelado">Cancelado</option>
                    </select>
                </div>
                <button className="btn btn-primary" onClick={() => setModal(true)}>
                    <Plus size={16} /> Nuevo Trabajo
                </button>
            </div>

            <div className="card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Descripción</th>
                                <th>Estado</th>
                                <th className="text-right">Total</th>
                                <th className="text-right">Abonado</th>
                                <th className="text-right">Saldo</th>
                                <th>Entrega Est.</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(t => {
                                const cliente = getById('clientes', t.cliente_id);
                                return (
                                    <tr key={t.id}>
                                        <td className="font-bold">{cliente?.nombre || '—'}</td>
                                        <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {t.descripcion}
                                        </td>
                                        <td><span className={`badge ${estadoBadge(t.estado)}`}>{estadoLabel(t.estado)}</span></td>
                                        <td className="text-right font-mono">RD$ {formatMoney(t.precio_total)}</td>
                                        <td className="text-right font-mono">{formatMoney(t.total_abonado)}</td>
                                        <td className="text-right font-mono font-bold" style={{ color: t.saldo_pendiente > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                                            RD$ {formatMoney(t.saldo_pendiente)}
                                        </td>
                                        <td className="text-muted">{formatDate(t.fecha_entrega_estimada)}</td>
                                        <td>
                                            <Link to={`/trabajos/${t.id}`} className="btn btn-sm btn-ghost">
                                                <Eye size={14} /> Ver
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr><td colSpan={8} className="text-center text-muted" style={{ padding: 'var(--space-8)' }}>
                                    <Briefcase size={24} style={{ opacity: 0.3, marginBottom: 8 }} /><br />No se encontraron trabajos
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal && (
                <Modal
                    title="Nuevo Trabajo"
                    onClose={() => setModal(false)}
                    size="lg"
                    footer={<><button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSave}>Guardar Trabajo</button></>}
                >
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Cliente *</label>
                            <select className="form-select" value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })}>
                                <option value="">Seleccionar cliente</option>
                                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Fecha Entrega Estimada</label>
                            <input type="date" className="form-input" value={form.fecha_entrega_estimada} onChange={e => setForm({ ...form, fecha_entrega_estimada: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Descripción del Trabajo *</label>
                        <textarea className="form-textarea" rows={3} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Detalle del trabajo a realizar..." />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Precio Total (RD$) *</label>
                            <input type="number" step="0.01" className="form-input" value={form.precio_total} onChange={e => setForm({ ...form, precio_total: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input type="checkbox" checked={form.tiene_descuento} onChange={e => setForm({ ...form, tiene_descuento: e.target.checked })} />
                                Aplicar Descuento
                            </label>
                            {form.tiene_descuento && (
                                <input type="number" step="0.01" className="form-input" style={{ marginTop: 8 }} value={form.monto_descuento} onChange={e => setForm({ ...form, monto_descuento: e.target.value })} placeholder="Monto del descuento" />
                            )}
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Notas</label>
                        <textarea className="form-textarea" value={form.nota} onChange={e => setForm({ ...form, nota: e.target.value })} placeholder="Observaciones adicionales..." />
                    </div>
                    {form.precio_total && (
                        <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--blue-50)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
                            <strong>Saldo a cobrar: </strong>
                            RD$ {formatMoney(Number(form.precio_total) - (form.tiene_descuento ? Number(form.monto_descuento) || 0 : 0))}
                        </div>
                    )}
                </Modal>
            )}
        </div>
    );
}
