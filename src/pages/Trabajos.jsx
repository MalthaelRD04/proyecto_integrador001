import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAll, crearTrabajo, update, remove, getById, formatMoney, formatDate } from '../data/store';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import { Plus, Search, Eye, Briefcase, Edit2, Trash2, MessageCircle } from 'lucide-react';
import { generarPDFTrabajo } from '../utils/pdfGenerator';

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

    const reload = async () => {
        const tr = await getAll('trabajos');
        setData(tr.reverse());
        setClientes(await getAll('clientes'));
    };
    useEffect(() => { reload(); }, []);

    const filtered = data.filter(t => {
        const cliente = clientes.find(c => c.id === t.cliente_id);
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

    const handleSave = async () => {
        if (!form.cliente_id || !form.descripcion || !form.precio_total) {
            alert('Faltan campos obligatorios: cliente, descripción o precio.');
            return;
        }
        try {
            const nuevoPrecio = Number(form.precio_total);
            const nuevoDescto = form.tiene_descuento ? Number(form.monto_descuento) || 0 : 0;

            const payload = {
                cliente_id: Number(form.cliente_id),
                usuario_id: user.id,
                descripcion: form.descripcion,
                precio_total: nuevoPrecio,
                tiene_descuento: form.tiene_descuento,
                monto_descuento: nuevoDescto,
                fecha_entrega_estimada: form.fecha_entrega_estimada || '',
                nota: form.nota,
            };

            if (form.id) {
                payload.saldo_pendiente = nuevoPrecio - nuevoDescto - (Number(form.total_abonado) || 0);
                if (payload.saldo_pendiente <= 0) {
                    payload.saldo_pendiente = 0;
                    payload.estado = 'entregado';
                    payload.fecha_entrega_real = payload.fecha_entrega_real || new Date().toISOString();
                } else if (form.estado === 'entregado') {
                    payload.estado = 'en_proceso';
                    payload.fecha_entrega_real = '';
                }
                await update('trabajos', form.id, payload);
            } else {
                await crearTrabajo(payload);
            }
            
            setModal(false);
            setForm({ cliente_id: '', descripcion: '', precio_total: '', tiene_descuento: false, monto_descuento: '', fecha_entrega_estimada: '', nota: '' });
            reload();
        } catch (e) {
            console.error('Error guardando trabajo:', e);
            alert('Error guardando el trabajo: ' + (e.message || e));
        }
    };

    const openCreate = () => {
        setForm({ cliente_id: '', descripcion: '', precio_total: '', tiene_descuento: false, monto_descuento: '', fecha_entrega_estimada: '', nota: '' });
        setModal(true);
    };

    const openEdit = (t) => {
        setForm({ ...t, precio_total: t.precio_total, fecha_entrega_estimada: t.fecha_entrega_estimada || '' });
        setModal(true);
    };

    const handleDelete = async (id) => {
        if (confirm('¿Estás seguro de eliminar permanentemente este trabajo y todos sus pagos registrados?')) {
            const allAbonos = await getAll('abonos_trabajo');
            const abonos = allAbonos.filter(a => a.trabajo_id === id);
            for (const a of abonos) {
                await remove('abonos_trabajo', a.id);
            }
            await remove('trabajos', id);
            reload();
        }
    };

    return (
        <div>
            <div className="toolbar flex-between">
                <div className="flex-col gap-md" style={{ flex: 1 }}>
                    <div className="search-input-wrapper" style={{ maxWidth: 400 }}>
                        <Search size={16} />
                        <input type="text" className="form-input" placeholder="Buscar por cliente, descripción..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="flex gap-2" style={{ display: 'flex', flexWrap: 'wrap' }}>
                        <button 
                            className={`btn btn-sm ${filterEstado === 'all' ? 'btn-primary' : 'btn-ghost'}`} 
                            onClick={() => setFilterEstado('all')}
                        >
                            Todos
                        </button>
                        <button 
                            className={`btn btn-sm ${filterEstado === 'pendiente' ? 'btn-primary' : 'btn-ghost'}`} 
                            onClick={() => setFilterEstado('pendiente')}
                        >
                            Pendientes
                        </button>
                        <button 
                            className={`btn btn-sm ${filterEstado === 'en_proceso' ? 'btn-primary' : 'btn-ghost'}`} 
                            onClick={() => setFilterEstado('en_proceso')}
                        >
                            En Proceso
                        </button>
                        <button 
                            className={`btn btn-sm ${filterEstado === 'entregado' ? 'btn-primary' : 'btn-ghost'}`} 
                            onClick={() => setFilterEstado('entregado')}
                        >
                            Entregados
                        </button>
                        <button 
                            className={`btn btn-sm ${filterEstado === 'cancelado' ? 'btn-primary' : 'btn-ghost'}`} 
                            onClick={() => setFilterEstado('cancelado')}
                        >
                            Cancelados
                        </button>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={openCreate}>
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
                                const cliente = clientes.find(c => c.id === t.cliente_id);
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
                                            <div className="flex gap-2" style={{ justifyContent: 'flex-end', display: 'flex' }}>
                                                <button 
                                                    className="btn btn-icon btn-sm btn-ghost text-success" 
                                                    style={{ color: '#25D366' }}
                                                    onClick={async () => {
                                                        const usr = await getById('usuarios', t.usuario_id);
                                                        const allAbonos = await getAll('abonos_trabajo');
                                                        const abonosList = allAbonos.filter(a => a.trabajo_id === t.id);
                                                        generarPDFTrabajo(t, cliente, usr, abonosList, 'download_and_whatsapp');
                                                    }}
                                                    title="WhatsApp con PDF"
                                                >
                                                    <MessageCircle size={14} />
                                                </button>
                                                <button className="btn btn-icon btn-sm btn-ghost" onClick={() => openEdit(t)} title="Editar"><Edit2 size={14} /></button>
                                                {user?.rol === 'admin' && (
                                                    <button className="btn btn-icon btn-sm btn-ghost" onClick={() => handleDelete(t.id)} title="Eliminar"><Trash2 size={14} /></button>
                                                )}
                                                <Link to={`/trabajos/${t.id}`} className="btn btn-sm btn-ghost">
                                                    <Eye size={14} /> Ver
                                                </Link>
                                            </div>
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
                        <div className="saldo-box">
                            <strong>Saldo a cobrar: </strong>
                            RD$ {formatMoney(Number(form.precio_total) - (form.tiene_descuento ? Number(form.monto_descuento) || 0 : 0))}
                        </div>
                    )}
                </Modal>
            )}
        </div>
    );
}
