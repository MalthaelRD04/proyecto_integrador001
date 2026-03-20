import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getById, getAll, update, registrarAbono, formatMoney, formatDate, formatDateTime } from '../data/store';
import Modal from '../components/Modal';
import { ArrowLeft, Plus, DollarSign, Calendar, User, AlertCircle, CheckCircle, Printer, MessageCircle } from 'lucide-react';

export default function TrabajoDetalle() {
    const { id } = useParams();
    const [refresh, setRefresh] = useState(0);
    const [modalAbono, setModalAbono] = useState(false);
    const [abonoForm, setAbonoForm] = useState({ monto: '', metodo_pago: 'efectivo', nota: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const trabajo = getById('trabajos', id);
    const abonos = getAll('abonos_trabajo').filter(a => a.trabajo_id === Number(id));

    if (!trabajo) {
        return (
            <div className="empty-state">
                <p>Trabajo no encontrado</p>
                <Link to="/trabajos" className="btn btn-secondary" style={{ marginTop: 'var(--space-4)' }}>
                    <ArrowLeft size={16} /> Volver
                </Link>
            </div>
        );
    }

    const cliente = getById('clientes', trabajo.cliente_id);
    const usuario = getById('usuarios', trabajo.usuario_id);

    const generateInvoiceText = (t, cli, abonosList) => {
        const neto = Number(t.precio_total) - Number(t.monto_descuento);
        let text = `📋 *FACTURA DE TRABAJO MANUAL*\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `🏢 *JRJ Centro de Copias y Servicios*\n`;
        text += `📍 San Fernando de Monte Cristi, R.D.\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
        text += `👤 *Cliente:* ${cli?.nombre || 'Sin cliente'}\n`;
        if (cli?.telefono) text += `📞 *Teléfono:* ${cli.telefono}\n`;
        if (cli?.direccion) text += `📍 *Dirección:* ${cli.direccion}\n`;
        text += `\n📝 *Descripción:*\n${t.descripcion}\n\n`;
        text += `📅 *Fecha Recibido:* ${formatDate(t.fecha_recibido)}\n`;
        text += `📅 *Entrega Estimada:* ${formatDate(t.fecha_entrega_estimada)}\n`;
        if (t.fecha_entrega_real) text += `✅ *Entrega Real:* ${formatDate(t.fecha_entrega_real)}\n`;
        text += `\n━━━━━━━━━━━━━━━━━━━━\n`;
        text += `💰 *RESUMEN FINANCIERO*\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `   Precio Total:  RD$ ${formatMoney(t.precio_total)}\n`;
        if (t.tiene_descuento) text += `   Descuento:    -RD$ ${formatMoney(t.monto_descuento)}\n`;
        text += `   Total Abonado:  RD$ ${formatMoney(t.total_abonado)}\n`;
        text += `   *Saldo Pendiente: RD$ ${formatMoney(t.saldo_pendiente)}*\n\n`;
        if (abonosList.length > 0) {
            text += `📜 *HISTORIAL DE ABONOS*\n`;
            text += `━━━━━━━━━━━━━━━━━━━━\n`;
            abonosList.forEach((a, i) => {
                text += `${i + 1}. RD$ ${formatMoney(a.monto)} - ${a.metodo_pago} (${formatDate(a.fecha)})\n`;
            });
        }
        text += `\n✨ _Gracias por su preferencia_`;
        return text;
    };

    const handlePrint = () => {
        const t = getById('trabajos', id);
        const cli = getById('clientes', t.cliente_id);
        const usr = getById('usuarios', t.usuario_id);
        const abonosList = getAll('abonos_trabajo').filter(a => a.trabajo_id === Number(id));
        const neto = Number(t.precio_total) - Number(t.monto_descuento);

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Factura Trabajo #${t.id}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1a1a2e; }
                    .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #1a1a2e; padding-bottom: 16px; }
                    .header h1 { font-size: 20px; margin-bottom: 4px; }
                    .header p { font-size: 12px; color: #666; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
                    .info-block h4 { font-size: 11px; text-transform: uppercase; color: #888; margin-bottom: 4px; }
                    .info-block p { font-size: 13px; margin-bottom: 2px; }
                    .description { background: #f5f5f5; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-size: 13px; }
                    .description label { font-size: 11px; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
                    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #eee; }
                    th { background: #f0f0f0; font-size: 11px; text-transform: uppercase; color: #666; }
                    .text-right { text-align: right; }
                    .totals { margin-left: auto; width: 280px; }
                    .totals tr td { padding: 6px 12px; }
                    .totals .total-row { font-size: 16px; font-weight: 700; border-top: 2px solid #1a1a2e; }
                    .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #999; border-top: 1px solid #ddd; padding-top: 12px; }
                    .estado { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
                    .estado-pendiente { background: #fff3cd; color: #856404; }
                    .estado-en_proceso { background: #cce5ff; color: #004085; }
                    .estado-entregado { background: #d4edda; color: #155724; }
                    .estado-cancelado { background: #f8d7da; color: #721c24; }
                    @media print { body { padding: 15px; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>JRJ Centro de Copias y Servicios</h1>
                    <p>San Fernando de Monte Cristi, R.D.</p>
                    <p style="margin-top:8px; font-size:14px; font-weight:600;">FACTURA DE TRABAJO MANUAL #${t.id}</p>
                </div>
                <div class="info-grid">
                    <div class="info-block">
                        <h4>Cliente</h4>
                        <p style="font-weight:600">${cli?.nombre || 'Sin cliente'}</p>
                        ${cli?.telefono ? `<p>${cli.telefono}</p>` : ''}
                        ${cli?.direccion ? `<p>${cli.direccion}</p>` : ''}
                    </div>
                    <div class="info-block">
                        <h4>Información del Trabajo</h4>
                        <p>Registrado por: ${usr?.nombre || '—'}</p>
                        <p>Estado: <span class="estado estado-${t.estado}">${t.estado.replace('_', ' ')}</span></p>
                    </div>
                </div>
                <div class="info-grid">
                    <div class="info-block">
                        <h4>Fecha Recibido</h4>
                        <p>${formatDate(t.fecha_recibido)}</p>
                    </div>
                    <div class="info-block">
                        <h4>Entrega Estimada</h4>
                        <p>${formatDate(t.fecha_entrega_estimada)}</p>
                    </div>
                </div>
                <div class="description">
                    <label>Descripción del Trabajo</label>
                    ${t.descripcion}
                </div>
                ${abonosList.length > 0 ? `
                    <h4 style="font-size:12px; margin-bottom:8px; color:#666; text-transform:uppercase;">Historial de Abonos</h4>
                    <table>
                        <thead><tr><th>Fecha</th><th>Método</th><th class="text-right">Monto</th><th>Nota</th></tr></thead>
                        <tbody>
                            ${abonosList.map(a => `
                                <tr>
                                    <td>${formatDateTime(a.fecha)}</td>
                                    <td style="text-transform:capitalize">${a.metodo_pago}</td>
                                    <td class="text-right" style="font-weight:600; color:#16a34a;">+RD$ ${formatMoney(a.monto)}</td>
                                    <td>${a.nota || '—'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : ''}
                <div class="totals">
                    <table>
                        <tbody>
                            <tr><td>Precio Total</td><td class="text-right">RD$ ${formatMoney(t.precio_total)}</td></tr>
                            ${t.tiene_descuento ? `<tr><td style="color:#16a34a">Descuento</td><td class="text-right" style="color:#16a34a">-RD$ ${formatMoney(t.monto_descuento)}</td></tr>` : ''}
                            <tr><td>Total Abonado</td><td class="text-right" style="color:#16a34a">RD$ ${formatMoney(t.total_abonado)}</td></tr>
                            <tr class="total-row">
                                <td>Saldo Pendiente</td>
                                <td class="text-right" style="color:${t.saldo_pendiente > 0 ? '#dc2626' : '#16a34a'}">
                                    RD$ ${formatMoney(t.saldo_pendiente)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="footer">
                    <p>Gracias por su preferencia</p>
                    <p>JRJ Centro de Copias y Servicios</p>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); }, 300);
    };

    const handleWhatsApp = () => {
        const t = getById('trabajos', id);
        const cli = getById('clientes', t.cliente_id);
        const abonosList = getAll('abonos_trabajo').filter(a => a.trabajo_id === Number(id));
        const text = generateInvoiceText(t, cli, abonosList);
        let phone = cli?.telefono?.replace(/[^0-9]/g, '') || '';
        if (phone && !phone.startsWith('1') && !phone.startsWith('52')) {
            phone = '1' + phone;
        }
        const url = phone
            ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
            : `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const estadoBadge = (estado) => {
        const map = { pendiente: 'badge-amber', en_proceso: 'badge-blue', entregado: 'badge-green', cancelado: 'badge-red' };
        return map[estado] || 'badge-slate';
    };

    const estadoLabel = (estado) => {
        const map = { pendiente: 'Pendiente', en_proceso: 'En Proceso', entregado: 'Entregado', cancelado: 'Cancelado' };
        return map[estado] || estado;
    };

    const cambiarEstado = (nuevoEstado) => {
        update('trabajos', trabajo.id, {
            estado: nuevoEstado,
            ...(nuevoEstado === 'entregado' ? { fecha_entrega_real: new Date().toISOString() } : {}),
        });
        setRefresh(r => r + 1);
    };

    const handleAbono = () => {
        const result = registrarAbono(trabajo.id, abonoForm.monto, abonoForm.metodo_pago, abonoForm.nota);
        if (result.error) {
            setError(result.error);
            setTimeout(() => setError(''), 3000);
            return;
        }
        setSuccess('Abono registrado exitosamente');
        setTimeout(() => setSuccess(''), 3000);
        setModalAbono(false);
        setAbonoForm({ monto: '', metodo_pago: 'efectivo', nota: '' });
        setRefresh(r => r + 1);
    };

    // Re-read after state changes
    const currentTrabajo = getById('trabajos', id);
    const currentAbonos = getAll('abonos_trabajo').filter(a => a.trabajo_id === Number(id));

    return (
        <div>
            {error && <div className="alert alert-danger"><AlertCircle size={16} />{error}</div>}
            {success && <div className="alert alert-success"><CheckCircle size={16} />{success}</div>}

            <div className="toolbar" style={{ marginBottom: 'var(--space-4)' }}>
                <Link to="/trabajos" className="btn btn-secondary">
                    <ArrowLeft size={16} /> Volver
                </Link>
                <div className="flex gap-2">
                    {currentTrabajo.estado !== 'entregado' && currentTrabajo.estado !== 'cancelado' && (
                        <>
                            {currentTrabajo.estado === 'pendiente' && (
                                <button className="btn btn-primary btn-sm" onClick={() => cambiarEstado('en_proceso')}>
                                    Marcar En Proceso
                                </button>
                            )}
                            {currentTrabajo.saldo_pendiente > 0 && (
                                <button className="btn btn-success btn-sm" onClick={() => setModalAbono(true)}>
                                    <Plus size={14} /> Registrar Abono
                                </button>
                            )}
                            <button className="btn btn-sm btn-secondary" onClick={() => cambiarEstado('entregado')}>
                                Marcar Entregado
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-4)' }}>
                {/* Left - Work details */}
                <div>
                    <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                        <div className="card-header">
                            <span className="card-title">Detalles del Trabajo</span>
                            <span className={`badge ${estadoBadge(currentTrabajo.estado)}`}>
                                {estadoLabel(currentTrabajo.estado)}
                            </span>
                        </div>
                        <div className="card-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                                <div>
                                    <div className="text-small" style={{ marginBottom: 4 }}>
                                        <User size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> CLIENTE
                                    </div>
                                    <div className="font-bold">{cliente?.nombre || '—'}</div>
                                    {cliente?.telefono && <div className="text-muted">{cliente.telefono}</div>}
                                </div>
                                <div>
                                    <div className="text-small" style={{ marginBottom: 4 }}>REGISTRADO POR</div>
                                    <div>{usuario?.nombre || '—'}</div>
                                </div>
                            </div>

                            <div style={{ marginBottom: 'var(--space-4)' }}>
                                <div className="text-small" style={{ marginBottom: 4 }}>DESCRIPCIÓN</div>
                                <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)' }}>
                                    {currentTrabajo.descripcion}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
                                <div>
                                    <div className="text-small" style={{ marginBottom: 4 }}>
                                        <Calendar size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> RECIBIDO
                                    </div>
                                    <div>{formatDate(currentTrabajo.fecha_recibido)}</div>
                                </div>
                                <div>
                                    <div className="text-small" style={{ marginBottom: 4 }}>ENTREGA ESTIMADA</div>
                                    <div>{formatDate(currentTrabajo.fecha_entrega_estimada)}</div>
                                </div>
                                <div>
                                    <div className="text-small" style={{ marginBottom: 4 }}>ENTREGA REAL</div>
                                    <div>{currentTrabajo.fecha_entrega_real ? formatDate(currentTrabajo.fecha_entrega_real) : '—'}</div>
                                </div>
                            </div>

                            {currentTrabajo.nota && (
                                <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', background: 'var(--amber-50)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
                                    <strong>Nota:</strong> {currentTrabajo.nota}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Abonos History */}
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">Historial de Abonos ({currentAbonos.length})</span>
                        </div>
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Método</th>
                                        <th className="text-right">Monto</th>
                                        <th>Nota</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentAbonos.map(a => (
                                        <tr key={a.id}>
                                            <td className="text-muted">{formatDateTime(a.fecha)}</td>
                                            <td><span className="badge badge-slate" style={{ textTransform: 'capitalize' }}>{a.metodo_pago}</span></td>
                                            <td className="text-right font-mono font-bold" style={{ color: 'var(--color-success)' }}>
                                                +RD$ {formatMoney(a.monto)}
                                            </td>
                                            <td className="text-muted">{a.nota || '—'}</td>
                                        </tr>
                                    ))}
                                    {currentAbonos.length === 0 && (
                                        <tr><td colSpan={4} className="text-center text-muted" style={{ padding: 'var(--space-8)' }}>No hay abonos registrados</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right - Financial Summary */}
                <div>
                    <div className="card" style={{ position: 'sticky', top: 'calc(var(--topbar-height) + var(--space-6))' }}>
                        <div className="card-header">
                            <span className="card-title">Resumen Financiero</span>
                        </div>
                        <div className="card-body">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                                <span className="text-muted">Precio Total</span>
                                <span className="font-mono">RD$ {formatMoney(currentTrabajo.precio_total)}</span>
                            </div>
                            {currentTrabajo.tiene_descuento && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)', color: 'var(--color-success)' }}>
                                    <span>Descuento</span>
                                    <span className="font-mono">- RD$ {formatMoney(currentTrabajo.monto_descuento)}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                                <span className="text-muted">Total Abonado</span>
                                <span className="font-mono" style={{ color: 'var(--color-success)' }}>RD$ {formatMoney(currentTrabajo.total_abonado)}</span>
                            </div>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between',
                                padding: 'var(--space-4) 0', marginTop: 'var(--space-2)',
                                borderTop: '2px solid var(--border-strong)',
                                fontSize: 'var(--text-xl)', fontWeight: 700,
                            }}>
                                <span>Saldo</span>
                                <span className="font-mono" style={{ color: currentTrabajo.saldo_pendiente > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                                    RD$ {formatMoney(currentTrabajo.saldo_pendiente)}
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div style={{ marginTop: 'var(--space-4)' }}>
                                <div className="text-small" style={{ marginBottom: 4 }}>Progreso de Pago</div>
                                <div style={{ height: 8, background: 'var(--slate-100)', borderRadius: 4, overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${(currentTrabajo.precio_total - currentTrabajo.monto_descuento) > 0 ? Math.min(100, (currentTrabajo.total_abonado / (currentTrabajo.precio_total - currentTrabajo.monto_descuento)) * 100) : 0}%`,
                                        background: currentTrabajo.saldo_pendiente <= 0 ? 'var(--color-success)' : 'var(--color-primary)',
                                        borderRadius: 4,
                                        transition: 'width var(--transition-slow)',
                                    }} />
                                </div>
                                <div className="text-small" style={{ marginTop: 4, textAlign: 'right' }}>
                                    {(currentTrabajo.precio_total - currentTrabajo.monto_descuento) > 0 ? Math.min(100, Math.round((currentTrabajo.total_abonado / (currentTrabajo.precio_total - currentTrabajo.monto_descuento)) * 100)) : 0}%
                                </div>
                            </div>

                            {/* Botones de Factura */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-5)' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={handlePrint}
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    <Printer size={16} /> Imprimir Factura
                                </button>
                                <button
                                    className="btn btn-success"
                                    onClick={handleWhatsApp}
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    <MessageCircle size={16} /> Enviar por WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Abono */}
            {modalAbono && (
                <Modal
                    title="Registrar Abono"
                    onClose={() => setModalAbono(false)}
                    footer={<><button className="btn btn-secondary" onClick={() => setModalAbono(false)}>Cancelar</button><button className="btn btn-success" onClick={handleAbono}>Registrar Abono</button></>}
                >
                    <div className="alert alert-warning" style={{ marginBottom: 'var(--space-4)' }}>
                        <DollarSign size={16} />
                        Saldo pendiente: <strong>RD$ {formatMoney(currentTrabajo.saldo_pendiente)}</strong>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Monto del Abono (RD$) *</label>
                        <input
                            type="number" step="0.01" className="form-input"
                            value={abonoForm.monto}
                            onChange={e => setAbonoForm({ ...abonoForm, monto: e.target.value })}
                            placeholder="0.00"
                            max={currentTrabajo.saldo_pendiente}
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Método de Pago</label>
                        <select className="form-select" value={abonoForm.metodo_pago} onChange={e => setAbonoForm({ ...abonoForm, metodo_pago: e.target.value })}>
                            <option value="efectivo">Efectivo</option>
                            <option value="tarjeta">Tarjeta</option>
                            <option value="transferencia">Transferencia</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Nota</label>
                        <input className="form-input" value={abonoForm.nota} onChange={e => setAbonoForm({ ...abonoForm, nota: e.target.value })} placeholder="Observación (opcional)" />
                    </div>
                </Modal>
            )}
        </div>
    );
}
