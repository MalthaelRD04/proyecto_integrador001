import { X } from 'lucide-react';

export default function Modal({ title, children, onClose, footer, size = '' }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className={`modal ${size === 'lg' ? 'modal-lg' : size === 'xl' ? 'modal-xl' : ''}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
                {footer && (
                    <div className="modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
