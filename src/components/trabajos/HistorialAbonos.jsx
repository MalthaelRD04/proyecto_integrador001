import React from 'react';
import { formatDateTime, formatMoney } from '../../data/store';

export default function HistorialAbonos({ abonos }) {
    if (!abonos || abonos.length === 0) {
        return (
            <div className="card">
                <div className="card-header">
                    <span className="card-title">Historial de Abonos</span>
                </div>
                <div className="card-body">
                    <div className="text-center text-muted" style={{ padding: 'var(--space-8)' }}>
                        No hay abonos registrados
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <span className="card-title">Historial de Abonos</span>
            </div>
            <div className="card-body">
                <table className="table table-sm">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Método</th>
                            <th className="text-right">Monto</th>
                            <th>Nota</th>
                        </tr>
                    </thead>
                    <tbody>
                        {abonos.map(a => (
                            <tr key={a.id}>
                                <td className="text-muted">{formatDateTime(a.fecha)}</td>
                                <td><span className="badge badge-slate" style={{ textTransform: 'capitalize' }}>{a.metodo_pago}</span></td>
                                <td className="text-right font-mono font-bold" style={{ color: 'var(--color-success)' }}>
                                    +RD$ {formatMoney(a.monto)}
                                </td>
                                <td className="text-muted">{a.nota || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
