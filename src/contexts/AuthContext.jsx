import { createContext, useContext, useState, useEffect } from 'react';
import { authenticate } from '../data/store';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('jrj_session');
        return saved ? JSON.parse(saved) : null;
    });

    const login = async (usuario, password) => {
        const result = await authenticate(usuario, password);
        if (result.success) {
            setUser(result.user);
            localStorage.setItem('jrj_session', JSON.stringify(result.user));
        }
        return result;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('jrj_session');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
