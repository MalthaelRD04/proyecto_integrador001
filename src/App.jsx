import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { initDatabase, isDBReady } from './data/store';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import Clientes from './pages/Clientes';
import Categorias from './pages/Categorias';
import Items from './pages/Items';
import Facturacion from './pages/Facturacion';
import Facturas from './pages/Facturas';
import FacturaDetalle from './pages/FacturaDetalle';
import Trabajos from './pages/Trabajos';
import TrabajoDetalle from './pages/TrabajoDetalle';
import Reportes from './pages/Reportes';
import PerfilUsuario from './pages/PerfilUsuario';

function ProtectedRoute() {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <Outlet />;
}

function AdminRoute({ children }) {
    const { user } = useAuth();
    return user?.rol === 'admin' ? children : <Navigate to="/" replace />;
}

function AppLayout({ title, children }) {
    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-area">
                <TopBar title={title} />
                <main className="page-content">
                    {children}
                </main>
            </div>
        </div>
    );
}

function AppRoutes() {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return (
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/" element={<AppLayout title="Dashboard"><Dashboard /></AppLayout>} />
            <Route path="/usuarios" element={<AdminRoute><AppLayout title="Usuarios"><Usuarios /></AppLayout></AdminRoute>} />
            <Route path="/clientes" element={<AppLayout title="Clientes"><Clientes /></AppLayout>} />
            <Route path="/categorias" element={<AppLayout title="Categorías"><Categorias /></AppLayout>} />
            <Route path="/items" element={<AppLayout title="Productos y Servicios"><Items /></AppLayout>} />
            <Route path="/facturacion" element={<AppLayout title="Nueva Factura"><Facturacion /></AppLayout>} />
            <Route path="/facturas" element={<AppLayout title="Facturas"><Facturas /></AppLayout>} />
            <Route path="/facturas/:id" element={<AppLayout title="Detalle de Factura"><FacturaDetalle /></AppLayout>} />
            <Route path="/trabajos" element={<AppLayout title="Trabajos"><Trabajos /></AppLayout>} />
            <Route path="/trabajos/:id" element={<AppLayout title="Detalle de Trabajo"><TrabajoDetalle /></AppLayout>} />
            <Route path="/reportes" element={<AppLayout title="Reportes"><Reportes /></AppLayout>} />
            <Route path="/usuarios/:id/perfil" element={<AdminRoute><AppLayout title="Configuración de Usuario"><PerfilUsuario /></AppLayout></AdminRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export const applyTheme = (themeStr) => {
    if (themeStr === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
        document.documentElement.setAttribute('data-theme', themeStr);
    }
};

// ── Pantalla de carga mientras se inicializa SQLite ──
function LoadingScreen() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: 'var(--surface-main)',
            color: 'var(--text-primary)',
            gap: '16px',
        }}>
            <div style={{
                width: 56, height: 56,
                border: '3px solid var(--border-default)',
                borderTopColor: 'var(--color-primary)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Inicializando base de datos...
            </p>
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

function ErrorScreen({ error, onRetry }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: 'var(--surface-main)',
            color: 'var(--text-primary)',
            gap: '16px',
            padding: '32px',
            textAlign: 'center',
        }}>
            <div style={{ fontSize: '3rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Error al iniciar la base de datos</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: 400 }}>
                {error}
            </p>
            <button
                onClick={onRetry}
                style={{
                    padding: '10px 24px',
                    background: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                }}
            >
                Reintentar
            </button>
        </div>
    );
}

export default function App() {
    const [dbStatus, setDbStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
    const [dbError, setDbError] = useState('');

    const initDB = async () => {
        setDbStatus('loading');
        try {
            await initDatabase();
            setDbStatus('ready');
        } catch (e) {
            console.error('Error inicializando DB:', e);
            setDbError(e.message || 'Error desconocido');
            setDbStatus('error');
        }
    };

    useEffect(() => {
        const storedTheme = localStorage.getItem('app_theme') || 'system';
        applyTheme(storedTheme);

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if ((localStorage.getItem('app_theme') || 'system') === 'system') {
                applyTheme('system');
            }
        };
        mediaQuery.addEventListener('change', handleChange);

        const storedFontSize = localStorage.getItem('app_fontSize') || '16px';
        document.documentElement.style.fontSize = storedFontSize;

        // Inicializar base de datos SQLite
        initDB();

        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    if (dbStatus === 'loading') return <LoadingScreen />;
    if (dbStatus === 'error') return <ErrorScreen error={dbError} onRetry={initDB} />;

    return (
        <HashRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </HashRouter>
    );
}
