import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAll, create, update, remove } from '../data/store';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import { Plus, Search, Edit2, UserCheck, UserX, Settings, Trash2 } from 'lucide-react';

export default function Usuarios() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.rol === 'admin';
    const [data, setData] = useState([]);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({ nombre: '', usuario: '', contrasena_hash: '', rol: 'empleado' });

    const reload = async () => setData(await getAll('usuarios'));
    useEffect(() => { reload(); }, []);

    const filtered = data.filter(u =>
        u.nombre.toLowerCase().includes(search.toLowerCase()) ||
        u.usuario.toLowerCase().includes(search.toLowerCase())
    );

    const openCreate = () => {
        setForm({ nombre: '', usuario: '', contrasena_hash: '', rol: 'empleado' });
        setModal('create');
    };

    const openEdit = (u) => {
        setForm({ nombre: u.nombre, usuario: u.usuario, contrasena_hash: '', rol: u.rol });
        setModal(u.id);
    };

    const handleSave = async () => {
        if (!form.nombre || !form.usuario) return;
        if (modal === 'create') {
            if (!form.contrasena_hash) return;
            await create('usuarios', { ...form, activo: true, creado_en: new Date().toISOString() });
        } else {
            const updateData = { nombre: form.nombre, usuario: form.usuario, rol: form.rol };
            if (form.contrasena_hash) updateData.contrasena_hash = form.contrasena_hash;
            await update('usuarios', modal, updateData);
        }
        setModal(null);
        reload();
    };

    const toggleActive = async (u) => {
        await update('usuarios', u.id, { activo: !u.activo });
        reload();
    };

    const handleDelete = async (u) => {
        if (u.id === currentUser.id) {
            alert('No puedes eliminar tu propia cuenta.');
            return;
        }
        // Verificar si tiene datos asociados
        const facturas = (await getAll('facturas')).filter(f => f.usuario_id === u.id);
        if (facturas.length > 0) {
            alert(`No se puede eliminar. Este usuario tiene ${facturas.length} factura(s) asociada(s).`);
            return;
        }
        const trabajos = (await getAll('trabajos')).filter(t => t.usuario_id === u.id);
        if (trabajos.length > 0) {
            alert(`No se puede eliminar. Este usuario tiene ${trabajos.length} trabajo(s) asociado(s).`);
            return;
        }
        if (confirm(`¿Eliminar permanentemente al usuario "${u.nombre}"? Esta acción no se puede deshacer.`)) {
            await remove('usuarios', u.id);
            reload();
        }
    };

    return (
        <div>
            <div className="toolbar">
                <div className="toolbar-left">
                    <div className="search-input-wrapper">
                        <Search size={16} />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Buscar usuarios..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <button className="btn btn-primary" onClick={openCreate}>
                    <Plus size={16} /> Nuevo Usuario
                </button>
            </div>

            <div className="card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Usuario</th>
                                <th>Rol</th>
                                <th>Estado</th>
                                <th className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(u => (
                                <tr key={u.id}>
                                    <td className="font-bold">{u.nombre}</td>
                                    <td>{u.usuario}</td>
                                    <td><span className={`badge ${u.rol === 'admin' ? 'badge-blue' : 'badge-slate'}`}>{u.rol}</span></td>
                                    <td>
                                        <span className={`badge ${u.activo ? 'badge-green' : 'badge-red'}`}>
                                            {u.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                                            <button className="btn btn-icon btn-sm btn-ghost" onClick={() => openEdit(u)} title="Editar">
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                className={`btn btn-icon btn-sm ${u.activo ? 'btn-ghost' : 'btn-ghost'}`}
                                                onClick={() => toggleActive(u)}
                                                title={u.activo ? 'Desactivar' : 'Activar'}
                                            >
                                                {u.activo ? <UserX size={14} /> : <UserCheck size={14} />}
                                            </button>
                                            <button
                                                className="btn btn-icon btn-sm btn-ghost"
                                                onClick={() => navigate(`/usuarios/${u.id}/perfil`)}
                                                title="Configuración de perfil"
                                            >
                                                <Settings size={14} />
                                            </button>
                                            {isAdmin && (
                                                <button
                                                    className="btn btn-icon btn-sm btn-ghost"
                                                    onClick={() => handleDelete(u)}
                                                    title="Eliminar usuario"
                                                    style={{ color: 'var(--color-danger)' }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={5} className="text-center text-muted" style={{ padding: 'var(--space-8)' }}>No se encontraron usuarios</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal !== null && (
                <Modal
                    title={modal === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}
                    onClose={() => setModal(null)}
                    footer={
                        <>
                            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSave}>Guardar</button>
                        </>
                    }
                >
                    <div className="form-group">
                        <label className="form-label">Nombre Completo</label>
                        <input className="form-input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre completo" />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Usuario</label>
                            <input className="form-input" value={form.usuario} onChange={e => setForm({ ...form, usuario: e.target.value })} placeholder="usuario" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Rol</label>
                            <select className="form-select" value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}>
                                <option value="admin">Administrador</option>
                                <option value="empleado">Empleado</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">{modal === 'create' ? 'Contraseña' : 'Nueva Contraseña (dejar vacío para mantener)'}</label>
                        <input type="password" className="form-input" value={form.contrasena_hash} onChange={e => setForm({ ...form, contrasena_hash: e.target.value })} placeholder="••••••••" />
                    </div>
                </Modal>
            )}
        </div>
    );
}
