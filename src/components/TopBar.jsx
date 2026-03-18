import { useAuth } from '../contexts/AuthContext';
import { Bell, LogOut } from 'lucide-react';

export default function TopBar({ title }) {
    const { user, logout } = useAuth();

    return (
        <header className="topbar">
            <h1 className="topbar-title">{title}</h1>
            <div className="topbar-right">
                <div className="topbar-user">
                    <div className="topbar-avatar">
                        {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span>{user?.nombre || 'Usuario'}</span>
                </div>
                <button className="btn btn-icon btn-ghost btn-sm" onClick={logout} title="Cerrar sesión">
                    <LogOut size={16} />
                </button>
            </div>
        </header>
    );
}
