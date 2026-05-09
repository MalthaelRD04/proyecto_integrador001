import React from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight } from 'lucide-react';
import { formatMoney } from '../../data/store';

export default function LowStockList({ products }) {
    if (products.length === 0) {
        return (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                <Package size={32} />
                <p>Todos los productos tienen stock suficiente</p>
            </div>
        );
    }

    return (
        <div className="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th className="text-right">Stock</th>
                        <th className="text-right">Mínimo</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(p => (
                        <tr key={p.id}>
                            <td>{p.nombre}</td>
                            <td className="text-right">
                                <span className={`badge ${p.stock === 0 ? 'badge-red' : 'badge-orange'}`}>
                                    {p.stock}
                                </span>
                            </td>
                            <td className="text-right text-muted">{p.stock_minimo}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
