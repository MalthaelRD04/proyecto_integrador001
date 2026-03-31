import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAll, crearFactura, formatMoney, getNextFacturaNum } from '../data/store';
import { useAuth } from '../contexts/AuthContext';
import { Search, Plus, Trash2, ShoppingCart, AlertCircle, CheckCircle } from 'lucide-react';

export default function Facturacion() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [clientes, setClientes] = useState([]);
    const [items, setItems] = useState([]);
    const [clienteId, setClienteId] = useState('');
    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [nota, setNota] = useState('');
    const [detalles, setDetalles] = useState([]);
    const [searchItem, setSearchItem] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [facturaNum, setFacturaNum] = useState('');

    useEffect(() => {
        setClientes(getAll('clientes'));
        setItems(getAll('items').filter(i => i.activo));
        setFacturaNum(getNextFacturaNum());
    }, []);

    const filteredItems = items.filter(i =>
        i.nombre.toLowerCase().includes(searchItem.toLowerCase())
    ).slice(0, 8);

    const agregarItem = (item) => {
        if (item.es_producto && item.stock <= 0) {
            setError(`"${item.nombre}" no tiene stock disponible.`);
            setTimeout(() => setError(''), 3000);
            return;
        }

        const existing = detalles.find(d => d.item_id === item.id);
        if (existing) {
            if (item.es_producto && existing.cantidad >= item.stock) {
                setError(`Stock insuficiente para "${item.nombre}". Disponible: ${item.stock}`);
                setTimeout(() => setError(''), 3000);
                return;
            }
            setDetalles(detalles.map(d =>
                d.item_id === item.id
                    ? { ...d, cantidad: d.cantidad + 1, subtotal: (d.cantidad + 1) * d.precio_unitario }
                    : d
            ));
        } else {
            setDetalles([...detalles, {
                item_id: item.id,
                descripcion: item.nombre,
                cantidad: 1,
                precio_unitario: item.precio_venta,
                subtotal: item.precio_venta,
                es_producto: item.es_producto,
                stock: item.stock,
            }]);
        }
        setSearchItem('');
        setShowSearch(false);
    };

    const updateCantidad = (idx, val) => {
        const qty = Math.max(1, Number(val) || 1);
        const det = detalles[idx];
        if (det.es_producto && qty > det.stock) {
            setError(`Stock máximo para "${det.descripcion}": ${det.stock}`);
            setTimeout(() => setError(''), 3000);
            return;
        }
        setDetalles(detalles.map((d, i) =>
            i === idx ? { ...d, cantidad: qty, subtotal: qty * d.precio_unitario } : d
        ));
    };

    const updatePrecio = (idx, val) => {
        const precio = Number(val) || 0;
        setDetalles(detalles.map((d, i) =>
            i === idx ? { ...d, precio_unitario: precio, subtotal: d.cantidad * precio } : d
        ));
    };

    const removeDetalle = (idx) => {
        setDetalles(detalles.filter((_, i) => i !== idx));
    };

    const subtotal = detalles.reduce((sum, d) => sum + d.subtotal, 0);
    const impuesto = subtotal * 0.18;
    const total = subtotal + impuesto;

    const guardarFactura = () => {
        if (detalles.length === 0) {
            setError('Agregue al menos un producto o servicio.');
            setTimeout(() => setError(''), 3000);
            return;
        }

        const factura = crearFactura(
            {
                cliente_id: clienteId ? Number(clienteId) : null,
                usuario_id: user.id,
                subtotal,
                impuesto,
                total,
                metodo_pago: metodoPago,
                nota,
            },
            detalles.map(d => ({
                item_id: d.item_id,
                descripcion: d.descripcion,
                cantidad: d.cantidad,
                precio_unitario: d.precio_unitario,
                subtotal: d.subtotal,
            }))
        );

        setSuccess(`Factura ${factura.numero_factura} creada exitosamente.`);
        setDetalles([]);
        setClienteId('');
        setNota('');
        setItems(getAll('items').filter(i => i.activo));
        setFacturaNum(getNextFacturaNum());

        // Redirect immediately and pass the autoPrint flag
        navigate(`/facturas/${factura.id}`, { state: { autoPrint: true } });
    };

    return (
        <div>
            {error && <div className="alert alert-danger"><AlertCircle size={16} />{error}</div>}
            {success && <div className="alert alert-success"><CheckCircle size={16} />{success}</div>}

            <div className="facturacion-layout">
                {/* Left - Invoice Form */}
                <div>
                    <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                        <div className="card-header">
                            <span className="card-title">Factura: {facturaNum}</span>
                            <span className="badge badge-blue">Nueva</span>
                        </div>
                        <div className="card-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Cliente (Opcional)</label>
                                    <select className="form-select" value={clienteId} onChange={e => setClienteId(e.target.value)}>
                                        <option value="">— Consumidor Final —</option>
                                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Método de Pago</label>
                                    <select className="form-select" value={metodoPago} onChange={e => setMetodoPago(e.target.value)}>
                                        <option value="efectivo">Efectivo</option>
                                        <option value="tarjeta">Tarjeta</option>
                                        <option value="transferencia">Transferencia</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Nota</label>
                                <input className="form-input" value={nota} onChange={e => setNota(e.target.value)} placeholder="Observaciones (opcional)" />
                            </div>
                        </div>
                    </div>

                    {/* Item Search & Add */}
                    <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                        <div className="card-header">
                            <span className="card-title">Agregar Productos / Servicios</span>
                        </div>
                        <div className="card-body">
                            <div style={{ position: 'relative', zIndex: showSearch ? 10 : 1 }}>
                                <div className="search-input-wrapper">
                                    <Search size={16} />
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Buscar producto o servicio..."
                                        value={searchItem}
                                        onChange={e => { setSearchItem(e.target.value); setShowSearch(true); }}
                                        onFocus={() => setShowSearch(true)}
                                    />
                                </div>
                                {showSearch && searchItem && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                                        background: 'white', border: '1px solid var(--border-strong)',
                                        borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                                        maxHeight: 240, overflowY: 'auto', marginTop: 4,
                                    }}>
                                        {filteredItems.map(item => (
                                            <button
                                                key={item.id}
                                                style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    width: '100%', padding: '10px 14px', border: 'none', background: 'none',
                                                    textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid var(--border-default)',
                                                    fontSize: 'var(--text-sm)', transition: 'background var(--transition-fast)',
                                                }}
                                                onClick={() => agregarItem(item)}
                                                onMouseOver={e => e.target.style.background = 'var(--slate-50)'}
                                                onMouseOut={e => e.target.style.background = 'none'}
                                            >
                                                <div>
                                                    <div className="font-bold">{item.nombre}</div>
                                                    <div className="text-small">
                                                        {item.es_producto ? `Stock: ${item.stock}` : 'Servicio'}
                                                    </div>
                                                </div>
                                                <span className="font-mono">RD$ {formatMoney(item.precio_venta)}</span>
                                            </button>
                                        ))}
                                        {filteredItems.length === 0 && (
                                            <div style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                                                No se encontraron resultados
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Detail Table */}
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">Detalle ({detalles.length} ítem{detalles.length !== 1 ? 's' : ''})</span>
                        </div>
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Descripción</th>
                                        <th style={{ width: 90 }}>Cantidad</th>
                                        <th style={{ width: 130 }}>Precio Unit.</th>
                                        <th className="text-right" style={{ width: 120 }}>Subtotal</th>
                                        <th style={{ width: 50 }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detalles.map((d, idx) => (
                                        <tr key={idx}>
                                            <td className="font-bold">{d.descripcion}</td>
                                            <td>
                                                <input
                                                    type="number" min="1" className="form-input"
                                                    style={{ height: 30, width: 70, textAlign: 'center', padding: '2px 6px' }}
                                                    value={d.cantidad}
                                                    onChange={e => updateCantidad(idx, e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number" step="0.01" className="form-input"
                                                    style={{ height: 30, width: 110, textAlign: 'right', padding: '2px 6px' }}
                                                    value={d.precio_unitario}
                                                    onChange={e => updatePrecio(idx, e.target.value)}
                                                />
                                            </td>
                                            <td className="text-right font-mono">RD$ {formatMoney(d.subtotal)}</td>
                                            <td>
                                                <button className="btn btn-icon btn-sm btn-ghost" onClick={() => removeDetalle(idx)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {detalles.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-center text-muted" style={{ padding: 'var(--space-8)' }}>
                                                <ShoppingCart size={24} style={{ opacity: 0.3, marginBottom: 8 }} />
                                                <br />Busque y agregue productos o servicios
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right - Totals */}
                <div>
                    <div className="card" style={{ position: 'sticky', top: 'calc(var(--topbar-height) + var(--space-6))' }}>
                        <div className="card-header">
                            <span className="card-title">Resumen</span>
                        </div>
                        <div className="card-body">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                                <span className="text-muted">Subtotal</span>
                                <span className="font-mono">RD$ {formatMoney(subtotal)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                                <span className="text-muted">ITBIS (18%)</span>
                                <span className="font-mono">RD$ {formatMoney(impuesto)}</span>
                            </div>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between',
                                padding: 'var(--space-4) 0', marginTop: 'var(--space-2)',
                                borderTop: '2px solid var(--border-strong)',
                                fontSize: 'var(--text-xl)', fontWeight: 700,
                            }}>
                                <span>TOTAL</span>
                                <span className="font-mono" style={{ color: 'var(--color-primary)' }}>RD$ {formatMoney(total)}</span>
                            </div>

                            <button
                                className="btn btn-primary btn-lg"
                                style={{ width: '100%', marginTop: 'var(--space-4)' }}
                                onClick={guardarFactura}
                                disabled={detalles.length === 0}
                            >
                                <CheckCircle size={18} />
                                Guardar Factura
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Click outside to close search */}
            {showSearch && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 5 }}
                    onClick={() => setShowSearch(false)}
                />
            )}
        </div>
    );
}
