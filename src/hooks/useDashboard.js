import { useState, useEffect } from 'react';
import { getDashboardStats, getById } from '../data/store';

export function useDashboard() {
    const [stats, setStats] = useState(null);
    const [clientesMap, setClientesMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const s = await getDashboardStats();
                setStats(s);
                
                if (s.ultimosTrabajos && s.ultimosTrabajos.length > 0) {
                    const map = {};
                    for (const t of s.ultimosTrabajos) {
                        if (t.cliente_id && !map[t.cliente_id]) {
                            const c = await getById('clientes', t.cliente_id);
                            map[t.cliente_id] = c;
                        }
                    }
                    setClientesMap(map);
                }
            } catch (err) {
                console.error("Error cargando dashboard:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [refresh]);

    return { 
        stats, 
        clientesMap, 
        loading, 
        triggerRefresh: () => setRefresh(prev => prev + 1) 
    };
}
