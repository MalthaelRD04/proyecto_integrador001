// =============================================
// JRJ Centro de Copias y Servicios
// Backup Utility — SQLite Database Protection
// =============================================

import { writeBinaryFile, readBinaryFile } from '@tauri-apps/plugin-fs';
import { save } from '@tauri-apps/plugin-dialog';
import { Database } from '@tauri-apps/plugin-sql';

export async function backupDatabase() {
    try {
        // 1. Localizar la base de datos SQLite nativa de Tauri
        // Por defecto, Tauri SQL guarda en la carpeta de datos de la app
        const dbPath = 'jrj_sistema.db'; 
        
        // 2. Abrir diálogo de guardado para que el usuario elija dónde poner el backup
        const savePath = await save({
            filters: [{ name: 'SQLite DB', extensions: ['db'] }],
            defaultPath: `backup_jrj_${new Date().toISOString().split('T')[0]}.db`
        });

        if (!savePath) return { success: false, message: 'Operación cancelada' };

        // 3. Leer la base de datos y escribirla en la nueva ruta
        // Nota: Dependiendo de la versión del plugin FS, esto puede variar.
        // Usamos la lectura binaria para asegurar la integridad del archivo .db
        const data = await readBinaryFile(dbPath);
        await writeBinaryFile(savePath, data);

        return { success: true, path: savePath };
    } catch (e) {
        console.error("Error en backup:", e);
        return { success: false, message: e.message };
    }
}

export async function restoreDatabase(backupFile) {
    try {
        // 1. Leer el archivo de backup seleccionado
        const data = await readBinaryFile(backupFile);
        
        // 2. Sobrescribir el archivo de base de datos activo
        await writeBinaryFile('jrj_sistema.db', data);
        
        return { success: true };
    } catch (e) {
        console.error("Error en restauración:", e);
        return { success: false, message: e.message };
    }
}
