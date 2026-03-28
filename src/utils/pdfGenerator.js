import { formatMoney, formatDateTime } from '../data/store';
import html2pdf from 'html2pdf.js';

export const generarPDFFactura = (factura, cliente, usuario, detalles, action = 'download') => {
    // Usaremos el diseño de la hoja completa (recibo)
    const htmlString = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a2e; width: 800px; box-sizing: border-box;">
            <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #1a1a2e; padding-bottom: 16px;">
                <h2 style="font-size: 24px; margin-bottom: 4px;">JRJ Centro de Copias y Servicios</h2>
                <p style="font-size: 14px; color: #666; margin: 0;">San Fernando de Monte Cristi, R.D.</p>
                <p style="margin-top: 8px; font-size: 12px; color: #999;">${formatDateTime(factura.fecha)}</p>
            </div>
            <div style="text-align: right; margin-bottom: 30px;">
                <div style="font-size: 20px; font-weight: 700; margin-bottom: 4px;">${factura.numero_factura}</div>
                <p style="font-size: 14px; margin: 2px 0;">NCF: B0100000${factura.id}</p>
                <p style="font-size: 14px; margin: 2px 0;">TIPO DE COMP: <strong>CONSUMIDOR</strong></p>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                <div style="width: 48%;">
                    <h4 style="font-size: 12px; text-transform: uppercase; color: #888; margin-bottom: 8px;">Cliente</h4>
                    <p style="font-weight: 600; font-size: 16px; margin: 0 0 4px 0;">${cliente?.nombre || 'Consumidor Final'}</p>
                    ${cliente?.telefono ? `<p style="margin: 0 0 4px 0; font-size: 14px;">${cliente.telefono}</p>` : ''}
                    ${cliente?.direccion ? `<p style="margin: 0 0 4px 0; font-size: 14px;">${cliente.direccion}</p>` : ''}
                </div>
                <div style="width: 48%; text-align: right;">
                    <h4 style="font-size: 12px; text-transform: uppercase; color: #888; margin-bottom: 8px;">Facturado por</h4>
                    <p style="font-size: 16px; margin: 0 0 8px 0;">${usuario?.nombre || '—'}</p>
                    <p style="margin: 0;">
                        <span style="display: inline-block; padding: 4px 12px; background: #e2e8f0; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: capitalize;">${factura.metodo_pago}</span>
                        <span style="display: inline-block; padding: 4px 12px; background: ${factura.estado === 'pagada' ? '#d4edda' : factura.estado === 'anulada' ? '#f8d7da' : '#fff3cd'}; color: ${factura.estado === 'pagada' ? '#155724' : factura.estado === 'anulada' ? '#721c24' : '#856404'}; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: capitalize; margin-left: 8px;">${factura.estado}</span>
                    </p>
                </div>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px;">
                <thead>
                    <tr>
                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #1a1a2e; background: #f8f9fa; font-size: 12px; text-transform: uppercase; color: #666;">Cantidad</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #1a1a2e; background: #f8f9fa; font-size: 12px; text-transform: uppercase; color: #666;">Descripción</th>
                        <th style="padding: 12px; text-align: right; border-bottom: 1px solid #1a1a2e; background: #f8f9fa; font-size: 12px; text-transform: uppercase; color: #666;">Precio</th>
                        <th style="padding: 12px; text-align: right; border-bottom: 1px solid #1a1a2e; background: #f8f9fa; font-size: 12px; text-transform: uppercase; color: #666;">ITBIS</th>
                        <th style="padding: 12px; text-align: right; border-bottom: 1px solid #1a1a2e; background: #f8f9fa; font-size: 12px; text-transform: uppercase; color: #666;">Sub Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${detalles.map(d => `
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #eee;">${d.cantidad}</td>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: 600;">${d.descripcion}</td>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-family: monospace;">${formatMoney(d.precio_unitario)}</td>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-family: monospace;">${formatMoney(d.precio_unitario * 0.18)}</td>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-family: monospace;">${formatMoney(d.subtotal)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div style="margin-left: auto; width: 350px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tbody>
                        <tr>
                            <td style="padding: 8px 12px; color: #888; font-size: 14px;">SUB TOTAL</td>
                            <td style="padding: 8px 12px; text-align: right; font-family: monospace; font-size: 14px;">${formatMoney(factura.subtotal)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 12px; color: #888; font-size: 14px;">ITBIS</td>
                            <td style="padding: 8px 12px; text-align: right; font-family: monospace; font-size: 14px;">${formatMoney(factura.impuesto)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; font-weight: 700; font-size: 18px; border-top: 2px solid #1a1a2e;">TOTAL</td>
                            <td style="padding: 12px; text-align: right; font-family: monospace; font-weight: 700; font-size: 18px; border-top: 2px solid #1a1a2e;">RD$ ${formatMoney(factura.total)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            ${factura.nota ? `<div style="margin-top: 30px; padding: 16px; background: #f8f9fa; border-radius: 8px; font-size: 14px;"><span style="color:#888; font-size:12px; display:block; margin-bottom:4px;">NOTA:</span>${factura.nota}</div>` : ''}
            <div style="text-align: center; margin-top: 50px; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 20px;">
                <p style="margin: 0 0 4px 0;">Gracias por su preferencia</p>
                <p style="margin: 0;">JRJ Centro de Copias y Servicios</p>
            </div>
        </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = htmlString;
    const fileName = `Factura_${factura.numero_factura}.pdf`;

    const options = {
        margin: 0,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (action === 'download_and_whatsapp') {
        html2pdf().set(options).from(container).save().then(() => {
            let telefono = cliente?.telefono ? cliente.telefono.replace(/\D/g, '') : '';
            if (telefono && !telefono.startsWith('1') && !telefono.startsWith('52')) {
                telefono = '1' + telefono;
            }
            let url = telefono ? `https://wa.me/${telefono}` : `https://wa.me/`;
            window.open(url, '_blank');
        });
    } else if (action === 'view') {
        html2pdf().set(options).from(container).outputPdf('bloburl').then((pdfUrl) => {
            window.open(pdfUrl, '_blank');
        });
    } else {
        html2pdf().set(options).from(container).save();
    }
};

export const generarPDFTrabajo = (trabajo, cliente, usuario, abonosList, action = 'download') => {
    const htmlString = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a2e; width: 800px; box-sizing: border-box;">
            <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #1a1a2e; padding-bottom: 16px;">
                <h2 style="font-size: 24px; margin-bottom: 4px;">JRJ Centro de Copias y Servicios</h2>
                <p style="font-size: 14px; color: #666; margin: 0;">San Fernando de Monte Cristi, R.D.</p>
                <p style="margin-top: 8px; font-size: 14px; font-weight: 600;">FACTURA DE TRABAJO MANUAL #${trabajo.id}</p>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                <div style="width: 48%;">
                    <h4 style="font-size: 12px; text-transform: uppercase; color: #888; margin-bottom: 8px;">Cliente</h4>
                    <p style="font-weight: 600; font-size: 16px; margin: 0 0 4px 0;">${cliente?.nombre || 'Sin cliente'}</p>
                    ${cliente?.telefono ? `<p style="margin: 0 0 4px 0; font-size: 14px;">${cliente.telefono}</p>` : ''}
                    ${cliente?.direccion ? `<p style="margin: 0 0 4px 0; font-size: 14px;">${cliente.direccion}</p>` : ''}
                </div>
                <div style="width: 48%; text-align: right;">
                    <h4 style="font-size: 12px; text-transform: uppercase; color: #888; margin-bottom: 8px;">Información del Trabajo</h4>
                    <p style="font-size: 14px; margin: 0 0 4px 0;">Registrado por: ${usuario?.nombre || '—'}</p>
                    <p style="margin: 0;"><span style="display: inline-block; padding: 4px 12px; background: #e2e8f0; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: capitalize;">${trabajo.estado.replace('_', ' ')}</span></p>
                </div>
            </div>
            <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin-bottom: 24px; font-size: 14px;">
                <span style="font-size: 12px; text-transform: uppercase; color: #888; display: block; margin-bottom: 8px;">Descripción del Trabajo</span>
                ${trabajo.descripcion}
            </div>
            ${abonosList.length > 0 ? `
                <h4 style="font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 8px;">Historial de Abonos</h4>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px;">
                    <thead>
                        <tr>
                            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd; background: #f8f9fa;">Fecha</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd; background: #f8f9fa;">Método</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd; background: #f8f9fa;">Monto</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd; background: #f8f9fa;">Nota</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${abonosList.map(a => `
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">${formatDateTime(a.fecha)}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee; text-transform: capitalize;">${a.metodo_pago}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600; color: #16a34a;">+RD$ ${formatMoney(a.monto)}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">${a.nota || '—'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : ''}
            <div style="margin-left: auto; width: 350px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tbody>
                        <tr><td style="padding: 8px 12px; font-size: 14px;">Precio Total</td><td style="padding: 8px 12px; text-align: right; font-family: monospace; font-size: 14px;">RD$ ${formatMoney(trabajo.precio_total)}</td></tr>
                        ${trabajo.tiene_descuento ? `<tr><td style="padding: 8px 12px; font-size: 14px; color: #16a34a;">Descuento</td><td style="padding: 8px 12px; text-align: right; font-family: monospace; font-size: 14px; color: #16a34a;">-RD$ ${formatMoney(trabajo.monto_descuento)}</td></tr>` : ''}
                        <tr><td style="padding: 8px 12px; font-size: 14px;">Total Abonado</td><td style="padding: 8px 12px; text-align: right; font-family: monospace; font-size: 14px; color: #16a34a;">RD$ ${formatMoney(trabajo.total_abonado)}</td></tr>
                        <tr><td style="padding: 12px; font-weight: 700; font-size: 18px; border-top: 2px solid #1a1a2e;">Saldo Pendiente</td><td style="padding: 12px; text-align: right; font-family: monospace; font-weight: 700; font-size: 18px; border-top: 2px solid #1a1a2e; color: ${trabajo.saldo_pendiente > 0 ? '#dc2626' : '#16a34a'}">RD$ ${formatMoney(trabajo.saldo_pendiente)}</td></tr>
                    </tbody>
                </table>
            </div>
            <div style="text-align: center; margin-top: 50px; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 20px;">
                <p style="margin: 0 0 4px 0;">Gracias por su preferencia</p>
                <p style="margin: 0;">JRJ Centro de Copias y Servicios</p>
            </div>
        </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = htmlString;
    const fileName = `Trabajo_${trabajo.id}.pdf`;

    const options = {
        margin: 0,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (action === 'download_and_whatsapp') {
        html2pdf().set(options).from(container).save().then(() => {
            let telefono = cliente?.telefono ? cliente.telefono.replace(/\D/g, '') : '';
            if (telefono && !telefono.startsWith('1') && !telefono.startsWith('52')) {
                telefono = '1' + telefono;
            }
            let url = telefono ? `https://wa.me/${telefono}` : `https://wa.me/`;
            window.open(url, '_blank');
        });
    } else if (action === 'view') {
        html2pdf().set(options).from(container).outputPdf('bloburl').then((pdfUrl) => {
            window.open(pdfUrl, '_blank');
        });
    } else {
        html2pdf().set(options).from(container).save();
    }
};
