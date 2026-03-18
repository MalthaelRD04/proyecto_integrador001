import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Printer, AlertCircle } from 'lucide-react';

export default function Login() {
    const { login } = useAuth();
    const [form, setForm] = useState({ usuario: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        setTimeout(() => {
            const result = login(form.usuario, form.password);
            if (!result.success) {
                setError(result.error);
            }
            setLoading(false);
        }, 400);
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">
                        <Printer size={28} />
                    </div>
                    <h1>JRJ Centro de Copias</h1>
                    <p>Sistema Administrativo</p>
                </div>

                {error && (
                    <div className="alert alert-danger">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Usuario</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Ingrese su usuario"
                            value={form.usuario}
                            onChange={e => setForm({ ...form, usuario: e.target.value })}
                            required
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Contraseña</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Ingrese su contraseña"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary login-btn"
                        disabled={loading}
                    >
                        {loading ? 'Verificando...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    San Fernando de Monte Cristi, Rep. Dominicana
                </p>
            </div>
        </div>
    );
}
