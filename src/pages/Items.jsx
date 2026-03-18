import { useState, useEffect } from 'react';
import { getAll, create, update, remove, formatMoney } from '../data/store';
import Modal from '../components/Modal';
import { Plus, Search, Edit2, Trash2, Package, Zap, AlertTriangle } from 'lucide-react';

export default function Items() {
    const [data, setData] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterCat, setFilterCat] = useState('all');
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({
        es_producto: true, nombre: '', descripcion: '', precio_venta: '',
        costo: '', stock: '', stock_minimo: '5', categoria_id: '', activo: true
    });

    const reload = () => { setData(getAll('items')); setCategorias(getAll('categorias')); };
    useEffect(reload, []);

    const filtered = data.filter(i => {
        if (!i.nombre.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterType === 'producto' && !i.es_producto) return false;
        if (filterType === 'servicio' && i.es_producto) return false;
        if (filterCat !== 'all' && i.categoria_id !== Number(filterCat)) return false;
        return true;
    });

    const openCreate = () => {
        setForm({ es_producto: true, nombre: '', descripcion: '', precio_venta: '', costo: '', stock: '', stock_minimo: '5', categoria_id: '', activo: true });
        setModal('create');
    };

    const openEdit = (item) => {
        setForm({
            es_producto: item.es_producto,
            nombre: item.nombre,
            descripcion: item.descripcion || '',
            precio_venta: String(item.precio_venta),
            costo: String(item.costo || ''),
            stock: String(item.stock || ''),
            stock_minimo: String(item.stock_minimo || ''),
            categoria_id: item.categoria_id ? String(item.categoria_id) : '',
            activo: item.activo,
        });
        setModal(item.id);
    };

    const handleSave = () => {
        if (!form.nombre || !form.precio_venta) return;
        const saveData = {
            ...form,
            precio_venta: Number(form.precio_venta),
            costo: Number(form.costo) || 0,
            stock: form.es_producto ? Number(form.stock) || 0 : 0,
            stock_minimo: form.es_producto ? Number(form.stock_minimo) || 5 : 0,
            categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
            actualizado_en: new Date().toISOString(),
        };
        if (modal === 'create') {
            create('items', { ...saveData, creado_en: new Date().toISOString() });
        } else {
            update('items', modal, saveData);
        }
        setModal(null);
        reload();
    };

    const handleDelete = (id) => {
        const detalles = getAll('detalle_factura').filter(d => d.item_id === id);
        if (detalles.length > 0) {
            alert('No se puede eliminar. Este ítem tiene facturas asociadas.');
            return;
        }
        if (confirm('¿Eliminar este ítem?')) {
            remove('items', id);
            reload();
        }
    };

    const getCatName = (id) => categorias.find(c => c.id === id)?.nombre || '—';

    return (
        <div>
            <div className="toolbar">
                <div className="toolbar-left">
                    <div className="search-input-wrapper">
                        <Search size={16} />
                        <input type="text" className="form-input" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className="form-select" style={{ width: 150 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
                        <option value="all">Todos</option>
                        <option value="producto">Productos</option>
                        <option value="servicio">Servicios</option>
                    </select>
                    <select className="form-select" style={{ width: 180 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                        <option value="all">Todas las categorías</option>
                        {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                </div>
                <button className="btn btn-primary" onClick={openCreate}>
                    <Plus size={16} /> Nuevo Ítem
                </button>
            </div>

            <div className="card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Tipo</th>
                                <th>Categoría</th>
                                <th className="text-right">Precio</th>
                                <th className="text-right">Stock</th>
                                <th>Estado</th>
                                <th className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(item => {
                                const lowStock = item.es_producto && item.stock <= item.stock_minimo;
                                return (
                                    <tr key={item.id}>
                                        <td className="font-bold">{item.nombre}</td>
                                        <td>
                                            <span className={`badge ${item.es_producto ? 'badge-blue' : 'badge-slate'}`}>
                                                {item.es_producto ? <><Package size={11} /> Producto</> : <><Zap size={11} /> Servicio</>}
                                            </span>
                                        </td>
                                        <td className="text-muted">{getCatName(item.categoria_id)}</td>
                                        <td className="text-right font-mono">RD$ {formatMoney(item.precio_venta)}</td>
                                        <td className="text-right">
                                            {item.es_producto ? (
                                                <span className={`badge ${item.stock === 0 ? 'badge-red' : lowStock ? 'badge-orange' : 'badge-green'}`}>
                                                    {lowStock && <AlertTriangle size={11} />}
                                                    {item.stock}
                                                </span>
                                            ) : (
                                                <span className="text-muted">N/A</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge ${item.activo ? 'badge-green' : 'badge-red'}`}>
                                                {item.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                                                <button className="btn btn-icon btn-sm btn-ghost" onClick={() => openEdit(item)}><Edit2 size={14} /></button>
                                                <button className="btn btn-icon btn-sm btn-ghost" onClick={() => handleDelete(item.id)}><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr><td colSpan={7} className="text-center text-muted" style={{ padding: 'var(--space-8)' }}>No se encontraron ítems</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal !== null && (
                <Modal
                    title={modal === 'create' ? 'Nuevo Ítem' : 'Editar Ítem'}
                    onClose={() => setModal(null)}
                    size="lg"
                    footer={<><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button><button className="btn btn-primary" onClick={handleSave}>Guardar</button></>}
                >
                    <div className="form-group">
                        <label className="form-label">Tipo</label>
                        <div className="flex gap-3">
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <input type="radio" checked={form.es_producto} onChange={() => setForm({ ...form, es_producto: true })} /> Producto
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <input type="radio" checked={!form.es_producto} onChange={() => setForm({ ...form, es_producto: false })} /> Servicio
                            </label>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Nombre</label>
                        <input className="form-input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre del producto o servicio" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Descripción</label>
                        <textarea className="form-textarea" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción opcional" />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Precio de Venta (RD$)</label>
                            <input type="number" step="0.01" className="form-input" value={form.precio_venta} onChange={e => setForm({ ...form, precio_venta: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Costo (RD$)</label>
                            <input type="number" step="0.01" className="form-input" value={form.costo} onChange={e => setForm({ ...form, costo: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Categoría</label>
                            <select className="form-select" value={form.categoria_id} onChange={e => setForm({ ...form, categoria_id: e.target.value })}>
                                <option value="">Sin categoría</option>
                                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                        </div>
                    </div>
                    {form.es_producto && (
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Stock Actual</label>
                                <input type="number" className="form-input" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Stock Mínimo</label>
                                <input type="number" className="form-input" value={form.stock_minimo} onChange={e => setForm({ ...form, stock_minimo: e.target.value })} />
                                <span className="form-hint">Alerta cuando el stock baje de este valor</span>
                            </div>
                        </div>
                    )}
                </Modal>
            )}
        </div>
    );
}
