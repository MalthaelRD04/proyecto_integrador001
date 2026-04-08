// =============================================
// JRJ Centro de Copias y Servicios
// Data Store — SQLite via Tauri Plugin (Nativo)
// =============================================

import Database from '@tauri-apps/plugin-sql';

let db = null;
let _dbReady = false;

// ── Inicialización ──

export async function initDatabase() {
    // Abre (o crea) la base de datos SQLite nativa
    db = await Database.load('sqlite:jrj_sistema.db');

    // Crear tablas si no existen
    await createTables();

    // Migrar si es necesario
    await migrateDB();

    // Si no hay datos, hacer seed
    const result = await db.select("SELECT COUNT(*) as count FROM usuarios");
    if (result[0].count === 0) {
        await seedData();
    }

    _dbReady = true;
    return db;
}

export function isDBReady() {
    return _dbReady;
}

// ── Crear Tablas ──

async function createTables() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            usuario TEXT UNIQUE NOT NULL,
            contrasena_hash TEXT NOT NULL,
            rol TEXT DEFAULT 'admin',
            activo INTEGER DEFAULT 1,
            telefono TEXT DEFAULT '',
            correo TEXT DEFAULT '',
            direccion TEXT DEFAULT '',
            bio TEXT DEFAULT '',
            foto TEXT DEFAULT '',
            creado_en TEXT DEFAULT (datetime('now','localtime'))
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS categorias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT UNIQUE NOT NULL,
            descripcion TEXT DEFAULT ''
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            es_producto INTEGER NOT NULL DEFAULT 1,
            nombre TEXT NOT NULL,
            descripcion TEXT DEFAULT '',
            precio_venta REAL NOT NULL,
            costo REAL DEFAULT 0,
            stock INTEGER DEFAULT 0,
            stock_minimo INTEGER DEFAULT 5,
            categoria_id INTEGER,
            activo INTEGER DEFAULT 1,
            creado_en TEXT DEFAULT (datetime('now','localtime')),
            actualizado_en TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (categoria_id) REFERENCES categorias(id)
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            telefono TEXT DEFAULT '',
            direccion TEXT DEFAULT '',
            creado_en TEXT DEFAULT (datetime('now','localtime'))
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS facturas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numero_factura TEXT UNIQUE NOT NULL,
            cliente_id INTEGER,
            usuario_id INTEGER NOT NULL,
            subtotal REAL NOT NULL,
            impuesto REAL DEFAULT 0,
            total REAL NOT NULL,
            metodo_pago TEXT DEFAULT 'efectivo',
            estado TEXT DEFAULT 'pagada',
            nota TEXT DEFAULT '',
            fecha TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (cliente_id) REFERENCES clientes(id),
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS detalle_factura (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            factura_id INTEGER NOT NULL,
            item_id INTEGER NOT NULL,
            descripcion TEXT NOT NULL,
            cantidad INTEGER NOT NULL,
            precio_unitario REAL NOT NULL,
            subtotal REAL NOT NULL,
            FOREIGN KEY (factura_id) REFERENCES facturas(id),
            FOREIGN KEY (item_id) REFERENCES items(id)
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS trabajos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente_id INTEGER NOT NULL,
            usuario_id INTEGER NOT NULL,
            descripcion TEXT NOT NULL,
            precio_total REAL NOT NULL,
            tiene_descuento INTEGER DEFAULT 0,
            monto_descuento REAL DEFAULT 0,
            total_abonado REAL DEFAULT 0,
            saldo_pendiente REAL NOT NULL,
            estado TEXT DEFAULT 'pendiente',
            fecha_recibido TEXT DEFAULT (datetime('now','localtime')),
            fecha_entrega_estimada TEXT,
            fecha_entrega_real TEXT,
            nota TEXT DEFAULT '',
            FOREIGN KEY (cliente_id) REFERENCES clientes(id),
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS abonos_trabajo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trabajo_id INTEGER NOT NULL,
            monto REAL NOT NULL,
            metodo_pago TEXT DEFAULT 'efectivo',
            nota TEXT DEFAULT '',
            fecha TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (trabajo_id) REFERENCES trabajos(id)
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS _counters (
            key TEXT PRIMARY KEY,
            value INTEGER NOT NULL
        )
    `);
}

// ── Migración ──

async function migrateDB() {
    try {
        const cols = await db.select("PRAGMA table_info(usuarios)");
        const colNames = cols.map(row => row.name);
        if (!colNames.includes('foto')) await db.execute("ALTER TABLE usuarios ADD COLUMN foto TEXT DEFAULT ''");
        if (!colNames.includes('telefono')) await db.execute("ALTER TABLE usuarios ADD COLUMN telefono TEXT DEFAULT ''");
        if (!colNames.includes('correo')) await db.execute("ALTER TABLE usuarios ADD COLUMN correo TEXT DEFAULT ''");
        if (!colNames.includes('direccion')) await db.execute("ALTER TABLE usuarios ADD COLUMN direccion TEXT DEFAULT ''");
        if (!colNames.includes('bio')) await db.execute("ALTER TABLE usuarios ADD COLUMN bio TEXT DEFAULT ''");
    } catch (e) {
        console.warn('Error en migración:', e);
    }
}

// ── Seed Data ──

async function seedData() {
    // Usuarios
    await db.execute(`INSERT INTO usuarios (nombre, usuario, contrasena_hash, rol, activo, creado_en) VALUES ($1, $2, $3, $4, $5, $6)`,
        ['José Rodríguez', 'admin', 'admin123', 'admin', 1, '2025-01-01T08:00:00']);
    await db.execute(`INSERT INTO usuarios (nombre, usuario, contrasena_hash, rol, activo, creado_en) VALUES ($1, $2, $3, $4, $5, $6)`,
        ['María García', 'maria', 'maria123', 'empleado', 1, '2025-02-15T09:00:00']);

    // Categorías
    await db.execute(`INSERT INTO categorias (nombre, descripcion) VALUES ($1, $2)`, ['Útiles Escolares', 'Material escolar y de oficina']);
    await db.execute(`INSERT INTO categorias (nombre, descripcion) VALUES ($1, $2)`, ['Consumibles Impresora', 'Tinta, tóner, papel']);
    await db.execute(`INSERT INTO categorias (nombre, descripcion) VALUES ($1, $2)`, ['Servicios de Copias', 'Fotocopias, impresiones, encuadernados']);
    await db.execute(`INSERT INTO categorias (nombre, descripcion) VALUES ($1, $2)`, ['Decoración', 'Artículos y servicios de decoración']);

    // Items
    const items = [
        [1, 'Resma de Papel A4', 'Resma 500 hojas', 250.00, 180.00, 45, 10, 2, 1, '2025-01-10', '2025-01-10'],
        [1, 'Cartucho Tinta Negro', 'HP 664 Negro', 850.00, 600.00, 8, 5, 2, 1, '2025-01-10', '2025-01-10'],
        [1, 'Lápiz HB', 'Lápiz grafito HB', 15.00, 8.00, 120, 20, 1, 1, '2025-01-10', '2025-01-10'],
        [1, 'Cuaderno 100 Hojas', 'Cuaderno rayado', 75.00, 45.00, 3, 10, 1, 1, '2025-01-10', '2025-01-10'],
        [1, 'Cajas de Sardina', 'Caja de sardina', 200.00, 150.00, 25, 5, 1, 1, '2025-01-10', '2025-01-10'],
        [1, 'Mayonesa', 'Mayonesa grande', 80.00, 55.00, 15, 5, 1, 1, '2025-01-10', '2025-01-10'],
        [0, 'Fotocopia B/N', 'Copia blanco y negro carta', 5.00, 0, 0, 0, 3, 1, '2025-01-10', '2025-01-10'],
        [0, 'Impresión a Color', 'Impresión carta a color', 25.00, 0, 0, 0, 3, 1, '2025-01-10', '2025-01-10'],
        [0, 'Encuadernado', 'Encuadernado tipo espiral', 150.00, 0, 0, 0, 3, 1, '2025-01-10', '2025-01-10'],
        [0, 'Laminado', 'Laminado carta', 100.00, 0, 0, 0, 3, 1, '2025-01-10', '2025-01-10'],
    ];
    for (const item of items) {
        await db.execute(`INSERT INTO items (es_producto, nombre, descripcion, precio_venta, costo, stock, stock_minimo, categoria_id, activo, creado_en, actualizado_en) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, item);
    }

    // Clientes
    await db.execute(`INSERT INTO clientes (nombre, telefono, direccion, creado_en) VALUES ($1, $2, $3, $4)`,
        ['Jeff Martínez', '809-555-0001', 'Calle Duarte #15, Monte Cristi', '2025-01-15']);
    await db.execute(`INSERT INTO clientes (nombre, telefono, direccion, creado_en) VALUES ($1, $2, $3, $4)`,
        ['Ana Pérez', '809-555-0002', 'Av. Mella #45', '2025-02-01']);
    await db.execute(`INSERT INTO clientes (nombre, telefono, direccion, creado_en) VALUES ($1, $2, $3, $4)`,
        ['Carlos Rodríguez', '829-555-0003', 'Los Girasoles #8', '2025-02-10']);

    // Facturas
    await db.execute(`INSERT INTO facturas (numero_factura, cliente_id, usuario_id, subtotal, impuesto, total, metodo_pago, estado, nota, fecha) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        ['PCI-4', 1, 1, 2915.25, 524.75, 3440.00, 'efectivo', 'pagada', '', '2025-02-20T10:30:00']);
    await db.execute(`INSERT INTO facturas (numero_factura, cliente_id, usuario_id, subtotal, impuesto, total, metodo_pago, estado, nota, fecha) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        ['PCI-5', 2, 1, 500.00, 90.00, 590.00, 'tarjeta', 'pagada', '', '2025-02-25T09:00:00']);

    // Detalle factura
    await db.execute(`INSERT INTO detalle_factura (factura_id, item_id, descripcion, cantidad, precio_unitario, subtotal) VALUES ($1, $2, $3, $4, $5, $6)`,
        [1, 5, 'Cajas de Sardina', 7, 213.06, 1188.44]);
    await db.execute(`INSERT INTO detalle_factura (factura_id, item_id, descripcion, cantidad, precio_unitario, subtotal) VALUES ($1, $2, $3, $4, $5, $6)`,
        [1, 6, 'Mayonesa', 8, 97.63, 543.37]);
    await db.execute(`INSERT INTO detalle_factura (factura_id, item_id, descripcion, cantidad, precio_unitario, subtotal) VALUES ($1, $2, $3, $4, $5, $6)`,
        [1, 5, 'Cajas de Sardina', 7, 213.06, 1188.44]);
    await db.execute(`INSERT INTO detalle_factura (factura_id, item_id, descripcion, cantidad, precio_unitario, subtotal) VALUES ($1, $2, $3, $4, $5, $6)`,
        [2, 1, 'Resma de Papel A4', 2, 250.00, 500.00]);

    // Trabajos
    await db.execute(`INSERT INTO trabajos (cliente_id, usuario_id, descripcion, precio_total, tiene_descuento, monto_descuento, total_abonado, saldo_pendiente, estado, fecha_recibido, fecha_entrega_estimada, fecha_entrega_real, nota) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [1, 1, 'Decoración de salón para fiesta de cumpleaños', 5000.00, 1, 500.00, 2000.00, 2500.00, 'en_proceso', '2025-02-18T08:00:00', '2025-02-28', null, 'Tema: unicornios']);
    await db.execute(`INSERT INTO trabajos (cliente_id, usuario_id, descripcion, precio_total, tiene_descuento, monto_descuento, total_abonado, saldo_pendiente, estado, fecha_recibido, fecha_entrega_estimada, fecha_entrega_real, nota) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [3, 1, 'Impresión de 200 invitaciones', 3000.00, 0, 0, 3000.00, 0, 'entregado', '2025-02-10T09:00:00', '2025-02-15', '2025-02-14T16:00:00', '']);

    // Abonos
    await db.execute(`INSERT INTO abonos_trabajo (trabajo_id, monto, metodo_pago, nota, fecha) VALUES ($1, $2, $3, $4, $5)`,
        [1, 1000.00, 'efectivo', 'Primer abono', '2025-02-18T08:00:00']);
    await db.execute(`INSERT INTO abonos_trabajo (trabajo_id, monto, metodo_pago, nota, fecha) VALUES ($1, $2, $3, $4, $5)`,
        [1, 1000.00, 'transferencia', 'Segundo abono', '2025-02-22T10:00:00']);
    await db.execute(`INSERT INTO abonos_trabajo (trabajo_id, monto, metodo_pago, nota, fecha) VALUES ($1, $2, $3, $4, $5)`,
        [2, 3000.00, 'efectivo', 'Pago total', '2025-02-10T09:00:00']);

    // Contador
    await db.execute(`INSERT OR REPLACE INTO _counters (key, value) VALUES ($1, $2)`, ['factura_num', 5]);
}

// ── Helpers ──

function normalizeBooleans(row) {
    if (!row) return row;
    if ('activo' in row) row.activo = !!row.activo;
    if ('es_producto' in row) row.es_producto = !!row.es_producto;
    if ('tiene_descuento' in row) row.tiene_descuento = !!row.tiene_descuento;
    return row;
}

function now() {
    return new Date().toISOString();
}

function today() {
    return new Date().toISOString().split('T')[0];
}

// ── Generic CRUD (todos async) ──

export async function getAll(entity) {
    const rows = await db.select(`SELECT * FROM ${entity}`);
    return rows.map(normalizeBooleans);
}

export async function getById(entity, id) {
    const rows = await db.select(`SELECT * FROM ${entity} WHERE id = $1`, [Number(id)]);
    return rows.length > 0 ? normalizeBooleans(rows[0]) : null;
}

export async function create(entity, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const result = await db.execute(`INSERT INTO ${entity} (${keys.join(', ')}) VALUES (${placeholders})`, values);
    return await getById(entity, result.lastInsertId);
}

export async function update(entity, id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    await db.execute(`UPDATE ${entity} SET ${setClause} WHERE id = $${keys.length + 1}`, [...values, Number(id)]);
    return await getById(entity, id);
}

export async function remove(entity, id) {
    await db.execute(`DELETE FROM ${entity} WHERE id = $1`, [Number(id)]);
}

// ── Auth ──

export async function authenticate(usuario, password) {
    const rows = await db.select(`SELECT * FROM usuarios WHERE usuario = $1 AND contrasena_hash = $2`, [usuario, password]);
    if (rows.length === 0) return { success: false, error: 'Usuario o contraseña incorrectos' };
    const user = normalizeBooleans(rows[0]);
    if (!user.activo) return { success: false, error: 'Usuario desactivado. Contacte al administrador.' };
    return { success: true, user: { id: user.id, nombre: user.nombre, usuario: user.usuario, rol: user.rol } };
}

// ── Fotos de Perfil ──

export async function guardarFotoUsuario(id, base64Data) {
    await db.execute(`UPDATE usuarios SET foto = $1 WHERE id = $2`, [base64Data || '', Number(id)]);
}

export async function obtenerFotoUsuario(id) {
    const rows = await db.select(`SELECT foto FROM usuarios WHERE id = $1`, [Number(id)]);
    return rows.length > 0 && rows[0].foto ? rows[0].foto : null;
}

export async function eliminarFotoUsuario(id) {
    await db.execute(`UPDATE usuarios SET foto = '' WHERE id = $1`, [Number(id)]);
}

// ── Facturación ──

export async function getNextFacturaNum() {
    const rows = await db.select(`SELECT value FROM _counters WHERE key = 'factura_num'`);
    const num = rows.length > 0 ? rows[0].value : 1;
    return `PCI-${num}`;
}

export async function crearFactura(facturaData, detalles) {
    const counterRows = await db.select(`SELECT value FROM _counters WHERE key = 'factura_num'`);
    const num = counterRows.length > 0 ? counterRows[0].value : 1;
    const numero_factura = `PCI-${num}`;

    // Incrementar contador
    await db.execute(`UPDATE _counters SET value = value + 1 WHERE key = 'factura_num'`);

    // Insertar factura
    const result = await db.execute(
        `INSERT INTO facturas (numero_factura, cliente_id, usuario_id, subtotal, impuesto, total, metodo_pago, estado, nota, fecha) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [numero_factura, facturaData.cliente_id || null, facturaData.usuario_id, facturaData.subtotal, facturaData.impuesto, facturaData.total, facturaData.metodo_pago || 'efectivo', 'pagada', facturaData.nota || '', now()]
    );

    const facturaId = result.lastInsertId;

    // Insertar detalles y descontar stock
    for (const det of detalles) {
        await db.execute(
            `INSERT INTO detalle_factura (factura_id, item_id, descripcion, cantidad, precio_unitario, subtotal) VALUES ($1, $2, $3, $4, $5, $6)`,
            [facturaId, det.item_id, det.descripcion, det.cantidad, det.precio_unitario, det.subtotal]
        );

        // Descontar stock si es producto
        const itemRows = await db.select(`SELECT * FROM items WHERE id = $1`, [det.item_id]);
        if (itemRows.length > 0 && itemRows[0].es_producto) {
            const newStock = Math.max(0, itemRows[0].stock - det.cantidad);
            await db.execute(`UPDATE items SET stock = $1, actualizado_en = $2 WHERE id = $3`, [newStock, now(), det.item_id]);
        }
    }

    return await getById('facturas', facturaId);
}

// ── Trabajos ──

export async function crearTrabajo(data) {
    const monto_descuento = data.tiene_descuento ? Number(data.monto_descuento) || 0 : 0;
    const saldo_pendiente = Number(data.precio_total) - monto_descuento;

    const result = await db.execute(
        `INSERT INTO trabajos (cliente_id, usuario_id, descripcion, precio_total, tiene_descuento, monto_descuento, total_abonado, saldo_pendiente, estado, fecha_recibido, fecha_entrega_estimada, fecha_entrega_real, nota) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [data.cliente_id, data.usuario_id, data.descripcion, Number(data.precio_total), data.tiene_descuento ? 1 : 0, monto_descuento, 0, saldo_pendiente, 'pendiente', now(), data.fecha_entrega_estimada || null, null, data.nota || '']
    );

    return await getById('trabajos', result.lastInsertId);
}

export async function registrarAbono(trabajo_id, monto, metodo_pago, nota) {
    const trabajo = await getById('trabajos', trabajo_id);
    if (!trabajo) return { error: 'Trabajo no encontrado' };

    const montoNum = Number(monto);
    if (montoNum <= 0) return { error: 'El monto debe ser mayor a 0' };
    if (montoNum > trabajo.saldo_pendiente) return { error: `El abono no puede exceder el saldo pendiente (RD$${trabajo.saldo_pendiente.toFixed(2)})` };

    // Insertar abono
    const result = await db.execute(
        `INSERT INTO abonos_trabajo (trabajo_id, monto, metodo_pago, nota, fecha) VALUES ($1, $2, $3, $4, $5)`,
        [Number(trabajo_id), montoNum, metodo_pago || 'efectivo', nota || '', now()]
    );

    const abonoId = result.lastInsertId;

    // Actualizar trabajo
    const nuevoAbonado = (Number(trabajo.total_abonado) || 0) + montoNum;
    let nuevoPendiente = Number(trabajo.precio_total) - Number(trabajo.monto_descuento) - nuevoAbonado;
    let nuevoEstado = trabajo.estado;
    let fechaEntregaReal = trabajo.fecha_entrega_real;

    if (nuevoPendiente <= 0) {
        nuevoPendiente = 0;
        nuevoEstado = 'entregado';
        fechaEntregaReal = now();
    }

    await db.execute(
        `UPDATE trabajos SET total_abonado = $1, saldo_pendiente = $2, estado = $3, fecha_entrega_real = $4 WHERE id = $5`,
        [nuevoAbonado, nuevoPendiente, nuevoEstado, fechaEntregaReal, Number(trabajo_id)]
    );

    const abono = await getById('abonos_trabajo', abonoId);
    const trabajoActualizado = await getById('trabajos', trabajo_id);
    return { success: true, abono, trabajo: trabajoActualizado };
}

// ── Guardar Trabajo como Factura ──

export async function guardarTrabajoComoFactura(trabajo) {
    const counterRows = await db.select(`SELECT value FROM _counters WHERE key = 'factura_num'`);
    const num = counterRows.length > 0 ? counterRows[0].value : 1;
    const numero_factura = `PCI-${num}`;

    const neto = Number(trabajo.precio_total) - Number(trabajo.monto_descuento || 0);
    const subtotal = neto;
    const impuesto = 0;
    const total = neto;

    await db.execute(`UPDATE _counters SET value = value + 1 WHERE key = 'factura_num'`);

    const result = await db.execute(
        `INSERT INTO facturas (numero_factura, cliente_id, usuario_id, subtotal, impuesto, total, metodo_pago, estado, nota, fecha) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [numero_factura, trabajo.cliente_id || null, trabajo.usuario_id, subtotal, impuesto, total, 'efectivo', 'pagada', `Trabajo Manual #${trabajo.id}: ${trabajo.descripcion}`, now()]
    );

    const facturaId = result.lastInsertId;

    await db.execute(
        `INSERT INTO detalle_factura (factura_id, item_id, descripcion, cantidad, precio_unitario, subtotal) VALUES ($1, $2, $3, $4, $5, $6)`,
        [facturaId, 1, `Trabajo Manual #${trabajo.id}: ${trabajo.descripcion}`, 1, subtotal, subtotal]
    );

    return await getById('facturas', facturaId);
}

// ── Dashboard Stats ──

export async function getDashboardStats() {
    const todayStr = today();

    const ventasHoyResult = await db.select(
        `SELECT COALESCE(SUM(total), 0) as total FROM facturas WHERE fecha LIKE $1 AND estado != 'anulada'`,
        [`${todayStr}%`]
    );
    const ventasHoy = ventasHoyResult[0]?.total || 0;

    const trabajosPendientesResult = await db.select(
        `SELECT COUNT(*) as count FROM trabajos WHERE estado IN ('pendiente', 'en_proceso')`
    );
    const trabajosPendientes = trabajosPendientesResult[0]?.count || 0;

    const productosBajoStock = await db.select(
        `SELECT * FROM items WHERE es_producto = 1 AND activo = 1 AND stock <= stock_minimo`
    );

    const mesActual = new Date().toISOString().slice(0, 7);
    const ingresosMensualesResult = await db.select(
        `SELECT COALESCE(SUM(total), 0) as total FROM facturas WHERE fecha LIKE $1 AND estado != 'anulada'`,
        [`${mesActual}%`]
    );
    const ingresosMensuales = ingresosMensualesResult[0]?.total || 0;

    // Ventas últimos 7 días
    const ventasPorDia = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        const result = await db.select(
            `SELECT COALESCE(SUM(total), 0) as total FROM facturas WHERE fecha LIKE $1 AND estado != 'anulada'`,
            [`${ds}%`]
        );
        ventasPorDia.push({
            dia: d.toLocaleDateString('es-DO', { weekday: 'short', day: 'numeric' }),
            total: result[0]?.total || 0,
        });
    }

    const ultimosTrabajos = await db.select(
        `SELECT * FROM trabajos WHERE estado != 'entregado' ORDER BY id DESC LIMIT 5`
    );

    const totalFacturasResult = await db.select(`SELECT COUNT(*) as count FROM facturas`);
    const totalFacturas = totalFacturasResult[0]?.count || 0;

    return {
        ventasHoy,
        trabajosPendientes,
        productosBajoStock,
        ingresosMensuales,
        ventasPorDia,
        ultimosTrabajos,
        totalFacturas,
    };
}

// ── Utils (síncronos — no necesitan DB) ──

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

export async function resetDB() {
    if (db) {
        await db.execute("DELETE FROM abonos_trabajo");
        await db.execute("DELETE FROM detalle_factura");
        await db.execute("DELETE FROM facturas");
        await db.execute("DELETE FROM trabajos");
        await db.execute("DELETE FROM items");
        await db.execute("DELETE FROM categorias");
        await db.execute("DELETE FROM clientes");
        await db.execute("DELETE FROM usuarios");
        await db.execute("DELETE FROM _counters");
        window.location.reload();
    }
}
