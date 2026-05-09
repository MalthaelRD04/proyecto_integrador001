import { useState, useEffect } from 'react';
import { getById, getAll } from '../data/store';

export function useTrabajo(id) {
    const [trabajo, setTrabajo] = useState(null);
    const [cliente, setCliente] = useState(null);
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const t = await getById('trabajos', id);
                if (t) {
                    setTrabajo(t);
                    if (t.cliente_id) setCliente(await getById('clientes', t.cliente_id));
                    if (t.usuario_id) setUsuario(await getById('usuarios', t.usuario_id));
                }
            } catch (err) {
                console.error("Error cargando trabajo:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id, refresh]);

    return { trabajo, cliente, usuario, loading, refresh, triggerRefresh: () => setRefresh(prev => prev + 1) };
}

export function useAbonos(trabajoId) {
    const [abonos, setAbonos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        async function load() {
            if (!trabajoId) return;
            setLoading(true);
            try {
                const allAbonos = await getAll('abonos_trabajo');
                setAbonos(allAbonos.filter(a => a.trabajo_id === Number(trabajoId)));
            } catch (err) {
                console.error("Error cargando abonos:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [trabajoId, refresh]);

    return { abonos, loading, refresh, triggerRefresh: () => setRefresh(prev => prev + 1) };
}
