import { useParams, Link } from 'react-router-dom';
import { getById, getAll, formatMoney, formatDateTime } from '../data/store';
import { ArrowLeft, Printer } from 'lucide-react';

export default function FacturaDetalle() {
    const { id } = useParams();
    const factura = getById('facturas', id);

    if (!factura) {
        return (
            <div className="empty-state">
                <p>Factura no encontrada</p>
                <Link to="/facturas" className="btn btn-secondary" style={{ marginTop: 'var(--space-4)' }}>
                    <ArrowLeft size={16} /> Volver
                </Link>
            </div>
        );
    }

    const detalles = getAll('detalle_factura').filter(d => d.factura_id === factura.id);
    const cliente = getById('clientes', factura.cliente_id);
    const usuario = getById('usuarios', factura.usuario_id);

    const handlePrint = () => window.print();

    return (
        <div>
            <div className="toolbar" style={{ marginBottom: 'var(--space-4)' }}>
                <Link to="/facturas" className="btn btn-secondary">
                    <ArrowLeft size={16} /> Volver
                </Link>
                <button className="btn btn-primary" onClick={handlePrint}>
                    <Printer size={16} /> Imprimir
                </button>
            </div>

            <div className="card">
                <div className="card-body">
                    <div className="invoice-print">
                        {/* Header */}
                        <div className="invoice-print-header">
                            <div className="invoice-company">
                                <h2>EMPRESA DE PROGRAMACION</h2>
                                <p>JRJ Centro de Copias y Servicios</p>
                                <p>San Fernando de Monte Cristi, R.D.</p>
                                <p style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                                    {formatDateTime(factura.fecha)}
                                </p>
                            </div>
                            <div className="invoice-meta">
                                <div className="invoice-number">{factura.numero_factura}</div>
                                <p>NCF: B0100000{factura.id}</p>
                                <p>TIPO DE COMP: <strong>CONSUMIDOR</strong></p>
                            </div>
                        </div>

                        {/* Client Info */}
                        <div className="invoice-info-grid">
                            <div className="invoice-info-block">
                                <h4>Cliente</h4>
                                <p className="font-bold">{cliente?.nombre || 'Consumidor Final'}</p>
                                {cliente?.telefono && <p>{cliente.telefono}</p>}
                                {cliente?.direccion && <p>{cliente.direccion}</p>}
                            </div>
                            <div className="invoice-info-block">
                                <h4>Facturado por</h4>
                                <p>{usuario?.nombre || '—'}</p>
                                <p style={{ marginTop: 'var(--space-2)' }}>
                                    <span className="badge badge-slate" style={{ textTransform: 'capitalize' }}>
                                        {factura.metodo_pago}
                                    </span>
                                    {' '}
                                    <span className={`badge ${factura.estado === 'pagada' ? 'badge-green' : factura.estado === 'anulada' ? 'badge-red' : 'badge-amber'}`} style={{ textTransform: 'capitalize' }}>
                                        {factura.estado}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Detail Table */}
                        <table>
                            <thead>
                                <tr>
                                    <th>CANTIDAD</th>
                                    <th>DESCRIPCIÓN</th>
                                    <th className="text-right">PRECIO</th>
                                    <th className="text-right">ITBIS</th>
                                    <th className="text-right">SUB TOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detalles.map((d, idx) => (
                                    <tr key={idx}>
                                        <td>{d.cantidad}</td>
                                        <td className="font-bold">{d.descripcion}</td>
                                        <td className="text-right font-mono">{formatMoney(d.precio_unitario)}</td>
                                        <td className="text-right font-mono">{formatMoney(d.precio_unitario * 0.18)}</td>
                                        <td className="text-right font-mono">{formatMoney(d.subtotal)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Totals */}
                        <div className="invoice-totals">
                            <table>
                                <tbody>
                                    <tr>
                                        <td className="text-muted">SUB TOTAL</td>
                                        <td className="text-right font-mono">{formatMoney(factura.subtotal)}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted">ITBIS</td>
                                        <td className="text-right font-mono">{formatMoney(factura.impuesto)}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>TOTAL</strong></td>
                                        <td className="text-right font-mono"><strong>RD$ {formatMoney(factura.total)}</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {factura.nota && (
                            <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-3) var(--space-4)', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)' }}>
                                <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>NOTA: </span>
                                <span style={{ fontSize: 'var(--text-sm)' }}>{factura.nota}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
