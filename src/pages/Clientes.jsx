import { useState, useEffect } from 'react';
import { getAll, create, update, remove, formatDate } from '../data/store';
import Modal from '../components/Modal';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';

export default function Clientes() {
    const [data, setData] = useState([]);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({ nombre: '', telefono: '', direccion: '' });

    const reload = async () => setData(await getAll('clientes'));
    useEffect(() => { reload(); }, []);

    const filtered = data.filter(c =>
        c.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (c.telefono && c.telefono.includes(search))
    );

    const openCreate = () => {
        setForm({ nombre: '', telefono: '', direccion: '' });
        setModal('create');
    };

    const openEdit = (c) => {
        setForm({ nombre: c.nombre, telefono: c.telefono || '', direccion: c.direccion || '' });
        setModal(c.id);
    };

    const handleSave = async () => {
        if (!form.nombre) return;
        if (modal === 'create') {
            await create('clientes', { ...form, creado_en: new Date().toISOString() });
        } else {
            await update('clientes', modal, form);
        }
        setModal(null);
        reload();
    };

    const handleDelete = async (id) => {
        if (confirm('¿Eliminar este cliente y todos sus trabajos asociados permanentemente?')) {
            const trabajos = await getAll('trabajos');
            const trabajosCliente = trabajos.filter(t => t.cliente_id === id);
            for (const t of trabajosCliente) {
                const abonosTodo = await getAll('abonos_trabajo');
                const abonos = abonosTodo.filter(a => a.trabajo_id === t.id);
                for (const a of abonos) {
                    await remove('abonos_trabajo', a.id);
                }
                await remove('trabajos', t.id);
            }
            await remove('clientes', id);
            reload();
        }
    };

    return (
        <div>
            <div className="toolbar">
                <div className="toolbar-left">
                    <div className="search-input-wrapper">
                        <Search size={16} />
                        <input type="text" className="form-input" placeholder="Buscar clientes..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
                <button className="btn btn-primary" onClick={openCreate}>
                    <Plus size={16} /> Nuevo Cliente
                </button>
            </div>

            <div className="card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Teléfono</th>
                                <th>Dirección</th>
                                <th>Registrado</th>
                                <th className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(c => (
                                <tr key={c.id}>
                                    <td className="font-bold">{c.nombre}</td>
                                    <td>{c.telefono || '—'}</td>
                                    <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.direccion || '—'}</td>
                                    <td className="text-muted">{formatDate(c.creado_en)}</td>
                                    <td className="text-right">
                                        <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                                            <button className="btn btn-icon btn-sm btn-ghost" onClick={() => openEdit(c)}><Edit2 size={14} /></button>
                                            <button className="btn btn-icon btn-sm btn-ghost" onClick={() => handleDelete(c.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={5} className="text-center text-muted" style={{ padding: 'var(--space-8)' }}>No se encontraron clientes</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal !== null && (
                <Modal
                    title={modal === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'}
                    onClose={() => setModal(null)}
                    footer={<><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button><button className="btn btn-primary" onClick={handleSave}>Guardar</button></>}
                >
                    <div className="form-group">
                        <label className="form-label">Nombre Completo</label>
                        <input className="form-input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre del cliente" />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Teléfono</label>
                            <input className="form-input" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="809-000-0000" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Dirección</label>
                        <textarea className="form-textarea" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} placeholder="Dirección (opcional)" />
                    </div>
                </Modal>
            )}
        </div>
    );
}
