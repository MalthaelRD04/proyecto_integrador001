import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAll, getById, formatMoney, formatDateTime } from '../data/store';
import { Search, Eye, FileText } from 'lucide-react';

export default function Facturas() {
    const [facturas, setFacturas] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        setFacturas(getAll('facturas').reverse());
    }, []);

    const filtered = facturas.filter(f =>
        f.numero_factura.toLowerCase().includes(search.toLowerCase()) ||
        (getById('clientes', f.cliente_id)?.nombre || '').toLowerCase().includes(search.toLowerCase())
    );

    const estadoClass = (e) => {
        if (e === 'pagada') return 'badge-green';
        if (e === 'pendiente') return 'badge-amber';
        if (e === 'anulada') return 'badge-red';
        return 'badge-slate';
    };

    return (
        <div>
            <div className="toolbar">
                <div className="toolbar-left">
                    <div className="search-input-wrapper">
                        <Search size={16} />
                        <input type="text" className="form-input" placeholder="Buscar por número o cliente..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
                <Link to="/facturacion" className="btn btn-primary">
                    <FileText size={16} /> Nueva Factura
                </Link>
            </div>

            <div className="card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>N° Factura</th>
                                <th>Cliente</th>
                                <th>Fecha</th>
                                <th>Método</th>
                                <th>Estado</th>
                                <th className="text-right">Total</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(f => {
                                const cliente = getById('clientes', f.cliente_id);
                                return (
                                    <tr key={f.id}>
                                        <td className="font-bold font-mono">{f.numero_factura}</td>
                                        <td>{cliente?.nombre || 'Consumidor Final'}</td>
                                        <td className="text-muted">{formatDateTime(f.fecha)}</td>
                                        <td>
                                            <span className="badge badge-slate" style={{ textTransform: 'capitalize' }}>
                                                {f.metodo_pago}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${estadoClass(f.estado)}`} style={{ textTransform: 'capitalize' }}>
                                                {f.estado}
                                            </span>
                                        </td>
                                        <td className="text-right font-mono font-bold">RD$ {formatMoney(f.total)}</td>
                                        <td>
                                            <Link to={`/facturas/${f.id}`} className="btn btn-sm btn-ghost">
                                                <Eye size={14} /> Ver
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr><td colSpan={7} className="text-center text-muted" style={{ padding: 'var(--space-8)' }}>No se encontraron facturas</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
