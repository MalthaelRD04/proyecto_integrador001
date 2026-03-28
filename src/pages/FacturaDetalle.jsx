import { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { getById, getAll, formatMoney, formatDateTime } from '../data/store';
import Modal from '../components/Modal';
import { ArrowLeft, Printer, MessageCircle } from 'lucide-react';
import { generarPDFFactura } from '../utils/pdfGenerator';

export default function FacturaDetalle() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const factura = getById('facturas', id);
    const [modalPrint, setModalPrint] = useState(false);

    useEffect(() => {
        if (location.state?.autoPrint) {
            navigate(location.pathname, { replace: true, state: {} });
            setTimeout(() => {
                handlePrint('ticket');
            }, 300);
        }
    }, [location, navigate]);

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

    const handlePrint = (formato) => {
        setModalPrint(false);
        const printWindow = window.open('', '_blank');

        if (formato === 'ticket') {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Factura ${factura.numero_factura}</title>
                    <style>
                        @page { size: 80mm auto; margin: 0; }
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { font-family: 'Courier New', Courier, monospace; width: 80mm; padding: 4mm; color: #000; font-size: 10px; line-height: 1.4; }
                        .divider { border: none; border-top: 1px dashed #000; margin: 6px 0; }
                        .divider-double { border: none; border-top: 2px solid #000; margin: 6px 0; }
                        .header { text-align: center; margin-bottom: 6px; }
                        .header h1 { font-size: 13px; margin-bottom: 2px; font-weight: 900; }
                        .header p { font-size: 9px; }
                        .title { text-align: center; font-size: 11px; font-weight: 700; margin: 4px 0; }
                        .info-row { display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 1px; }
                        .info-row .label { font-weight: 700; }
                        .item-header { display: flex; justify-content: space-between; font-size: 8px; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; border-bottom: 1px solid #000; padding-bottom: 2px; }
                        .item-row { font-size: 9px; margin-bottom: 3px; }
                        .item-row .item-name { font-weight: 700; }
                        .item-row .item-details { display: flex; justify-content: space-between; font-size: 8px; color: #333; }
                        .total-line { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 1px; }
                        .total-line.grand { font-size: 13px; font-weight: 900; border-top: 2px solid #000; padding-top: 4px; margin-top: 4px; }
                        .footer { text-align: center; margin-top: 8px; font-size: 9px; }
                        .note { font-size: 8px; margin-top: 4px; padding: 3px; border: 1px dashed #000; }
                        @media print { body { width: 80mm; padding: 2mm; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>JRJ Centro de Copias</h1>
                        <p>y Servicios</p>
                        <p>San Fernando de Monte Cristi, R.D.</p>
                    </div>
                    <hr class="divider-double"/>
                    <div class="title">${factura.numero_factura}</div>
                    <div style="text-align:center; font-size:8px;">NCF: B0100000${factura.id}</div>
                    <div style="text-align:center; font-size:8px;">TIPO COMP: CONSUMIDOR</div>
                    <div style="text-align:center; font-size:8px;">${formatDateTime(factura.fecha)}</div>
                    <hr class="divider"/>
                    <div class="info-row"><span class="label">Cliente:</span><span>${cliente?.nombre || 'Consumidor Final'}</span></div>
                    ${cliente?.telefono ? `<div class="info-row"><span class="label">Tel:</span><span>${cliente.telefono}</span></div>` : ''}
                    ${cliente?.direccion ? `<div class="info-row"><span class="label">Dir:</span><span>${cliente.direccion}</span></div>` : ''}
                    <div class="info-row"><span class="label">Atendido por:</span><span>${usuario?.nombre || '—'}</span></div>
                    <div class="info-row"><span class="label">Método:</span><span style="text-transform:capitalize">${factura.metodo_pago}</span></div>
                    <div class="info-row"><span class="label">Estado:</span><span style="text-transform:uppercase; font-weight:700">${factura.estado}</span></div>
                    <hr class="divider"/>
                    <div class="item-header"><span>CANT - DESCRIPCION</span><span>SUBTOTAL</span></div>
                    ${detalles.map(d => `
                        <div class="item-row">
                            <div class="item-name">${d.cantidad}x ${d.descripcion}</div>
                            <div class="item-details">
                                <span>@ RD$${formatMoney(d.precio_unitario)} + ITBIS RD$${formatMoney(d.precio_unitario * 0.18)}</span>
                                <span>RD$${formatMoney(d.subtotal)}</span>
                            </div>
                        </div>
                    `).join('')}
                    <hr class="divider-double"/>
                    <div class="total-line"><span>Sub Total:</span><span>RD$ ${formatMoney(factura.subtotal)}</span></div>
                    <div class="total-line"><span>ITBIS:</span><span>RD$ ${formatMoney(factura.impuesto)}</span></div>
                    <div class="total-line grand"><span>TOTAL:</span><span>RD$ ${formatMoney(factura.total)}</span></div>
                    ${factura.nota ? `
                        <div class="note"><strong>NOTA:</strong> ${factura.nota}</div>
                    ` : ''}
                    <hr class="divider"/>
                    <div class="footer">
                        <p>Gracias por su preferencia</p>
                        <p>JRJ Centro de Copias y Servicios</p>
                    </div>
                </body>
                </html>
            `);
        } else {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Factura ${factura.numero_factura}</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1a1a2e; }
                        .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #1a1a2e; padding-bottom: 16px; }
                        .header h2 { font-size: 18px; margin-bottom: 4px; }
                        .header p { font-size: 12px; color: #666; }
                        .invoice-meta { text-align: right; margin-bottom: 20px; }
                        .invoice-number { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
                        .info-block h4 { font-size: 11px; text-transform: uppercase; color: #888; margin-bottom: 4px; }
                        .info-block p { font-size: 13px; margin-bottom: 2px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
                        th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #eee; }
                        th { background: #f0f0f0; font-size: 11px; text-transform: uppercase; color: #666; }
                        .text-right { text-align: right; }
                        .totals { margin-left: auto; width: 280px; }
                        .totals tr td { padding: 6px 12px; }
                        .totals .total-row { font-size: 16px; font-weight: 700; border-top: 2px solid #1a1a2e; }
                        .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #999; border-top: 1px solid #ddd; padding-top: 12px; }
                        .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: capitalize; }
                        .badge-green { background: #d4edda; color: #155724; }
                        .badge-red { background: #f8d7da; color: #721c24; }
                        .badge-amber { background: #fff3cd; color: #856404; }
                        .badge-slate { background: #e2e8f0; color: #475569; }
                        .note { margin-top: 20px; padding: 10px 14px; background: #f8f9fa; border-radius: 6px; font-size: 12px; }
                        @media print { body { padding: 15px; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>JRJ Centro de Copias y Servicios</h2>
                        <p>San Fernando de Monte Cristi, R.D.</p>
                        <p style="margin-top:4px; font-size:11px; color:#999;">${formatDateTime(factura.fecha)}</p>
                    </div>
                    <div class="invoice-meta">
                        <div class="invoice-number">${factura.numero_factura}</div>
                        <p style="font-size:12px;">NCF: B0100000${factura.id}</p>
                        <p style="font-size:12px;">TIPO DE COMP: <strong>CONSUMIDOR</strong></p>
                    </div>
                    <div class="info-grid">
                        <div class="info-block">
                            <h4>Cliente</h4>
                            <p style="font-weight:600">${cliente?.nombre || 'Consumidor Final'}</p>
                            ${cliente?.telefono ? `<p>${cliente.telefono}</p>` : ''}
                            ${cliente?.direccion ? `<p>${cliente.direccion}</p>` : ''}
                        </div>
                        <div class="info-block">
                            <h4>Facturado por</h4>
                            <p>${usuario?.nombre || '—'}</p>
                            <p style="margin-top:6px;">
                                <span class="badge badge-slate">${factura.metodo_pago}</span>
                                <span class="badge ${factura.estado === 'pagada' ? 'badge-green' : factura.estado === 'anulada' ? 'badge-red' : 'badge-amber'}">${factura.estado}</span>
                            </p>
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>CANTIDAD</th>
                                <th>DESCRIPCIÓN</th>
                                <th class="text-right">PRECIO</th>
                                <th class="text-right">ITBIS</th>
                                <th class="text-right">SUB TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${detalles.map(d => `
                                <tr>
                                    <td>${d.cantidad}</td>
                                    <td style="font-weight:600">${d.descripcion}</td>
                                    <td class="text-right" style="font-family:monospace">${formatMoney(d.precio_unitario)}</td>
                                    <td class="text-right" style="font-family:monospace">${formatMoney(d.precio_unitario * 0.18)}</td>
                                    <td class="text-right" style="font-family:monospace">${formatMoney(d.subtotal)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="totals">
                        <table>
                            <tbody>
                                <tr><td style="color:#888">SUB TOTAL</td><td class="text-right" style="font-family:monospace">${formatMoney(factura.subtotal)}</td></tr>
                                <tr><td style="color:#888">ITBIS</td><td class="text-right" style="font-family:monospace">${formatMoney(factura.impuesto)}</td></tr>
                                <tr class="total-row"><td><strong>TOTAL</strong></td><td class="text-right" style="font-family:monospace"><strong>RD$ ${formatMoney(factura.total)}</strong></td></tr>
                            </tbody>
                        </table>
                    </div>
                    ${factura.nota ? `<div class="note"><span style="color:#888; font-size:11px;">NOTA: </span>${factura.nota}</div>` : ''}
                    <div class="footer">
                        <p>Gracias por su preferencia</p>
                        <p>JRJ Centro de Copias y Servicios</p>
                    </div>
                </body>
                </html>
            `);
        }
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); }, 300);
    };

    return (
        <div>
            <div className="toolbar" style={{ marginBottom: 'var(--space-4)' }}>
                <Link to="/facturas" className="btn btn-secondary">
                    <ArrowLeft size={16} /> Volver
                </Link>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-success" style={{ backgroundColor: '#25D366', color: 'white', borderColor: '#25D366' }} onClick={() => generarPDFFactura(factura, cliente, usuario, detalles, 'download_and_whatsapp')}>
                        <MessageCircle size={16} /> WhatsApp
                    </button>
                    <button className="btn btn-primary" onClick={() => setModalPrint(true)}>
                        <Printer size={16} /> Imprimir
                    </button>
                </div>
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

            {/* Modal Formato Impresión */}
            {modalPrint && (
                <Modal
                    title="Seleccionar Formato de Impresión"
                    onClose={() => setModalPrint(false)}
                    footer={<button className="btn btn-secondary" onClick={() => setModalPrint(false)}>Cancelar</button>}
                >
                    <p style={{ marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' }}>¿Cómo desea imprimir el comprobante?</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        <button
                            className="btn btn-primary"
                            onClick={() => handlePrint('ticket')}
                            style={{ width: '100%', justifyContent: 'center', padding: 'var(--space-4)' }}
                        >
                            🧾 Ticket (Impresora Térmica 80mm)
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => handlePrint('recibo')}
                            style={{ width: '100%', justifyContent: 'center', padding: 'var(--space-4)' }}
                        >
                            📄 Recibo (Hoja Completa)
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
