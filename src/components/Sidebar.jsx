import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    LayoutDashboard, Users, UserCircle, Tag, Package,
    FileText, Receipt, Briefcase, CreditCard, BarChart3,
    LogOut, Printer, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
    {
        label: 'PRINCIPAL', items: [
            { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        ]
    },
    {
        label: 'GESTIÓN', items: [
            { to: '/usuarios', icon: Users, label: 'Usuarios' },
            { to: '/clientes', icon: UserCircle, label: 'Clientes' },
            { to: '/categorias', icon: Tag, label: 'Categorías' },
            { to: '/items', icon: Package, label: 'Productos / Servicios' },
        ]
    },
    {
        label: 'VENTAS', items: [
            { to: '/facturacion', icon: Receipt, label: 'Nueva Factura' },
            { to: '/facturas', icon: FileText, label: 'Facturas' },
        ]
    },
    {
        label: 'TRABAJOS', items: [
            { to: '/trabajos', icon: Briefcase, label: 'Trabajos' },
        ]
    },
    {
        label: 'REPORTES', items: [
            { to: '/reportes', icon: BarChart3, label: 'Reportes' },
        ]
    },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* Mobile toggle */}
            <button
                className="btn btn-icon btn-ghost"
                onClick={() => setMobileOpen(true)}
                style={{
                    position: 'fixed', top: 16, left: 16, zIndex: 40,
                    display: 'none',
                }}
                id="mobile-menu-toggle"
            >
                <Menu size={20} />
            </button>

            {/* Overlay */}
            {mobileOpen && (
                <div
                    className="modal-overlay"
                    style={{ zIndex: 29 }}
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon">
                            <Printer size={20} />
                        </div>
                        <div className="sidebar-logo-text">
                            <span>JRJ Copias</span>
                            <span>Centro de Servicios</span>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(section => (
                        <div key={section.label}>
                            <div className="sidebar-section-title">{section.label}</div>
                            {section.items.map(item => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.to === '/'}
                                    className={({ isActive }) =>
                                        `sidebar-link ${isActive ? 'active' : ''}`
                                    }
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <item.icon size={18} />
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button
                        className="sidebar-link"
                        onClick={logout}
                        style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
                    >
                        <LogOut size={18} />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>
        </>
    );
}
