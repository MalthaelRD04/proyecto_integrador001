import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Printer, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const { login } = useAuth();
    const [form, setForm] = useState({ usuario: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    }, []);

    const togglePassword = useCallback(() => {
        setShowPassword(prev => !prev);
    }, []);

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        setTimeout(async () => {
            const result = await login(form.usuario, form.password);
            if (!result.success) {
                setError(result.error);
            }
            setLoading(false);
        }, 400);
    }, [form, login]);

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
                            name="usuario"
                            className="form-input"
                            placeholder="Ingrese su usuario"
                            value={form.usuario}
                            onChange={handleChange}
                            required
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Contraseña</label>
                        <div className="password-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                className="form-input password-input"
                                placeholder="Ingrese su contraseña"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={togglePassword}
                                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary login-btn"
                        disabled={loading}
                    >
                        {loading ? 'Verificando...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <p className="login-footer">
                    San Fernando de Monte Cristi, Rep. Dominicana
                </p>
            </div>
        </div>
    );
}

