import React from 'react';
import { formatMoney } from '../../data/store';

export default function ResumenFinanciero({ trabajo }) {
    if (!trabajo) return null;

    const { precio_total, monto_descuento, total_abonado, saldo_pendiente, tiene_descuento } = trabajo;

    return (
        <div className="card" style={{ position: 'sticky', top: 'calc(var(--topbar-height) + var(--space-6))' }}>
            <div className="card-header">
                <span className="card-title">Resumen Financiero</span>
            </div>
            <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                    <span className="text-muted">Precio Total</span>
                    <span className="font-mono">RD$ {formatMoney(precio_total)}</span>
                </div>
                
                {tiene_descuento && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)', color: 'var(--color-success)' }}>
                        <span>Descuento</span>
                        <span className="font-mono">- RD$ {formatMoney(monto_descuento)}</span>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                    <span className="text-muted">Total Abonado</span>
                    <span className="font-mono" style={{ color: 'var(--color-success)' }}>RD$ {formatMoney(total_abonado)}</span>
                </div>

                <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: 'var(--space-4) 0', marginTop: 'var(--space-2)',
                    borderTop: '2px solid var(--border-strong)',
                    fontSize: 'var(--text-xl)', fontWeight: 700,
                }}>
                    <span>Saldo</span>
                    <span className="font-mono" style={{ color: saldo_pendiente > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                        RD$ {formatMoney(saldo_pendiente)}
                    </span>
                </div>

                {/* Progress Bar */}
                <div style={{ marginTop: 'var(--space-4)' }}>
                    <div className="text-small" style={{ marginBottom: 4 }}>Progreso de Pago</div>
                    <div style={{ height: 8, background: 'var(--slate-100)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${(precio_total - monto_descuento) > 0 ? Math.min(100, (total_abonado / (precio_total - monto_descuento)) * 100) : 0}%`,
                            background: saldo_pendiente <= 0 ? 'var(--color-success)' : 'var(--color-primary)',
                            transition: 'width 0.3s ease'
                        }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
