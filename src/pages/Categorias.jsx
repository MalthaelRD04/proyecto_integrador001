import { useState, useEffect } from 'react';
import { getAll, create, update, remove } from '../data/store';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';

export default function Categorias() {
    const { user } = useAuth();
    const isAdmin = user?.rol === 'admin';
    const [data, setData] = useState([]);
    const [itemsMap, setItemsMap] = useState({});
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({ nombre: '', descripcion: '' });

    const reload = async () => {
        const categorias = await getAll('categorias');
        const items = await getAll('items');
        
        const pMap = {};
        for (const c of categorias) {
            pMap[c.id] = items.filter(i => i.categoria_id === c.id).length;
        }
        setItemsMap(pMap);
        setData(categorias);
    };
    useEffect(() => { reload(); }, []);

    const filtered = data.filter(c =>
        c.nombre.toLowerCase().includes(search.toLowerCase())
    );

    const openCreate = () => {
        setForm({ nombre: '', descripcion: '' });
        setModal('create');
    };

    const openEdit = (c) => {
        setForm({ nombre: c.nombre, descripcion: c.descripcion || '' });
        setModal(c.id);
    };

    const handleSave = async () => {
        if (!form.nombre) return;
        if (modal === 'create') {
            await create('categorias', form);
        } else {
            await update('categorias', modal, form);
        }
        setModal(null);
        reload();
    };

    const handleDelete = async (id) => {
        const items = (await getAll('items')).filter(i => i.categoria_id === id);
        if (items.length > 0) {
            alert(`No se puede eliminar. Hay ${items.length} producto(s) usando esta categoría.`);
            return;
        }
        if (confirm('¿Eliminar esta categoría?')) {
            await remove('categorias', id);
            reload();
        }
    };

    return (
        <div>
            <div className="toolbar">
                <div className="toolbar-left">
                    <div className="search-input-wrapper">
                        <Search size={16} />
                        <input type="text" className="form-input" placeholder="Buscar categorías..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
                <button className="btn btn-primary" onClick={openCreate}>
                    <Plus size={16} /> Nueva Categoría
                </button>
            </div>

            <div className="card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Descripción</th>
                                <th className="text-right">Productos</th>
                                <th className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(c => {
                                const count = itemsMap[c.id] || 0;
                                return (
                                    <tr key={c.id}>
                                        <td className="font-bold">{c.nombre}</td>
                                        <td className="text-muted">{c.descripcion || '—'}</td>
                                        <td className="text-right"><span className="badge badge-slate">{count}</span></td>
                                        <td className="text-right">
                                            <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                                                <button className="btn btn-icon btn-sm btn-ghost" onClick={() => openEdit(c)}><Edit2 size={14} /></button>
                                                {isAdmin && (
                                                    <button className="btn btn-icon btn-sm btn-ghost" onClick={() => handleDelete(c.id)}><Trash2 size={14} /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr><td colSpan={4} className="text-center text-muted" style={{ padding: 'var(--space-8)' }}>No se encontraron categorías</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal !== null && (
                <Modal
                    title={modal === 'create' ? 'Nueva Categoría' : 'Editar Categoría'}
                    onClose={() => setModal(null)}
                    footer={<><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button><button className="btn btn-primary" onClick={handleSave}>Guardar</button></>}
                >
                    <div className="form-group">
                        <label className="form-label">Nombre</label>
                        <input className="form-input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre de la categoría" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Descripción</label>
                        <textarea className="form-textarea" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción (opcional)" />
                    </div>
                </Modal>
            )}
        </div>
    );
}
