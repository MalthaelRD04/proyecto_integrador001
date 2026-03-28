import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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

function ProtectedRoute() {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <Outlet />;
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
            <Route path="/usuarios" element={<AppLayout title="Usuarios"><Usuarios /></AppLayout>} />
            <Route path="/clientes" element={<AppLayout title="Clientes"><Clientes /></AppLayout>} />
            <Route path="/categorias" element={<AppLayout title="Categorías"><Categorias /></AppLayout>} />
            <Route path="/items" element={<AppLayout title="Productos y Servicios"><Items /></AppLayout>} />
            <Route path="/facturacion" element={<AppLayout title="Nueva Factura"><Facturacion /></AppLayout>} />
            <Route path="/facturas" element={<AppLayout title="Facturas"><Facturas /></AppLayout>} />
            <Route path="/facturas/:id" element={<AppLayout title="Detalle de Factura"><FacturaDetalle /></AppLayout>} />
            <Route path="/trabajos" element={<AppLayout title="Trabajos"><Trabajos /></AppLayout>} />
            <Route path="/trabajos/:id" element={<AppLayout title="Detalle de Trabajo"><TrabajoDetalle /></AppLayout>} />
            <Route path="/reportes" element={<AppLayout title="Reportes"><Reportes /></AppLayout>} />
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

export default function App() {
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

        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return (
        <HashRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </HashRouter>
    );
}
