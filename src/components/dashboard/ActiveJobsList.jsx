import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { formatMoney } from '../../data/store';

export default function ActiveJobsList({ jobs, clientsMap }) {
    if (jobs.length === 0) {
        return (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                <p>No hay trabajos activos</p>
            </div>
        );
    }

    return (
        <div className="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>Descripción</th>
                        <th>Estado</th>
                        <th className="text-right">Saldo</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {jobs.map(t => {
                        const cliente = clientsMap[t.cliente_id];
                        return (
                            <tr key={t.id}>
                                <td className="font-bold">{cliente?.nombre || '—'}</td>
                                <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {t.descripcion}
                                </td>
                                <td>
                                    <span className={`badge ${t.estado === 'pendiente' ? 'badge-amber' : t.estado === 'en_proceso' ? 'badge-blue' : 'badge-green'}`}>
                                        {t.estado === 'en_proceso' ? 'En Proceso' : t.estado.charAt(0).toUpperCase() + t.estado.slice(1)}
                                    </span>
                                </td>
                                <td className="text-right font-mono">RD$ {formatMoney(t.saldo_pendiente)}</td>
                                <td>
                                    <Link to={`/trabajos/${t.id}`} className="btn btn-sm btn-ghost">
                                        <ArrowRight size={14} />
                                    </Link>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
