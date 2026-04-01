// =============================================
// JRJ Centro de Copias y Servicios
// Data Store — SQLite via sql.js
// =============================================

import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

let db = null;
let _dbReady = false;
let _saveTimer = null;

// ── Helpers para IndexedDB (SQL Live Web) ──
const IDB_NAME = 'jrj_sql_live';
const IDB_STORE = 'sqlite_store';

function getIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(IDB_NAME, 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(IDB_STORE)) {
                db.createObjectStore(IDB_STORE);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function loadFromIndexedDB(key) {
    try {
        const db = await getIndexedDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(IDB_STORE, 'readonly');
            const store = tx.objectStore(IDB_STORE);
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.warn('IndexedDB no disponible para cargar:', e);
        return null;
    }
}

async function saveToIndexedDB(key, data) {
    try {
        const db = await getIndexedDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(IDB_STORE, 'readwrite');
            const store = tx.objectStore(IDB_STORE);
            const req = store.put(data, key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.warn('IndexedDB no disponible para guardar:', e);
    }
}

// ── Inicialización ──

export async function initDatabase() {
    const SQL = await initSqlJs({
        locateFile: file => wasmUrl
    });

    // Intentar cargar DB existente desde archivo (Electron) o IndexedDB (browser)
    let savedData = null;

    if (window.electronAPI && window.electronAPI.loadDatabase) {
        try {
            savedData = await window.electronAPI.loadDatabase();
        } catch (e) {
            console.warn('No se pudo cargar DB desde archivo:', e);
        }
    } else {
        // Fallback: IndexedDB (Local SQL Live)
        const idbData = await loadFromIndexedDB('jrj_sqlite_db');
        if (idbData && idbData.length > 0) {
            savedData = idbData;
        } else {
             // Fallback legacy (por si actualizan desde localStorage)
            const lsData = localStorage.getItem('jrj_sqlite_db');
            if (lsData) {
                try {
                    const binary = atob(lsData);
                    savedData = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) {
                        savedData[i] = binary.charCodeAt(i);
                    }
                } catch (e) {}
            }
        }
    }

    if (savedData && savedData.length > 0) {
        try {
            db = new SQL.Database(new Uint8Array(savedData));
            // Verificar que las tablas existen
            const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
            if (!tables.length || tables[0].values.length < 2) {
                throw new Error('DB corrupta o vacía');
            }
            // Migrar: agregar columna foto si no existe
            migrateDB();
        } catch (e) {
            console.warn('DB corrupta, creando nueva:', e);
            db = new SQL.Database();
            createTables();
            seedData();
        }
    } else {
        db = new SQL.Database();
        createTables();
        seedData();
    }

    _dbReady = true;
    persistDB();
    return db;
}

export function isDBReady() {
    return _dbReady;
}

// ── Crear Tablas ──

function createTables() {
    db.run(`
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

    db.run(`
        CREATE TABLE IF NOT EXISTS categorias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT UNIQUE NOT NULL,
            descripcion TEXT DEFAULT ''
        )
    `);

    db.run(`
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

    db.run(`
        CREATE TABLE IF NOT EXISTS clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            telefono TEXT DEFAULT '',
            direccion TEXT DEFAULT '',
            creado_en TEXT DEFAULT (datetime('now','localtime'))
        )
    `);

    db.run(`
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

    db.run(`
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

    db.run(`
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

    db.run(`
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

    db.run(`
        CREATE TABLE IF NOT EXISTS _counters (
            key TEXT PRIMARY KEY,
            value INTEGER NOT NULL
        )
    `);
}

// ── Migración (agregar columnas nuevas si faltan) ──

function migrateDB() {
    // Agregar columna foto a usuarios si no existe
    try {
        const cols = db.exec("PRAGMA table_info(usuarios)");
        if (cols.length > 0) {
            const colNames = cols[0].values.map(row => row[1]);
            if (!colNames.includes('foto')) {
                db.run("ALTER TABLE usuarios ADD COLUMN foto TEXT DEFAULT ''");
            }
            if (!colNames.includes('telefono')) {
                db.run("ALTER TABLE usuarios ADD COLUMN telefono TEXT DEFAULT ''");
            }
            if (!colNames.includes('correo')) {
                db.run("ALTER TABLE usuarios ADD COLUMN correo TEXT DEFAULT ''");
            }
            if (!colNames.includes('direccion')) {
                db.run("ALTER TABLE usuarios ADD COLUMN direccion TEXT DEFAULT ''");
            }
            if (!colNames.includes('bio')) {
                db.run("ALTER TABLE usuarios ADD COLUMN bio TEXT DEFAULT ''");
            }
        }
    } catch (e) {
        console.warn('Error en migración:', e);
    }
}

// ── Seed Data ──

function seedData() {
    // Usuarios
    db.run(`INSERT INTO usuarios (nombre, usuario, contrasena_hash, rol, activo, creado_en) VALUES (?, ?, ?, ?, ?, ?)`,
        ['José Rodríguez', 'admin', 'admin123', 'admin', 1, '2025-01-01T08:00:00']);
    db.run(`INSERT INTO usuarios (nombre, usuario, contrasena_hash, rol, activo, creado_en) VALUES (?, ?, ?, ?, ?, ?)`,
        ['María García', 'maria', 'maria123', 'empleado', 1, '2025-02-15T09:00:00']);

    // Categorías
    db.run(`INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)`, ['Útiles Escolares', 'Material escolar y de oficina']);
    db.run(`INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)`, ['Consumibles Impresora', 'Tinta, tóner, papel']);
    db.run(`INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)`, ['Servicios de Copias', 'Fotocopias, impresiones, encuadernados']);
    db.run(`INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)`, ['Decoración', 'Artículos y servicios de decoración']);

    // Items (Productos)
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
    items.forEach(item => {
        db.run(`INSERT INTO items (es_producto, nombre, descripcion, precio_venta, costo, stock, stock_minimo, categoria_id, activo, creado_en, actualizado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, item);
    });

    // Clientes
    db.run(`INSERT INTO clientes (nombre, telefono, direccion, creado_en) VALUES (?, ?, ?, ?)`,
        ['Jeff Martínez', '809-555-0001', 'Calle Duarte #15, Monte Cristi', '2025-01-15']);
    db.run(`INSERT INTO clientes (nombre, telefono, direccion, creado_en) VALUES (?, ?, ?, ?)`,
        ['Ana Pérez', '809-555-0002', 'Av. Mella #45', '2025-02-01']);
    db.run(`INSERT INTO clientes (nombre, telefono, direccion, creado_en) VALUES (?, ?, ?, ?)`,
        ['Carlos Rodríguez', '829-555-0003', 'Los Girasoles #8', '2025-02-10']);

    // Facturas
    db.run(`INSERT INTO facturas (numero_factura, cliente_id, usuario_id, subtotal, impuesto, total, metodo_pago, estado, nota, fecha) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['PCI-4', 1, 1, 2915.25, 524.75, 3440.00, 'efectivo', 'pagada', '', '2025-02-20T10:30:00']);
    db.run(`INSERT INTO facturas (numero_factura, cliente_id, usuario_id, subtotal, impuesto, total, metodo_pago, estado, nota, fecha) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['PCI-5', 2, 1, 500.00, 90.00, 590.00, 'tarjeta', 'pagada', '', '2025-02-25T09:00:00']);

    // Detalle factura
    db.run(`INSERT INTO detalle_factura (factura_id, item_id, descripcion, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?, ?)`,
        [1, 5, 'Cajas de Sardina', 7, 213.06, 1188.44]);
    db.run(`INSERT INTO detalle_factura (factura_id, item_id, descripcion, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?, ?)`,
        [1, 6, 'Mayonesa', 8, 97.63, 543.37]);
    db.run(`INSERT INTO detalle_factura (factura_id, item_id, descripcion, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?, ?)`,
        [1, 5, 'Cajas de Sardina', 7, 213.06, 1188.44]);
    db.run(`INSERT INTO detalle_factura (factura_id, item_id, descripcion, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?, ?)`,
        [2, 1, 'Resma de Papel A4', 2, 250.00, 500.00]);

    // Trabajos
    db.run(`INSERT INTO trabajos (cliente_id, usuario_id, descripcion, precio_total, tiene_descuento, monto_descuento, total_abonado, saldo_pendiente, estado, fecha_recibido, fecha_entrega_estimada, fecha_entrega_real, nota) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 1, 'Decoración de salón para fiesta de cumpleaños', 5000.00, 1, 500.00, 2000.00, 2500.00, 'en_proceso', '2025-02-18T08:00:00', '2025-02-28', null, 'Tema: unicornios']);
    db.run(`INSERT INTO trabajos (cliente_id, usuario_id, descripcion, precio_total, tiene_descuento, monto_descuento, total_abonado, saldo_pendiente, estado, fecha_recibido, fecha_entrega_estimada, fecha_entrega_real, nota) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [3, 1, 'Impresión de 200 invitaciones', 3000.00, 0, 0, 3000.00, 0, 'entregado', '2025-02-10T09:00:00', '2025-02-15', '2025-02-14T16:00:00', '']);

    // Abonos
    db.run(`INSERT INTO abonos_trabajo (trabajo_id, monto, metodo_pago, nota, fecha) VALUES (?, ?, ?, ?, ?)`,
        [1, 1000.00, 'efectivo', 'Primer abono', '2025-02-18T08:00:00']);
    db.run(`INSERT INTO abonos_trabajo (trabajo_id, monto, metodo_pago, nota, fecha) VALUES (?, ?, ?, ?, ?)`,
        [1, 1000.00, 'transferencia', 'Segundo abono', '2025-02-22T10:00:00']);
    db.run(`INSERT INTO abonos_trabajo (trabajo_id, monto, metodo_pago, nota, fecha) VALUES (?, ?, ?, ?, ?)`,
        [2, 3000.00, 'efectivo', 'Pago total', '2025-02-10T09:00:00']);

    // Contador
    db.run(`INSERT OR REPLACE INTO _counters (key, value) VALUES (?, ?)`, ['factura_num', 5]);
}

// ── Persistencia ──

function persistDB() {
    if (!db) return;
    // Debounce: guardar 500ms después del último cambio
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
        const data = db.export();
        if (window.electronAPI && window.electronAPI.saveDatabase) {
            window.electronAPI.saveDatabase(Array.from(data));
        } else {
            // Fallback: IndexedDB (Live SQL Web)
            saveToIndexedDB('jrj_sqlite_db', data);
        }
    }, 500);
}

// ── Helpers SQL ──

function queryAll(sql, params = []) {
    const result = db.exec(sql, params);
    if (!result.length) return [];
    const cols = result[0].columns;
    return result[0].values.map(row => {
        const obj = {};
        cols.forEach((col, i) => {
            obj[col] = row[i];
        });
        // Convertir campos booleanos de SQLite (0/1) a JavaScript
        if ('activo' in obj) obj.activo = !!obj.activo;
        if ('es_producto' in obj) obj.es_producto = !!obj.es_producto;
        if ('tiene_descuento' in obj) obj.tiene_descuento = !!obj.tiene_descuento;
        return obj;
    });
}

function queryOne(sql, params = []) {
    const rows = queryAll(sql, params);
    return rows.length > 0 ? rows[0] : null;
}

function runSql(sql, params = []) {
    db.run(sql, params);
    persistDB();
}

function getLastInsertId() {
    const result = db.exec("SELECT last_insert_rowid()");
    return result[0].values[0][0];
}

function now() {
    return new Date().toISOString();
}

function today() {
    return new Date().toISOString().split('T')[0];
}

// ── Generic CRUD ──

export function getAll(entity) {
    return queryAll(`SELECT * FROM ${entity}`);
}

export function getById(entity, id) {
    return queryOne(`SELECT * FROM ${entity} WHERE id = ?`, [Number(id)]);
}

export function create(entity, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    runSql(`INSERT INTO ${entity} (${keys.join(', ')}) VALUES (${placeholders})`, values);
    const newId = getLastInsertId();
    persistDB();
    return getById(entity, newId);
}

export function update(entity, id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    runSql(`UPDATE ${entity} SET ${setClause} WHERE id = ?`, [...values, Number(id)]);
    persistDB();
    return getById(entity, id);
}

export function remove(entity, id) {
    runSql(`DELETE FROM ${entity} WHERE id = ?`, [Number(id)]);
    persistDB();
}

// ── Auth ──

export function authenticate(usuario, password) {
    const user = queryOne(`SELECT * FROM usuarios WHERE usuario = ? AND contrasena_hash = ?`, [usuario, password]);
    if (!user) return { success: false, error: 'Usuario o contraseña incorrectos' };
    if (!user.activo) return { success: false, error: 'Usuario desactivado. Contacte al administrador.' };
    return { success: true, user: { id: user.id, nombre: user.nombre, usuario: user.usuario, rol: user.rol } };
}

// ── Fotos de Perfil ──

export function guardarFotoUsuario(id, base64Data) {
    runSql(`UPDATE usuarios SET foto = ? WHERE id = ?`, [base64Data || '', Number(id)]);
    persistDB();
}

export function obtenerFotoUsuario(id) {
    const user = queryOne(`SELECT foto FROM usuarios WHERE id = ?`, [Number(id)]);
    return user && user.foto ? user.foto : null;
}

export function eliminarFotoUsuario(id) {
    runSql(`UPDATE usuarios SET foto = '' WHERE id = ?`, [Number(id)]);
    persistDB();
}

// ── Facturación ──

export function getNextFacturaNum() {
    const counter = queryOne(`SELECT value FROM _counters WHERE key = 'factura_num'`);
    const num = counter ? counter.value : 1;
    return `PCI-${num}`;
}

export function crearFactura(facturaData, detalles) {
    const counter = queryOne(`SELECT value FROM _counters WHERE key = 'factura_num'`);
    const num = counter ? counter.value : 1;
    const numero_factura = `PCI-${num}`;

    // Incrementar contador
    runSql(`UPDATE _counters SET value = value + 1 WHERE key = 'factura_num'`);

    // Insertar factura
    runSql(`INSERT INTO facturas (numero_factura, cliente_id, usuario_id, subtotal, impuesto, total, metodo_pago, estado, nota, fecha) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        numero_factura,
        facturaData.cliente_id || null,
        facturaData.usuario_id,
        facturaData.subtotal,
        facturaData.impuesto,
        facturaData.total,
        facturaData.metodo_pago || 'efectivo',
        'pagada',
        facturaData.nota || '',
        now(),
    ]);

    const facturaId = getLastInsertId();

    // Insertar detalles y descontar stock
    detalles.forEach(det => {
        runSql(`INSERT INTO detalle_factura (factura_id, item_id, descripcion, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?, ?)`, [
            facturaId, det.item_id, det.descripcion, det.cantidad, det.precio_unitario, det.subtotal,
        ]);

        // Descontar stock si es producto
        const item = queryOne(`SELECT * FROM items WHERE id = ?`, [det.item_id]);
        if (item && item.es_producto) {
            const newStock = Math.max(0, item.stock - det.cantidad);
            runSql(`UPDATE items SET stock = ?, actualizado_en = ? WHERE id = ?`, [newStock, now(), det.item_id]);
        }
    });

    persistDB();
    return getById('facturas', facturaId);
}

// ── Trabajos ──

export function crearTrabajo(data) {
    const monto_descuento = data.tiene_descuento ? Number(data.monto_descuento) || 0 : 0;
    const saldo_pendiente = Number(data.precio_total) - monto_descuento;

    runSql(`INSERT INTO trabajos (cliente_id, usuario_id, descripcion, precio_total, tiene_descuento, monto_descuento, total_abonado, saldo_pendiente, estado, fecha_recibido, fecha_entrega_estimada, fecha_entrega_real, nota) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        data.cliente_id,
        data.usuario_id,
        data.descripcion,
        Number(data.precio_total),
        data.tiene_descuento ? 1 : 0,
        monto_descuento,
        0,
        saldo_pendiente,
        'pendiente',
        now(),
        data.fecha_entrega_estimada || null,
        null,
        data.nota || '',
    ]);

    const id = getLastInsertId();
    persistDB();
    return getById('trabajos', id);
}

export function registrarAbono(trabajo_id, monto, metodo_pago, nota) {
    const trabajo = getById('trabajos', trabajo_id);
    if (!trabajo) return { error: 'Trabajo no encontrado' };

    const montoNum = Number(monto);
    if (montoNum <= 0) return { error: 'El monto debe ser mayor a 0' };
    if (montoNum > trabajo.saldo_pendiente) return { error: `El abono no puede exceder el saldo pendiente (RD$${trabajo.saldo_pendiente.toFixed(2)})` };

    // Insertar abono
    runSql(`INSERT INTO abonos_trabajo (trabajo_id, monto, metodo_pago, nota, fecha) VALUES (?, ?, ?, ?, ?)`, [
        Number(trabajo_id), montoNum, metodo_pago || 'efectivo', nota || '', now(),
    ]);

    const abonoId = getLastInsertId();

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

    runSql(`UPDATE trabajos SET total_abonado = ?, saldo_pendiente = ?, estado = ?, fecha_entrega_real = ? WHERE id = ?`, [
        nuevoAbonado, nuevoPendiente, nuevoEstado, fechaEntregaReal, Number(trabajo_id),
    ]);

    persistDB();

    const abono = getById('abonos_trabajo', abonoId);
    const trabajoActualizado = getById('trabajos', trabajo_id);
    return { success: true, abono, trabajo: trabajoActualizado };
}

// ── Guardar Trabajo como Factura ──

export function guardarTrabajoComoFactura(trabajo) {
    // Obtener siguiente número de factura
    const counter = queryOne(`SELECT value FROM _counters WHERE key = 'factura_num'`);
    const num = counter ? counter.value : 1;
    const numero_factura = `PCI-${num}`;

    // Calcular valores
    const neto = Number(trabajo.precio_total) - Number(trabajo.monto_descuento || 0);
    const subtotal = neto;
    const impuesto = 0; // Trabajos manuales sin ITBIS por defecto
    const total = neto;

    // Incrementar contador
    runSql(`UPDATE _counters SET value = value + 1 WHERE key = 'factura_num'`);

    // Insertar factura
    runSql(
        `INSERT INTO facturas (numero_factura, cliente_id, usuario_id, subtotal, impuesto, total, metodo_pago, estado, nota, fecha) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            numero_factura,
            trabajo.cliente_id || null,
            trabajo.usuario_id,
            subtotal,
            impuesto,
            total,
            'efectivo',
            'pagada',
            `Trabajo Manual #${trabajo.id}: ${trabajo.descripcion}`,
            now(),
        ]
    );

    const facturaId = getLastInsertId();

    // Insertar un detalle representando el trabajo
    runSql(
        `INSERT INTO detalle_factura (factura_id, item_id, descripcion, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?, ?)`,
        [facturaId, 1, `Trabajo Manual #${trabajo.id}: ${trabajo.descripcion}`, 1, subtotal, subtotal]
    );

    persistDB();
    return getById('facturas', facturaId);
}

// ── Dashboard Stats ──

export function getDashboardStats() {
    const todayStr = today();

    const ventasHoyResult = queryAll(
        `SELECT COALESCE(SUM(total), 0) as total FROM facturas WHERE fecha LIKE ? AND estado != 'anulada'`,
        [`${todayStr}%`]
    );
    const ventasHoy = ventasHoyResult[0]?.total || 0;

    const trabajosPendientesResult = queryAll(
        `SELECT COUNT(*) as count FROM trabajos WHERE estado IN ('pendiente', 'en_proceso')`
    );
    const trabajosPendientes = trabajosPendientesResult[0]?.count || 0;

    const productosBajoStock = queryAll(
        `SELECT * FROM items WHERE es_producto = 1 AND activo = 1 AND stock <= stock_minimo`
    );

    const mesActual = new Date().toISOString().slice(0, 7);
    const ingresosMensualesResult = queryAll(
        `SELECT COALESCE(SUM(total), 0) as total FROM facturas WHERE fecha LIKE ? AND estado != 'anulada'`,
        [`${mesActual}%`]
    );
    const ingresosMensuales = ingresosMensualesResult[0]?.total || 0;

    // Ventas últimos 7 días
    const ventasPorDia = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        const result = queryAll(
            `SELECT COALESCE(SUM(total), 0) as total FROM facturas WHERE fecha LIKE ? AND estado != 'anulada'`,
            [`${ds}%`]
        );
        ventasPorDia.push({
            dia: d.toLocaleDateString('es-DO', { weekday: 'short', day: 'numeric' }),
            total: result[0]?.total || 0,
        });
    }

    const ultimosTrabajos = queryAll(
        `SELECT * FROM trabajos WHERE estado != 'entregado' ORDER BY id DESC LIMIT 5`
    );

    const totalFacturasResult = queryAll(`SELECT COUNT(*) as count FROM facturas`);
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
    if (window.electronAPI && window.electronAPI.deleteDatabase) {
        window.electronAPI.deleteDatabase();
        window.location.reload();
    } else {
        localStorage.removeItem('jrj_sqlite_db');
        localStorage.removeItem('jrj_sistema_db');
        const req = indexedDB.deleteDatabase(IDB_NAME);
        req.onsuccess = () => window.location.reload();
        req.onerror = () => window.location.reload();
    }
}
