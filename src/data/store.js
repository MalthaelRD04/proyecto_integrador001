// =============================================
// JRJ Centro de Copias y Servicios
// Data Store — localStorage simulation of DB
// =============================================

const DB_KEY = 'jrj_sistema_db';

// Seed data
const SEED_DATA = {
    usuarios: [
        { id: 1, nombre: 'José Rodríguez', usuario: 'admin', contrasena_hash: 'admin123', rol: 'admin', activo: true, creado_en: '2025-01-01T08:00:00' },
        { id: 2, nombre: 'María García', usuario: 'maria', contrasena_hash: 'maria123', rol: 'empleado', activo: true, creado_en: '2025-02-15T09:00:00' },
    ],
    categorias: [
        { id: 1, nombre: 'Útiles Escolares', descripcion: 'Material escolar y de oficina' },
        { id: 2, nombre: 'Consumibles Impresora', descripcion: 'Tinta, tóner, papel' },
        { id: 3, nombre: 'Servicios de Copias', descripcion: 'Fotocopias, impresiones, encuadernados' },
        { id: 4, nombre: 'Decoración', descripcion: 'Artículos y servicios de decoración' },
    ],
    items: [
        { id: 1, es_producto: true, nombre: 'Resma de Papel A4', descripcion: 'Resma 500 hojas', precio_venta: 250.00, costo: 180.00, stock: 45, stock_minimo: 10, categoria_id: 2, activo: true, creado_en: '2025-01-10', actualizado_en: '2025-01-10' },
        { id: 2, es_producto: true, nombre: 'Cartucho Tinta Negro', descripcion: 'HP 664 Negro', precio_venta: 850.00, costo: 600.00, stock: 8, stock_minimo: 5, categoria_id: 2, activo: true, creado_en: '2025-01-10', actualizado_en: '2025-01-10' },
        { id: 3, es_producto: true, nombre: 'Lápiz HB', descripcion: 'Lápiz grafito HB', precio_venta: 15.00, costo: 8.00, stock: 120, stock_minimo: 20, categoria_id: 1, activo: true, creado_en: '2025-01-10', actualizado_en: '2025-01-10' },
        { id: 4, es_producto: true, nombre: 'Cuaderno 100 Hojas', descripcion: 'Cuaderno rayado', precio_venta: 75.00, costo: 45.00, stock: 3, stock_minimo: 10, categoria_id: 1, activo: true, creado_en: '2025-01-10', actualizado_en: '2025-01-10' },
        { id: 5, es_producto: true, nombre: 'Cajas de Sardina', descripcion: 'Caja de sardina', precio_venta: 200.00, costo: 150.00, stock: 25, stock_minimo: 5, categoria_id: 1, activo: true, creado_en: '2025-01-10', actualizado_en: '2025-01-10' },
        { id: 6, es_producto: true, nombre: 'Mayonesa', descripcion: 'Mayonesa grande', precio_venta: 80.00, costo: 55.00, stock: 15, stock_minimo: 5, categoria_id: 1, activo: true, creado_en: '2025-01-10', actualizado_en: '2025-01-10' },
        { id: 7, es_producto: false, nombre: 'Fotocopia B/N', descripcion: 'Copia blanco y negro carta', precio_venta: 5.00, costo: 0, stock: 0, stock_minimo: 0, categoria_id: 3, activo: true, creado_en: '2025-01-10', actualizado_en: '2025-01-10' },
        { id: 8, es_producto: false, nombre: 'Impresión a Color', descripcion: 'Impresión carta a color', precio_venta: 25.00, costo: 0, stock: 0, stock_minimo: 0, categoria_id: 3, activo: true, creado_en: '2025-01-10', actualizado_en: '2025-01-10' },
        { id: 9, es_producto: false, nombre: 'Encuadernado', descripcion: 'Encuadernado tipo espiral', precio_venta: 150.00, costo: 0, stock: 0, stock_minimo: 0, categoria_id: 3, activo: true, creado_en: '2025-01-10', actualizado_en: '2025-01-10' },
        { id: 10, es_producto: false, nombre: 'Laminado', descripcion: 'Laminado carta', precio_venta: 100.00, costo: 0, stock: 0, stock_minimo: 0, categoria_id: 3, activo: true, creado_en: '2025-01-10', actualizado_en: '2025-01-10' },
    ],
    clientes: [
        { id: 1, nombre: 'Jeff Martínez', telefono: '809-555-0001', direccion: 'Calle Duarte #15, Monte Cristi', creado_en: '2025-01-15' },
        { id: 2, nombre: 'Ana Pérez', telefono: '809-555-0002', direccion: 'Av. Mella #45', creado_en: '2025-02-01' },
        { id: 3, nombre: 'Carlos Rodríguez', telefono: '829-555-0003', direccion: 'Los Girasoles #8', creado_en: '2025-02-10' },
    ],
    facturas: [
        { id: 1, numero_factura: 'PCI-4', cliente_id: 1, usuario_id: 1, subtotal: 2915.25, impuesto: 524.75, total: 3440.00, metodo_pago: 'efectivo', estado: 'pagada', nota: '', fecha: '2025-02-20T10:30:00' },
        { id: 2, numero_factura: 'PCI-5', cliente_id: 2, usuario_id: 1, subtotal: 500.00, impuesto: 90.00, total: 590.00, metodo_pago: 'tarjeta', estado: 'pagada', nota: '', fecha: '2025-02-25T09:00:00' },
    ],
    detalle_factura: [
        { id: 1, factura_id: 1, item_id: 5, descripcion: 'Cajas de Sardina', cantidad: 7, precio_unitario: 213.06, subtotal: 1188.44 },
        { id: 2, factura_id: 1, item_id: 6, descripcion: 'Mayonesa', cantidad: 8, precio_unitario: 97.63, subtotal: 543.37 },
        { id: 3, factura_id: 1, item_id: 5, descripcion: 'Cajas de Sardina', cantidad: 7, precio_unitario: 213.06, subtotal: 1188.44 },
        { id: 4, factura_id: 2, item_id: 1, descripcion: 'Resma de Papel A4', cantidad: 2, precio_unitario: 250.00, subtotal: 500.00 },
    ],
    trabajos: [
        { id: 1, cliente_id: 1, usuario_id: 1, descripcion: 'Decoración de salón para fiesta de cumpleaños', precio_total: 5000.00, tiene_descuento: true, monto_descuento: 500.00, total_abonado: 2000.00, saldo_pendiente: 2500.00, estado: 'en_proceso', fecha_recibido: '2025-02-18T08:00:00', fecha_entrega_estimada: '2025-02-28', fecha_entrega_real: null, nota: 'Tema: unicornios' },
        { id: 2, cliente_id: 3, usuario_id: 1, descripcion: 'Impresión de 200 invitaciones', precio_total: 3000.00, tiene_descuento: false, monto_descuento: 0, total_abonado: 3000.00, saldo_pendiente: 0, estado: 'entregado', fecha_recibido: '2025-02-10T09:00:00', fecha_entrega_estimada: '2025-02-15', fecha_entrega_real: '2025-02-14T16:00:00', nota: '' },
    ],
    abonos_trabajo: [
        { id: 1, trabajo_id: 1, monto: 1000.00, metodo_pago: 'efectivo', nota: 'Primer abono', fecha: '2025-02-18T08:00:00' },
        { id: 2, trabajo_id: 1, monto: 1000.00, metodo_pago: 'transferencia', nota: 'Segundo abono', fecha: '2025-02-22T10:00:00' },
        { id: 3, trabajo_id: 2, monto: 3000.00, metodo_pago: 'efectivo', nota: 'Pago total', fecha: '2025-02-10T09:00:00' },
    ],
    _counters: {
        factura_num: 5,
    }
};

function getDB() {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
        localStorage.setItem(DB_KEY, JSON.stringify(SEED_DATA));
        return JSON.parse(JSON.stringify(SEED_DATA));
    }
    return JSON.parse(raw);
}

function saveDB(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function nextId(arr) {
    if (arr.length === 0) return 1;
    return Math.max(...arr.map(i => i.id)) + 1;
}

function now() {
    return new Date().toISOString();
}

function today() {
    return new Date().toISOString().split('T')[0];
}

// ── Generic CRUD ──

export function getAll(entity) {
    const db = getDB();
    return db[entity] || [];
}

export function getById(entity, id) {
    return getAll(entity).find(item => item.id === Number(id));
}

export function create(entity, data) {
    const db = getDB();
    if (!db[entity]) db[entity] = [];
    const item = { ...data, id: nextId(db[entity]) };
    db[entity].push(item);
    saveDB(db);
    return item;
}

export function update(entity, id, data) {
    const db = getDB();
    const idx = db[entity].findIndex(item => item.id === Number(id));
    if (idx === -1) return null;
    db[entity][idx] = { ...db[entity][idx], ...data };
    saveDB(db);
    return db[entity][idx];
}

export function remove(entity, id) {
    const db = getDB();
    db[entity] = db[entity].filter(item => item.id !== Number(id));
    saveDB(db);
}

// ── Auth ──

export function authenticate(usuario, password) {
    const users = getAll('usuarios');
    const user = users.find(u => u.usuario === usuario && u.contrasena_hash === password);
    if (!user) return { success: false, error: 'Usuario o contraseña incorrectos' };
    if (!user.activo) return { success: false, error: 'Usuario desactivado. Contacte al administrador.' };
    return { success: true, user: { id: user.id, nombre: user.nombre, usuario: user.usuario, rol: user.rol } };
}

// ── Facturación ──

export function getNextFacturaNum() {
    const db = getDB();
    const num = db._counters.factura_num;
    return `PCI-${num}`;
}

export function crearFactura(facturaData, detalles) {
    const db = getDB();
    const numero_factura = `PCI-${db._counters.factura_num}`;
    db._counters.factura_num++;

    const factura = {
        id: nextId(db.facturas),
        numero_factura,
        cliente_id: facturaData.cliente_id || null,
        usuario_id: facturaData.usuario_id,
        subtotal: facturaData.subtotal,
        impuesto: facturaData.impuesto,
        total: facturaData.total,
        metodo_pago: facturaData.metodo_pago || 'efectivo',
        estado: 'pagada',
        nota: facturaData.nota || '',
        fecha: now(),
    };

    db.facturas.push(factura);

    detalles.forEach(det => {
        const detItem = {
            id: nextId(db.detalle_factura),
            factura_id: factura.id,
            item_id: det.item_id,
            descripcion: det.descripcion,
            cantidad: det.cantidad,
            precio_unitario: det.precio_unitario,
            subtotal: det.subtotal,
        };
        db.detalle_factura.push(detItem);

        // Descontar stock si es producto
        const item = db.items.find(i => i.id === det.item_id);
        if (item && item.es_producto) {
            item.stock = Math.max(0, item.stock - det.cantidad);
            item.actualizado_en = now();
        }
    });

    saveDB(db);
    return factura;
}

// ── Trabajos ──

export function crearTrabajo(data) {
    const monto_descuento = data.tiene_descuento ? Number(data.monto_descuento) || 0 : 0;
    const saldo_pendiente = Number(data.precio_total) - monto_descuento;
    const trabajo = create('trabajos', {
        ...data,
        monto_descuento,
        total_abonado: 0,
        saldo_pendiente,
        estado: 'pendiente',
        fecha_recibido: now(),
        fecha_entrega_real: null,
    });
    return trabajo;
}

export function registrarAbono(trabajo_id, monto, metodo_pago, nota) {
    const db = getDB();
    const trabajo = db.trabajos.find(t => t.id === Number(trabajo_id));
    if (!trabajo) return { error: 'Trabajo no encontrado' };

    const montoNum = Number(monto);
    if (montoNum <= 0) return { error: 'El monto debe ser mayor a 0' };
    if (montoNum > trabajo.saldo_pendiente) return { error: `El abono no puede exceder el saldo pendiente (RD$${trabajo.saldo_pendiente.toFixed(2)})` };

    const abono = {
        id: nextId(db.abonos_trabajo),
        trabajo_id: Number(trabajo_id),
        monto: montoNum,
        metodo_pago: metodo_pago || 'efectivo',
        nota: nota || '',
        fecha: now(),
    };

    db.abonos_trabajo.push(abono);

    trabajo.total_abonado = (Number(trabajo.total_abonado) || 0) + montoNum;
    trabajo.saldo_pendiente = Number(trabajo.precio_total) - Number(trabajo.monto_descuento) - trabajo.total_abonado;

    if (trabajo.saldo_pendiente <= 0) {
        trabajo.saldo_pendiente = 0;
        trabajo.estado = 'entregado';
        trabajo.fecha_entrega_real = now();
    }

    saveDB(db);
    return { success: true, abono, trabajo };
}

// ── Dashboard Stats ──

export function getDashboardStats() {
    const db = getDB();
    const todayStr = today();

    const ventasHoy = db.facturas
        .filter(f => f.fecha.startsWith(todayStr) && f.estado !== 'anulada')
        .reduce((sum, f) => sum + Number(f.total), 0);

    const trabajosPendientes = db.trabajos
        .filter(t => t.estado === 'pendiente' || t.estado === 'en_proceso').length;

    const productosBajoStock = db.items
        .filter(i => i.es_producto && i.activo && i.stock <= i.stock_minimo);

    const mesActual = new Date().toISOString().slice(0, 7);
    const ingresosMensuales = db.facturas
        .filter(f => f.fecha.startsWith(mesActual) && f.estado !== 'anulada')
        .reduce((sum, f) => sum + Number(f.total), 0);

    // Ventas últimos 7 días
    const ventasPorDia = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        const total = db.facturas
            .filter(f => f.fecha.startsWith(ds) && f.estado !== 'anulada')
            .reduce((sum, f) => sum + Number(f.total), 0);
        ventasPorDia.push({
            dia: d.toLocaleDateString('es-DO', { weekday: 'short', day: 'numeric' }),
            total,
        });
    }

    return {
        ventasHoy,
        trabajosPendientes,
        productosBajoStock,
        ingresosMensuales,
        ventasPorDia,
        ultimosTrabajos: db.trabajos.filter(t => t.estado !== 'entregado').slice(-5).reverse(),
        totalFacturas: db.facturas.length,
    };
}

// ── Utils ──

export function formatMoney(amount) {
    return Number(amount || 0).toLocaleString('es-DO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-DO', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
}

export function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-DO', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

export function resetDB() {
    localStorage.removeItem(DB_KEY);
    getDB();
}
