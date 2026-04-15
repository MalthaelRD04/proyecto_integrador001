import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getById, getAll, update, registrarAbono, formatMoney, formatDate, formatDateTime, guardarTrabajoComoFactura } from '../data/store';
import Modal from '../components/Modal';
import { ArrowLeft, Plus, DollarSign, Calendar, User, AlertCircle, CheckCircle, Printer, MessageCircle, Save, X, Send, FileText } from 'lucide-react';
import { generarPDFTrabajo } from '../utils/pdfGenerator';
import { open as shellOpen } from '@tauri-apps/plugin-shell';

export default function TrabajoDetalle() {
    const { id } = useParams();
    const [refresh, setRefresh] = useState(0);
    const [modalAbono, setModalAbono] = useState(false);
    const [abonoForm, setAbonoForm] = useState({ monto: '', metodo_pago: 'efectivo', nota: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [modalPrint, setModalPrint] = useState(false);
    const [modalWhatsApp, setModalWhatsApp] = useState(false);
    const [whatsAppStep, setWhatsAppStep] = useState('idle'); // idle | sending | sent | saving | saved
    const [facturaGuardada, setFacturaGuardada] = useState(null);

    const [trabajo, setTrabajo] = useState(null);
    const [cliente, setCliente] = useState(null);
    const [usuario, setUsuario] = useState(null);
    const [abonosList, setAbonosList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const t = await getById('trabajos', id);
            if (t) {
                setTrabajo(t);
                if (t.cliente_id) setCliente(await getById('clientes', t.cliente_id));
                if (t.usuario_id) setUsuario(await getById('usuarios', t.usuario_id));
                const allAbonos = await getAll('abonos_trabajo');
                setAbonosList(allAbonos.filter(a => a.trabajo_id === Number(id)));
            }
            setLoading(false);
        }
        load();
    }, [id, refresh]);

    if (loading) return <div style={{ padding: 'var(--space-8)' }}>Cargando...</div>;

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

    const currentTrabajo = trabajo;
    const currentAbonos = abonosList;

    const appUbicacion = localStorage.getItem('app_ubicacion') || 'San Fernando de Monte Cristi, R.D.';

    const handlePrint = (formato) => {
        setModalPrint(false);
        const t = currentTrabajo;
        const cli = cliente;
        const usr = usuario;
        const neto = Number(t.precio_total) - Number(t.monto_descuento);

        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const printWindow = iframe.contentWindow;

        if (formato === 'ticket') {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Factura Trabajo #${t.id}</title>
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
                        .section-title { font-size: 9px; font-weight: 700; text-transform: uppercase; margin: 6px 0 3px 0; }
                        .description { font-size: 9px; padding: 3px 0; word-wrap: break-word; }
                        .abono-item { font-size: 9px; margin-bottom: 2px; }
                        .total-line { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 1px; }
                        .total-line.grand { font-size: 13px; font-weight: 900; border-top: 2px solid #000; padding-top: 4px; margin-top: 4px; }
                        .footer { text-align: center; margin-top: 8px; font-size: 9px; }
                        .estado { font-weight: 700; text-transform: uppercase; }
                        @media print { body { width: 80mm; padding: 2mm; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>JRJ Centro de Copias</h1>
                        <p>y Servicios</p>
                        <p>${appUbicacion}</p>
                    </div>
                    <hr class="divider-double"/>
                    <div class="title">FACTURA TRABAJO #${t.id}</div>
                    <hr class="divider"/>
                    <div class="info-row"><span class="label">Cliente:</span><span>${cli?.nombre || 'Sin cliente'}</span></div>
                    ${cli?.telefono ? `<div class="info-row"><span class="label">Tel:</span><span>${cli.telefono}</span></div>` : ''}
                    ${cli?.direccion ? `<div class="info-row"><span class="label">Dir:</span><span>${cli.direccion}</span></div>` : ''}
                    <div class="info-row"><span class="label">Atendido por:</span><span>${usr?.nombre || '—'}</span></div>
                    <div class="info-row"><span class="label">Estado:</span><span class="estado">${t.estado.replace('_', ' ')}</span></div>
                    <hr class="divider"/>
                    <div class="info-row"><span class="label">Recibido:</span><span>${formatDate(t.fecha_recibido)}</span></div>
                    <div class="info-row"><span class="label">Entrega Est.:</span><span>${formatDate(t.fecha_entrega_estimada)}</span></div>
                    ${t.fecha_entrega_real ? `<div class="info-row"><span class="label">Entrega Real:</span><span>${formatDate(t.fecha_entrega_real)}</span></div>` : ''}
                    <hr class="divider"/>
                    <div class="section-title">Descripcion</div>
                    <div class="description">${t.descripcion}</div>
                    ${abonosList.length > 0 ? `
                        <hr class="divider"/>
                        <div class="section-title">Historial de Abonos</div>
                        ${abonosList.map((a, i) => `
                            <div class="abono-item">${i + 1}. RD$${formatMoney(a.monto)} - ${a.metodo_pago} (${formatDate(a.fecha)})${a.nota ? ' - ' + a.nota : ''}</div>
                        `).join('')}
                    ` : ''}
                    <hr class="divider-double"/>
                    <div class="total-line"><span>Precio Total:</span><span>RD$ ${formatMoney(t.precio_total)}</span></div>
                    ${t.tiene_descuento ? `<div class="total-line"><span>Descuento:</span><span>-RD$ ${formatMoney(t.monto_descuento)}</span></div>` : ''}
                    <div class="total-line"><span>Total Abonado:</span><span>RD$ ${formatMoney(t.total_abonado)}</span></div>
                    <div class="total-line grand"><span>SALDO:</span><span>RD$ ${formatMoney(t.saldo_pendiente)}</span></div>
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
                        <p>${appUbicacion}</p>
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
        }
        printWindow.document.close();
        
        setTimeout(() => { 
            printWindow.focus();
            printWindow.print(); 
            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }, 1000);
        }, 500);
    };

    const handleWhatsApp = () => {
        setWhatsAppStep('idle');
        setFacturaGuardada(null);
        setModalWhatsApp(true);
    };

    const handleEnviarWhatsApp = () => {
        const t = currentTrabajo;
        const cli = cliente;
        const usr = usuario;

        setWhatsAppStep('sending');

        // Preparar mensaje de WhatsApp
        const neto = Number(t.precio_total) - Number(t.monto_descuento || 0);
        const mensaje = encodeURIComponent(
            `Hola ${cli?.nombre || 'estimado cliente'}, le enviamos el resumen de su trabajo #${t.id} de JRJ Centro de Copias y Servicios:\n\n` +
            `📋 Descripción: ${t.descripcion}\n` +
            `💰 Total: RD$ ${formatMoney(t.precio_total)}` +
            (t.tiene_descuento ? `\n🎁 Descuento: -RD$ ${formatMoney(t.monto_descuento)}` : '') +
            `\n✅ Abonado: RD$ ${formatMoney(t.total_abonado)}` +
            `\n⏳ Saldo: RD$ ${formatMoney(t.saldo_pendiente)}` +
            `\n\nGracias por preferirnos. 🙏`
        );

        let telefono = cli?.telefono ? cli.telefono.replace(/\D/g, '') : '';
        if (telefono && !telefono.startsWith('1') && !telefono.startsWith('52')) {
            telefono = '1' + telefono;
        }
        const url = telefono
            ? `https://wa.me/${telefono}?text=${mensaje}`
            : `https://wa.me/?text=${mensaje}`;

        setTimeout(() => {
            shellOpen(url).catch(err => window.open(url, '_blank'));
            setWhatsAppStep('sent');
        }, 800);
    };

    const handleGuardarFactura = async () => {
        setWhatsAppStep('saving');
        try {
            const factura = await guardarTrabajoComoFactura(currentTrabajo);
            setFacturaGuardada(factura);
            setWhatsAppStep('saved');
            setSuccess('✅ Factura guardada en el sistema exitosamente');
            setTimeout(() => setSuccess(''), 4000);
            setRefresh(r => r + 1);
        } catch (e) {
            setError('Error al guardar la factura: ' + e.message);
            setTimeout(() => setError(''), 4000);
            setWhatsAppStep('sent');
        }
    };

    const estadoBadge = (estado) => {
        const map = { pendiente: 'badge-amber', en_proceso: 'badge-blue', entregado: 'badge-green', cancelado: 'badge-red' };
        return map[estado] || 'badge-slate';
    };

    const estadoLabel = (estado) => {
        const map = { pendiente: 'Pendiente', en_proceso: 'En Proceso', entregado: 'Entregado', cancelado: 'Cancelado' };
        return map[estado] || estado;
    };

    const cambiarEstado = async (nuevoEstado) => {
        await update('trabajos', currentTrabajo.id, {
            estado: nuevoEstado,
            ...(nuevoEstado === 'entregado' ? { fecha_entrega_real: new Date().toISOString() } : {}),
        });
        setRefresh(r => r + 1);
    };

    const handleAbono = async () => {
        const result = await registrarAbono(currentTrabajo.id, abonoForm.monto, abonoForm.metodo_pago, abonoForm.nota);
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

            <div className="facturacion-layout">
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
                                    onClick={() => setModalPrint(true)}
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

            {/* Modal WhatsApp */}
            {modalWhatsApp && (
                <Modal
                    title="Enviar Comprobante por WhatsApp"
                    onClose={() => { setModalWhatsApp(false); setWhatsAppStep('idle'); }}
                    footer={
                        whatsAppStep === 'idle' ? (
                            <>
                                <button className="btn btn-secondary" onClick={() => { setModalWhatsApp(false); setWhatsAppStep('idle'); }}>
                                    <X size={14} /> Cancelar
                                </button>
                                <button className="btn btn-success" onClick={handleEnviarWhatsApp}>
                                    <Send size={14} /> Enviar por WhatsApp
                                </button>
                            </>
                        ) : whatsAppStep === 'sending' ? (
                            <button className="btn btn-secondary" disabled>Enviando...</button>
                        ) : whatsAppStep === 'sent' ? (
                            <>
                                <button className="btn btn-secondary" onClick={() => { setModalWhatsApp(false); setWhatsAppStep('idle'); }}>
                                    <X size={14} /> Cerrar
                                </button>
                                <button className="btn btn-primary" onClick={handleGuardarFactura}>
                                    <Save size={14} /> Sí, guardar en el sistema
                                </button>
                            </>
                        ) : whatsAppStep === 'saving' ? (
                            <button className="btn btn-secondary" disabled>Guardando...</button>
                        ) : (
                            <button className="btn btn-success" onClick={() => { setModalWhatsApp(false); setWhatsAppStep('idle'); }}>
                                <CheckCircle size={14} /> Listo
                            </button>
                        )
                    }
                >
                    {/* Paso: idle — confirmar envío */}
                    {whatsAppStep === 'idle' && (
                        <div>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                                padding: 'var(--space-4)', background: '#f0fdf4',
                                border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)',
                                marginBottom: 'var(--space-4)'
                            }}>
                                <MessageCircle size={32} style={{ color: '#16a34a', flexShrink: 0 }} />
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Enviar comprobante del Trabajo #{currentTrabajo.id}</div>
                                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                        Se abrirá WhatsApp con un mensaje pre-redactado para <strong>{cliente?.nombre || 'el cliente'}</strong>.
                                    </div>
                                </div>
                            </div>
                            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                                    <span>Cliente</span>
                                    <strong>{cliente?.nombre || '—'}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                                    <span>Teléfono</span>
                                    <strong>{cliente?.telefono || 'Sin teléfono'}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                                    <span>Saldo</span>
                                    <strong style={{ color: currentTrabajo.saldo_pendiente > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                                        RD$ {formatMoney(currentTrabajo.saldo_pendiente)}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Paso: sending */}
                    {whatsAppStep === 'sending' && (
                        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                            <div style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>📤</div>
                            <div style={{ fontWeight: 600, marginBottom: 8 }}>Abriendo WhatsApp...</div>
                            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Por favor espere un momento</div>
                        </div>
                    )}

                    {/* Paso: sent — preguntar si guardar */}
                    {whatsAppStep === 'sent' && (
                        <div>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                                padding: 'var(--space-4)', background: '#f0fdf4',
                                border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)',
                                marginBottom: 'var(--space-4)'
                            }}>
                                <CheckCircle size={28} style={{ color: '#16a34a', flexShrink: 0 }} />
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: 2 }}>✅ Mensaje enviado a WhatsApp</div>
                                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>WhatsApp se abrió con el mensaje.</div>
                                </div>
                            </div>
                            <div style={{
                                padding: 'var(--space-4)', background: 'var(--slate-50)',
                                border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-md)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 8, fontWeight: 600 }}>
                                    <FileText size={18} style={{ color: 'var(--color-primary)' }} />
                                    ¿Desea crear una Factura formal con este trabajo?
                                </div>
                                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                    Se registrará una factura formal basada en este trabajo en el historial de facturas del sistema.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Paso: saving */}
                    {whatsAppStep === 'saving' && (
                        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                            <div style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>💾</div>
                            <div style={{ fontWeight: 600, marginBottom: 8 }}>Guardando factura en el sistema...</div>
                        </div>
                    )}

                    {/* Paso: saved */}
                    {whatsAppStep === 'saved' && facturaGuardada && (
                        <div>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                                padding: 'var(--space-4)', background: '#eff6ff',
                                border: '1px solid #bfdbfe', borderRadius: 'var(--radius-md)',
                                marginBottom: 'var(--space-4)'
                            }}>
                                <Save size={28} style={{ color: '#2563eb', flexShrink: 0 }} />
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: 2 }}>✅ Factura guardada exitosamente</div>
                                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Ya puede consultarla en el módulo de Facturación.</div>
                                </div>
                            </div>
                            <div style={{ fontSize: 'var(--text-sm)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Número de Factura</span>
                                    <strong style={{ color: 'var(--color-primary)' }}>{facturaGuardada.numero_factura}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Cliente</span>
                                    <strong>{cliente?.nombre || '—'}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Total</span>
                                    <strong style={{ color: 'var(--color-success)' }}>RD$ {formatMoney(facturaGuardada.total)}</strong>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>
            )}

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
