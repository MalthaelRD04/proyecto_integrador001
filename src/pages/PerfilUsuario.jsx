import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getById, update, guardarFotoUsuario, obtenerFotoUsuario, eliminarFotoUsuario } from '../data/store';
import {
    User, Camera, Save, ArrowLeft, Lock, Mail,
    Phone, MapPin, Shield, CheckCircle, AlertCircle,
    Eye, EyeOff, Trash2, Upload, X, ImageOff
} from 'lucide-react';

export default function PerfilUsuario() {
    const { id } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [usuario, setUsuario] = useState(null);
    const [fotoPreview, setFotoPreview] = useState(null);   // foto cargada pero NO guardada aún
    const [fotoGuardada, setFotoGuardada] = useState(null); // foto persistida en localStorage
    const [verFotoModal, setVerFotoModal] = useState(false);
    const [toast, setToast] = useState(null);
    const [confirmEliminar, setConfirmEliminar] = useState(false);

    const [formPersonal, setFormPersonal] = useState({
        nombre: '',
        usuario: '',
        telefono: '',
        correo: '',
        direccion: '',
        bio: '',
    });

    const [formPassword, setFormPassword] = useState({
        actual: '',
        nueva: '',
        confirmar: '',
    });

    const [tabActiva, setTabActiva] = useState('personal');
    const [showPass, setShowPass] = useState({ actual: false, nueva: false, confirmar: false });

    useEffect(() => {
        async function load() {
            const u = await getById('usuarios', id);
            if (!u) { navigate('/usuarios'); return; }
            setUsuario(u);
            setFormPersonal({
                nombre: u.nombre || '',
                usuario: u.usuario || '',
                telefono: u.telefono || '',
                correo: u.correo || '',
                direccion: u.direccion || '',
                bio: u.bio || '',
            });
            const savedFoto = await obtenerFotoUsuario(u.id);
            if (savedFoto) {
                setFotoGuardada(savedFoto);
                setFotoPreview(savedFoto);
            }
        }
        load();
    }, [id, navigate]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ── Seleccionar foto ──
    const handleFotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            showToast('Solo se permiten archivos de imagen.', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            setFotoPreview(ev.target.result); // solo preview, no guardada aún
        };
        reader.readAsDataURL(file);
        // reset input para poder elegir el mismo archivo otra vez
        e.target.value = '';
    };

    // ── Guardar foto ──
    const handleGuardarFoto = async () => {
        if (!fotoPreview) {
            showToast('No hay foto seleccionada.', 'error');
            return;
        }
        await guardarFotoUsuario(Number(id), fotoPreview);
        setFotoGuardada(fotoPreview);
        showToast('Foto de perfil guardada correctamente.');
    };

    // ── Eliminar foto ──
    const handleEliminarFoto = async () => {
        await eliminarFotoUsuario(Number(id));
        setFotoGuardada(null);
        setFotoPreview(null);
        setConfirmEliminar(false);
        showToast('Foto de perfil eliminada.');
    };

    // ── Guardar datos personales ──
    const handleGuardarPersonal = async () => {
        if (!formPersonal.nombre.trim() || !formPersonal.usuario.trim()) {
            showToast('Nombre y usuario son obligatorios.', 'error');
            return;
        }
        await update('usuarios', Number(id), {
            nombre: formPersonal.nombre.trim(),
            usuario: formPersonal.usuario.trim(),
            telefono: formPersonal.telefono.trim(),
            correo: formPersonal.correo.trim(),
            direccion: formPersonal.direccion.trim(),
            bio: formPersonal.bio.trim(),
        });
        showToast('Perfil actualizado correctamente.');
    };

    // ── Cambiar contraseña ──
    const handleGuardarPassword = async () => {
        if (!formPassword.actual) {
            showToast('Ingresa tu contraseña actual.', 'error');
            return;
        }
        const u = await getById('usuarios', id);
        if (u.contrasena_hash !== formPassword.actual) {
            showToast('La contraseña actual es incorrecta.', 'error');
            return;
        }
        if (formPassword.nueva.length < 6) {
            showToast('La nueva contraseña debe tener al menos 6 caracteres.', 'error');
            return;
        }
        if (formPassword.nueva !== formPassword.confirmar) {
            showToast('Las contraseñas nuevas no coinciden.', 'error');
            return;
        }
        await update('usuarios', Number(id), { contrasena_hash: formPassword.nueva });
        setFormPassword({ actual: '', nueva: '', confirmar: '' });
        showToast('Contraseña actualizada correctamente.');
    };

    const getInitials = (nombre) => {
        if (!nombre) return '?';
        return nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    };

    const fotoNoGuardada = fotoPreview && fotoPreview !== fotoGuardada;

    if (!usuario) return null;

    return (
        <div style={{ maxWidth: 780, margin: '0 auto' }}>

            {/* ── Toast ── */}
            {toast && (
                <div style={{
                    position: 'fixed', top: 24, right: 24, zIndex: 9999,
                    background: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
                    color: 'white', borderRadius: 'var(--radius-lg)',
                    padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10,
                    boxShadow: 'var(--shadow-xl)', animation: 'slideUp 200ms ease',
                    fontSize: 'var(--text-sm)', fontWeight: 500,
                }}>
                    {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {toast.msg}
                </div>
            )}

            {/* ── Modal Ver Foto ── */}
            {verFotoModal && (
                <div
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
                        zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: 'fadeIn 150ms ease',
                    }}
                    onClick={() => setVerFotoModal(false)}
                >
                    <div style={{ position: 'relative', maxWidth: 480, width: '90%' }} onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setVerFotoModal(false)}
                            style={{
                                position: 'absolute', top: -44, right: 0,
                                background: 'rgba(255,255,255,0.15)', border: 'none',
                                color: 'white', borderRadius: 'var(--radius-md)',
                                width: 36, height: 36, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', cursor: 'pointer',
                            }}
                        >
                            <X size={18} />
                        </button>
                        {fotoPreview
                            ? <img
                                src={fotoPreview}
                                alt="Foto de perfil"
                                style={{
                                    width: '100%', borderRadius: 'var(--radius-xl)',
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                                    display: 'block',
                                }}
                            />
                            : (
                                <div style={{
                                    background: 'var(--surface-card)', borderRadius: 'var(--radius-xl)',
                                    padding: 60, textAlign: 'center', color: 'var(--text-muted)',
                                }}>
                                    <ImageOff size={48} style={{ margin: '0 auto 12px' }} />
                                    <p>Este usuario no tiene foto de perfil.</p>
                                </div>
                            )
                        }
                        <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 12, fontSize: 'var(--text-sm)' }}>
                            Haz clic fuera para cerrar
                        </p>
                    </div>
                </div>
            )}

            {/* ── Modal Confirmar Eliminar Foto ── */}
            {confirmEliminar && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'var(--surface-overlay)',
                    zIndex: 9997, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 'var(--space-6)',
                }}>
                    <div style={{
                        background: 'var(--surface-card)', borderRadius: 'var(--radius-xl)',
                        padding: 'var(--space-6)', maxWidth: 380, width: '100%',
                        boxShadow: 'var(--shadow-xl)', textAlign: 'center',
                    }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: '50%',
                            background: 'var(--color-danger-light)', color: 'var(--color-danger)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto var(--space-4)',
                        }}>
                            <Trash2 size={24} />
                        </div>
                        <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)', marginBottom: 8 }}>
                            ¿Eliminar foto de perfil?
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)' }}>
                            Esta acción no se puede deshacer. Se mostrará el avatar con las iniciales del usuario.
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
                            <button className="btn btn-secondary" onClick={() => setConfirmEliminar(false)}>
                                Cancelar
                            </button>
                            <button className="btn btn-danger" onClick={handleEliminarFoto}>
                                <Trash2 size={14} /> Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <button className="btn btn-ghost btn-icon" onClick={() => navigate('/usuarios')}>
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                        Configuración de Usuario
                    </h1>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 2 }}>
                        Edita el perfil y datos personales de <strong>{usuario.nombre}</strong>
                    </p>
                </div>
            </div>

            {/* ── Tarjeta Foto ── */}
            <div className="card" style={{ marginBottom: 'var(--space-5)', padding: 'var(--space-6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap' }}>

                    {/* Avatar con badge de cámara */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div
                            style={{
                                width: 96, height: 96, borderRadius: '50%',
                                background: fotoPreview ? 'transparent' : 'var(--color-primary)',
                                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 32, fontWeight: 700, overflow: 'hidden',
                                border: `3px solid ${fotoNoGuardada ? 'var(--color-warning)' : 'var(--border-strong)'}`,
                                boxShadow: 'var(--shadow-md)',
                                cursor: 'pointer',
                                transition: 'border-color 0.2s',
                            }}
                            onClick={() => setVerFotoModal(true)}
                            title="Ver foto"
                        >
                            {fotoPreview
                                ? <img src={fotoPreview} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : getInitials(formPersonal.nombre)
                            }
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                position: 'absolute', bottom: 0, right: 0,
                                width: 30, height: 30, borderRadius: '50%',
                                background: 'var(--color-primary)', color: 'white',
                                border: '2px solid var(--surface-card)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
                                transition: 'background var(--transition-fast)',
                            }}
                            title="Cambiar foto"
                        >
                            <Camera size={13} />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleFotoChange}
                        />
                    </div>

                    {/* Info rápida */}
                    <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {formPersonal.nombre || 'Sin nombre'}
                        </div>
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 2 }}>
                            @{formPersonal.usuario}
                        </div>
                        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <span className={`badge ${usuario.rol === 'admin' ? 'badge-blue' : 'badge-slate'}`}>
                                <Shield size={10} /> {usuario.rol === 'admin' ? 'Administrador' : 'Empleado'}
                            </span>
                            <span className={`badge ${usuario.activo ? 'badge-green' : 'badge-red'}`}>
                                {usuario.activo ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>
                        {fotoNoGuardada && (
                            <p style={{ marginTop: 8, fontSize: 'var(--text-xs)', color: 'var(--color-warning)', fontWeight: 500 }}>
                                ⚠ Foto seleccionada pero no guardada aún.
                            </p>
                        )}
                        {formPersonal.bio && (
                            <p style={{ marginTop: 8, fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                                "{formPersonal.bio}"
                            </p>
                        )}
                    </div>

                    {/* Botones de foto */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignSelf: 'flex-start' }}>
                        {/* Ver foto */}
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setVerFotoModal(true)}
                            title="Ver foto a tamaño completo"
                        >
                            <Eye size={14} /> Ver foto
                        </button>

                        {/* Subir / cambiar foto */}
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => fileInputRef.current?.click()}
                            title="Seleccionar una nueva foto"
                        >
                            <Upload size={14} /> {fotoPreview ? 'Cambiar foto' : 'Subir foto'}
                        </button>

                        {/* Guardar foto */}
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={handleGuardarFoto}
                            disabled={!fotoPreview || !fotoNoGuardada}
                            title={!fotoNoGuardada ? 'La foto ya está guardada' : 'Guardar foto seleccionada'}
                            style={{ opacity: (!fotoPreview || !fotoNoGuardada) ? 0.5 : 1 }}
                        >
                            <Save size={14} /> Guardar foto
                        </button>

                        {/* Eliminar foto */}
                        <button
                            className="btn btn-sm"
                            onClick={() => setConfirmEliminar(true)}
                            disabled={!fotoGuardada}
                            title={!fotoGuardada ? 'No hay foto guardada' : 'Eliminar foto de perfil'}
                            style={{
                                background: fotoGuardada ? 'var(--color-danger-light)' : 'var(--surface-input)',
                                color: fotoGuardada ? 'var(--color-danger)' : 'var(--text-muted)',
                                border: '1px solid',
                                borderColor: fotoGuardada ? 'var(--color-danger)' : 'var(--border-input)',
                                opacity: !fotoGuardada ? 0.5 : 1,
                            }}
                        >
                            <Trash2 size={14} /> Eliminar foto
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 'var(--space-5)', background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', padding: 4, border: '1px solid var(--border-default)' }}>
                {[
                    { key: 'personal', label: 'Datos Personales', icon: User },
                    { key: 'password', label: 'Contraseña', icon: Lock },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setTabActiva(tab.key)}
                        style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 8, height: 38, borderRadius: 'var(--radius-md)',
                            border: 'none', cursor: 'pointer', fontWeight: 500,
                            fontSize: 'var(--text-sm)', transition: 'all var(--transition-fast)',
                            background: tabActiva === tab.key ? 'var(--color-primary)' : 'transparent',
                            color: tabActiva === tab.key ? 'white' : 'var(--text-secondary)',
                        }}
                    >
                        <tab.icon size={15} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── TAB: Datos Personales ── */}
            {tabActiva === 'personal' && (
                <div className="card">
                    <div className="card-header">
                        <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <User size={16} /> Información Personal
                        </span>
                    </div>
                    <div className="card-body">
                        <div className="form-group">
                            <label className="form-label">Nombre Completo *</label>
                            <input
                                className="form-input"
                                value={formPersonal.nombre}
                                onChange={e => setFormPersonal({ ...formPersonal, nombre: e.target.value })}
                                placeholder="Nombre completo"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Nombre de Usuario *</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{
                                        position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                                        color: 'var(--text-muted)', fontSize: 'var(--text-sm)'
                                    }}>@</span>
                                    <input
                                        className="form-input"
                                        style={{ paddingLeft: 26 }}
                                        value={formPersonal.usuario}
                                        onChange={e => setFormPersonal({ ...formPersonal, usuario: e.target.value })}
                                        placeholder="usuario"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Rol</label>
                                <input
                                    className="form-input"
                                    value={usuario.rol === 'admin' ? 'Administrador' : 'Empleado'}
                                    disabled
                                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                                />
                                <span className="form-hint">El rol se cambia desde la sección de Usuarios.</span>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Phone size={13} /> Teléfono
                                </label>
                                <input
                                    className="form-input"
                                    value={formPersonal.telefono}
                                    onChange={e => setFormPersonal({ ...formPersonal, telefono: e.target.value })}
                                    placeholder="809-000-0000"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Mail size={13} /> Correo Electrónico
                                </label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={formPersonal.correo}
                                    onChange={e => setFormPersonal({ ...formPersonal, correo: e.target.value })}
                                    placeholder="correo@ejemplo.com"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <MapPin size={13} /> Dirección
                            </label>
                            <input
                                className="form-input"
                                value={formPersonal.direccion}
                                onChange={e => setFormPersonal({ ...formPersonal, direccion: e.target.value })}
                                placeholder="Calle, Sector, Ciudad"
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Biografía / Nota</label>
                            <textarea
                                className="form-textarea"
                                value={formPersonal.bio}
                                onChange={e => setFormPersonal({ ...formPersonal, bio: e.target.value })}
                                placeholder="Una breve descripción sobre el usuario..."
                                style={{ minHeight: 80 }}
                            />
                            <span className="form-hint">Opcional. Se muestra en la tarjeta de perfil.</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-5)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-default)' }}>
                            <button className="btn btn-secondary" onClick={() => navigate('/usuarios')}>
                                Cancelar
                            </button>
                            <button className="btn btn-primary" onClick={handleGuardarPersonal}>
                                <Save size={15} /> Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB: Contraseña ── */}
            {tabActiva === 'password' && (
                <div className="card">
                    <div className="card-header">
                        <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Lock size={16} /> Cambiar Contraseña
                        </span>
                    </div>
                    <div className="card-body">
                        <div style={{
                            background: 'var(--color-primary-light)',
                            border: '1px solid var(--blue-200)',
                            borderRadius: 'var(--radius-md)',
                            padding: '12px 16px',
                            marginBottom: 'var(--space-5)',
                            fontSize: 'var(--text-sm)',
                            color: 'var(--blue-700)',
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                            <Shield size={15} />
                            Usa una contraseña de al menos 6 caracteres para mayor seguridad.
                        </div>

                        <div className="form-group">
                            <label className="form-label">Contraseña Actual</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPass.actual ? 'text' : 'password'}
                                    className="form-input"
                                    style={{ paddingRight: 40 }}
                                    value={formPassword.actual}
                                    onChange={e => setFormPassword({ ...formPassword, actual: e.target.value })}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(p => ({ ...p, actual: !p.actual }))}
                                    style={{
                                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', color: 'var(--text-muted)',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0,
                                    }}
                                    title={showPass.actual ? 'Ocultar contraseña' : 'Ver contraseña'}
                                >
                                    {showPass.actual ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Nueva Contraseña</label>
                                <div style={{ position: 'relative' }}>
                                <input
                                    type={showPass.nueva ? 'text' : 'password'}
                                    className="form-input"
                                    style={{ paddingRight: 40 }}
                                    value={formPassword.nueva}
                                    onChange={e => setFormPassword({ ...formPassword, nueva: e.target.value })}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(p => ({ ...p, nueva: !p.nueva }))}
                                    style={{
                                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', color: 'var(--text-muted)',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0,
                                    }}
                                    title={showPass.nueva ? 'Ocultar contraseña' : 'Ver contraseña'}
                                >
                                    {showPass.nueva ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                                </div>
                                {formPassword.nueva && (
                                    <div style={{ marginTop: 6 }}>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            {[1, 2, 3, 4].map(n => (
                                                <div key={n} style={{
                                                    flex: 1, height: 3, borderRadius: 2,
                                                    background: formPassword.nueva.length >= n * 3
                                                        ? (formPassword.nueva.length >= 10 ? 'var(--color-success)' : formPassword.nueva.length >= 6 ? 'var(--color-warning)' : 'var(--color-danger)')
                                                        : 'var(--border-input)',
                                                    transition: 'background 0.2s',
                                                }} />
                                            ))}
                                        </div>
                                        <span className="form-hint" style={{ marginTop: 4 }}>
                                            {formPassword.nueva.length < 6 ? 'Débil' : formPassword.nueva.length < 10 ? 'Regular' : 'Fuerte'}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirmar Nueva Contraseña</label>
                                <div style={{ position: 'relative' }}>
                                <input
                                    type={showPass.confirmar ? 'text' : 'password'}
                                    className="form-input"
                                    style={{
                                        paddingRight: 40,
                                        borderColor: formPassword.confirmar && formPassword.confirmar !== formPassword.nueva
                                            ? 'var(--color-danger)' : undefined
                                    }}
                                    value={formPassword.confirmar}
                                    onChange={e => setFormPassword({ ...formPassword, confirmar: e.target.value })}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(p => ({ ...p, confirmar: !p.confirmar }))}
                                    style={{
                                        position: 'absolute', right: 10, top: formPassword.confirmar && formPassword.confirmar !== formPassword.nueva ? '40%' : '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', color: 'var(--text-muted)',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0,
                                    }}
                                    title={showPass.confirmar ? 'Ocultar contraseña' : 'Ver contraseña'}
                                >
                                    {showPass.confirmar ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                                </div>
                                {formPassword.confirmar && formPassword.confirmar !== formPassword.nueva && (
                                    <span className="form-hint" style={{ color: 'var(--color-danger)' }}>
                                        Las contraseñas no coinciden.
                                    </span>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-5)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-default)' }}>
                            <button className="btn btn-secondary" onClick={() => setFormPassword({ actual: '', nueva: '', confirmar: '' })}>
                                Limpiar
                            </button>
                            <button className="btn btn-primary" onClick={handleGuardarPassword}>
                                <Save size={15} /> Actualizar Contraseña
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
