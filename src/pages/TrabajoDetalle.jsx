import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { update, registrarAbono, guardarTrabajoComoFactura, formatDate } from '../data/store';
import Modal from '../components/Modal';
import { ArrowLeft, Plus, DollarSign, Calendar, User, AlertCircle, CheckCircle, Printer, MessageCircle, Save, X, Send, FileText } from 'lucide-react';
import { open as shellOpen } from '@tauri-apps/plugin-shell';

// Custom Hooks & Components
import { useTrabajo, useAbonos } from '../hooks/useTrabajo';
import ResumenFinanciero from '../components/trabajos/ResumenFinanciero';
import HistorialAbonos from '../components/trabajos/HistorialAbonos';
import { WHATSAPP_TEMPLATES } from '../utils/whatsappTemplates';

export default function TrabajoDetalle() {
    const { id } = useParams();
    
    // Data Hooks
    const { 
        trabajo, cliente, usuario, loading: loadingTrabajo, 
        triggerRefresh: refreshTrabajo 
    } = useTrabajo(id);
    
    const { 
        abonos: abonosList, loading: loadingAbonos, 
        triggerRefresh: refreshAbonos 
    } = useAbonos(id);

    // UI State
    const [modalAbono, setModalAbono] = useState(false);
    const [abonoForm, setAbonoForm] = useState({ monto: '', metodo_pago: 'efectivo', nota: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [modalPrint, setModalPrint] = useState(false);
    const [modalWhatsApp, setModalWhatsApp] = useState(false);
    const [whatsAppStep, setWhatsAppStep] = useState('idle'); // idle | sending | sent | saving | saved
    const [selectedTemplate, setSelectedTemplate] = useState('GENERICO');
    const [facturaGuardada, setFacturaGuardada] = useState(null);

    if (loadingTrabajo || loadingAbonos) return <div style={{ padding: 'var(--space-8)' }}>Cargando...</div>;

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

    const appUbicacion = localStorage.getItem('app_ubicacion') || 'San Fernando de Monte Cristi, R.D.';

    const handlePrint = (formato) => {
        setModalPrint(false);
        const t = trabajo;
        const cli = cliente;
        const usr = usuario;

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
                <html lang="es">
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
                    <div class="info-row"><span class="label">Recibido:</span><span>${new Date(t.fecha_recibido).toLocaleDateString()}</span></div>
                    <div class="info-row"><span class="label">Entrega Est.:</span><span>${new Date(t.fecha_entrega_estimada).toLocaleDateString()}</span></div>
                    ${t.fecha_entrega_real ? `<div class="info-row"><span class="label">Entrega Real:</span><span>${new Date(t.fecha_entrega_real).toLocaleDateString()}</span></div>` : ''}
                    <hr class="divider"/>
                    <div class="section-title">Descripcion</div>
                    <div class="description">${t.descripcion}</div>
                    ${abonosList.length > 0 ? `
                        <hr class="divider"/>
                        <div class="section-title">Historial de Abonos</div>
                        ${abonosList.map((a, i) => `
                            <div class="abono-item">${i + 1}. RD$${a.monto} - ${a.metodo_pago} (${new Date(a.fecha).toLocaleDateString()})${a.nota ? ' - ' + a.nota : ''}</div>
                        `).join('')}
                    ` : ''}
                    <hr class="divider-double"/>
                    <div class="total-line"><span>Precio Total:</span><span>RD$ ${t.precio_total}</span></div>
                    ${t.tiene_descuento ? `<div class="total-line"><span>Descuento:</span><span>-RD$ ${t.monto_descuento}</span></div>` : ''}
                    <div class="total-line"><span>Total Abonado:</span><span>RD$ ${t.total_abonado}</span></div>
                    <div class="total-line grand"><span>SALDO:</span><span>RD$ ${t.saldo_pendiente}</span></div>
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
                <html lang="es">
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
                            <p>${new Date(t.fecha_recibido).toLocaleDateString()}</p>
                        </div>
                        <div class="info-block">
                            <h4>Entrega Estimada</h4>
                            <p>${new Date(t.fecha_entrega_estimada).toLocaleDateString()}</p>
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
                                        <td>${new Date(a.fecha).toLocaleString()}</td>
                                        <td style="text-transform:capitalize">${a.metodo_pago}</td>
                                        <td class="text-right" style="font-weight:600; color:#16a34a;">+RD$ ${a.monto}</td>
                                        <td>${a.nota || '—'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : ''}
                    <div class="totals">
                        <table>
                            <tbody>
                                <tr><td>Precio Total</td><td class="text-right">RD$ ${t.precio_total}</td></tr>
                                ${t.tiene_descuento ? `<tr style="color:#16a34a"><td>Descuento</td><td class="text-right">-RD$ ${t.monto_descuento}</td></tr>` : ''}
                                <tr><td>Total Abonado</td><td class="text-right" style="color:#16a34a">RD$ ${t.total_abonado}</td></tr>
                                <tr class="total-row">
                                    <td>Saldo Pendiente</td>
                                    <td class="text-right" style="color:${t.saldo_pendiente > 0 ? '#dc2626' : '#16a34a'}">
                                        RD$ ${t.saldo_pendiente}
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
        const t = trabajo;
        const cli = cliente;

        setWhatsAppStep('sending');

        const template = WHATSAPP_TEMPLATES[selectedTemplate];
        const mensaje = encodeURIComponent(template.message(t, cli));

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
            const factura = await guardarTrabajoComoFactura(trabajo);
            setFacturaGuardada(factura);
            setWhatsAppStep('saved');
            setSuccess('✅ Factura guardada en el sistema exitosamente');
            setTimeout(() => setSuccess(''), 4000);
            refreshTrabajo();
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
        await update('trabajos', trabajo.id, {
            estado: nuevoEstado,
            ...(nuevoEstado === 'entregado' ? { fecha_entrega_real: new Date().toISOString() } : {}),
        });
        refreshTrabajo();
    };

    const handleAbono = async () => {
        const result = await registrarAbono(trabajo.id, abonoForm.monto, abonoForm.metodo_pago, abonoForm.nota);
        if (result.error) {
            setError(result.error);
            setTimeout(() => setError(''), 3000);
            return;
        }
        setSuccess('Abono registrado exitosamente');
        setTimeout(() => setSuccess(''), 3000);
        setModalAbono(false);
        setAbonoForm({ monto: '', metodo_pago: 'efectivo', nota: '' });
        refreshTrabajo();
        refreshAbonos();
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
                    {trabajo.estado !== 'entregado' && trabajo.estado !== 'cancelado' && (
                        <>
                            {trabajo.estado === 'pendiente' && (
                                <button className="btn btn-primary btn-sm" onClick={() => cambiarEstado('en_proceso')}>
                                    Marcar En Proceso
                                </button>
                            )}
                            {trabajo.saldo_pendiente > 0 && (
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
                            <span className={`badge ${estadoBadge(trabajo.estado)}`}>
                                {estadoLabel(trabajo.estado)}
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
                                    {trabajo.descripcion}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
                                <div>
                                    <div className="text-small" style={{ marginBottom: 4 }}>
                                        <Calendar size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> RECIBIDO
                                    </div>
                                    <div>{formatDate(trabajo.fecha_recibido)}</div>
                                </div>
                                <div>
                                    <div className="text-small" style={{ marginBottom: 4 }}>ENTREGA ESTIMADA</div>
                                    <div>{formatDate(trabajo.fecha_entrega_estimada)}</div>
                                </div>
                                <div>
                                    <div className="text-small" style={{ marginBottom: 4 }}>ENTREGA REAL</div>
                                    <div>{trabajo.fecha_entrega_real ? formatDate(trabajo.fecha_entrega_real) : '—'}</div>
                                </div>
                            </div>

                            {trabajo.nota && (
                                <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', background: 'var(--amber-50)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
                                    <strong>Nota:</strong> {trabajo.nota}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Abonos History - Componentized */}
                    <HistorialAbonos abonos={abonosList} />
                </div>

                {/* Right - Financial Summary - Componentized */}
                <div>
                    <ResumenFinanciero trabajo={trabajo} />
                    
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
                    {whatsAppStep === 'idle' && (
                        <div className="flex-col gap-md">
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                                padding: 'var(--space-4)', background: '#f0fdf4',
                                border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)',
                                marginBottom: 'var(--space-4)'
                            }}>
                                <MessageCircle size={32} style={{ color: '#16a34a', flexShrink: 0 }} />
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Enviar mensaje al cliente</div>
                                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                        Seleccione la plantilla de mensaje para <strong>{cliente?.nombre || 'el cliente'}</strong>.
                                    </div>
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Plantilla de Mensaje</label>
                                <select 
                                    className="form-select" 
                                    value={selectedTemplate} 
                                    onChange={e => setSelectedTemplate(e.target.value)}
                                >
                                    {Object.entries(WHATSAPP_TEMPLATES).map(([key, t]) => (
                                        <option key={key} value={key}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ 
                                padding: 'var(--space-4)', 
                                background: 'var(--slate-50)', 
                                border: '1px solid var(--border-default)', 
                                borderRadius: 'var(--radius-md)',
                                fontSize: 'var(--text-sm)',
                                fontStyle: 'italic',
                                color: 'var(--text-secondary)',
                                whiteSpace: 'pre-wrap'
                            }}>
                                <strong>Vista previa:</strong><br />
                                {WHATSAPP_TEMPLATES[selectedTemplate].message(trabajo, cliente)}
                            </div>
                        </div>
                    )}

                    {whatsAppStep === 'sending' && (
                        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                            <div style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>📤</div>
                            <div style={{ fontWeight: 600, marginBottom: 8 }}>Abriendo WhatsApp...</div>
                            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Por favor espere un momento</div>
                        </div>
                    )}

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

                    {whatsAppStep === 'saving' && (
                        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                            <div style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>💾</div>
                            <div style={{ fontWeight: 600, marginBottom: 8 }}>Guardando factura en el sistema...</div>
                        </div>
                    )}

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
                                        <strong style={{ color: 'var(--color-success)' }}>RD$ {facturaGuardada.total}</strong>
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
                        Saldo pendiente: <strong>RD$ {trabajo.saldo_pendiente}</strong>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Monto del Abono (RD$) *</label>
                        <input
                            type="number" step="0.01" className="form-input"
                            value={abonoForm.monto}
                            onChange={e => setAbonoForm({ ...abonoForm, monto: e.target.value })}
                            placeholder="0.00"
                            max={trabajo.saldo_pendiente}
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
