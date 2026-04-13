import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    LayoutDashboard, Users, UserCircle, Tag, Package,
    FileText, Receipt, Briefcase, CreditCard, BarChart3,
    LogOut, Printer, Menu, Settings, Moon, Sun, Monitor, Type
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Modal from './Modal';
import { applyTheme } from '../App';

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
    const [settingsModal, setSettingsModal] = useState(false);
    
    const [theme, setTheme] = useState(localStorage.getItem('app_theme') || 'system');
    const [fontSize, setFontSize] = useState(localStorage.getItem('app_fontSize') || '16px');

    useEffect(() => {
        applyTheme(theme);
        localStorage.setItem('app_theme', theme);
    }, [theme]);

    useEffect(() => {
        document.documentElement.style.fontSize = fontSize;
        localStorage.setItem('app_fontSize', fontSize);
    }, [fontSize]);

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
                        <div className="sidebar-logo-icon" style={{ background: 'transparent', overflow: 'hidden' }}>
                            <img src="/logo.png" alt="JRJ Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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
                        onClick={() => setSettingsModal(true)}
                        style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', marginBottom: '8px' }}
                    >
                        <Settings size={18} />
                        Ajustes
                    </button>
                    <button
                        className="sidebar-link text-danger"
                        onClick={logout}
                        style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
                    >
                        <LogOut size={18} />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Modal de Ajustes */}
            {settingsModal && (
                <Modal
                    title="Ajustes de Interfaz"
                    onClose={() => setSettingsModal(false)}
                    footer={
                        <button className="btn btn-primary" onClick={() => setSettingsModal(false)}>Hecho</button>
                    }
                >
                    <div style={{ marginBottom: 'var(--space-6)' }}>
                        <div className="form-label mb-3" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <Moon size={16} /> Tema Visual
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                            <button 
                                className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`} 
                                onClick={() => setTheme('light')}
                            >
                                <Sun size={14} /> Claro
                            </button>
                            <button 
                                className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`} 
                                onClick={() => setTheme('dark')}
                            >
                                <Moon size={14} /> Oscuro
                            </button>
                            <button 
                                className={`btn ${theme === 'system' ? 'btn-primary' : 'btn-secondary'}`} 
                                onClick={() => setTheme('system')}
                            >
                                <Monitor size={14} /> Auto
                            </button>
                        </div>
                    </div>

                    <div>
                        <div className="form-label mb-3" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <Type size={16} /> Tamaño de Tipografía
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                            <button 
                                className={`btn ${fontSize === '14px' ? 'btn-primary' : 'btn-secondary'}`} 
                                onClick={() => setFontSize('14px')}
                            >
                                Pequeña
                            </button>
                            <button 
                                className={`btn ${fontSize === '16px' ? 'btn-primary' : 'btn-secondary'}`} 
                                onClick={() => setFontSize('16px')}
                            >
                                Normal
                            </button>
                            <button 
                                className={`btn ${fontSize === '18px' ? 'btn-primary' : 'btn-secondary'}`} 
                                onClick={() => setFontSize('18px')}
                            >
                                Grande
                            </button>
                        </div>
                        <p className="form-hint" style={{ marginTop: '12px' }}>
                            Ajustar el tamaño ampliará todos los textos de la interfaz para tu comodidad visual.
                        </p>
                    </div>
                </Modal>
            )}
        </>
    );
}
