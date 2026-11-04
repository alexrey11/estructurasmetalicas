import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { useStore } from '@/store/useStore';

const CARPETA_BACKUP = 'MetalTrike';
const CLAVE_ULTIMO_BACKUP = 'ultimo-backup-fecha';

// Devuelve la fecha de hoy en formato YYYY-MM-DD
function hoy(): string {
    return new Date().toISOString().slice(0, 10);
}

// Comprueba si ya se hizo backup hoy (usa localStorage como marca rápida)
function backupHechoHoy(): boolean {
    return localStorage.getItem(CLAVE_ULTIMO_BACKUP) === hoy();
}

function marcarBackupHecho() {
    localStorage.setItem(CLAVE_ULTIMO_BACKUP, hoy());
}

// Exporta el estado actual a JSON (igual que en BackupPanel)
function exportarEstado(): string {
    const { sesion, ...datos } = useStore.getState();
    return JSON.stringify({ version: 5, fecha: new Date().toISOString(), datos }, null, 2);
}

// Escribe el backup en Documents/MetalTrike/backup-YYYY-MM-DD.json
export async function ejecutarBackupDiario(): Promise<{ ok: boolean; error?: string }> {
    // Solo en APK
    if (!Capacitor.isNativePlatform()) {
        return { ok: true }; // En web no hace nada
    }

    // Si ya se hizo hoy, no repetir
    if (backupHechoHoy()) return { ok: true };

    try {
        // 1. Pedir permiso de almacenamiento (necesario en Android 11+)
        const permisos = await Filesystem.requestPermissions();
        if (permisos.publicStorage !== 'granted') {
            return { ok: false, error: 'Permiso de almacenamiento denegado.' };
        }

        // 2. Escribir el archivo
        const json = exportarEstado();
        const nombreArchivo = `backup-${hoy()}.json`;

        await Filesystem.writeFile({
            path: `${CARPETA_BACKUP}/${nombreArchivo}`,
            data: json,
            directory: Directory.Documents,
            encoding: Encoding.UTF8,
            recursive: true, // crea la carpeta si no existe
        });

        marcarBackupHecho();
        return { ok: true };
    } catch (e) {
        console.error('Error en backup automático:', e);
        return { ok: false, error: 'No se pudo escribir el backup. Revisa permisos.' };
    }
}

// Fuerza un backup manual (útil desde el botón del panel)
export async function forzarBackupAhora(): Promise<{ ok: boolean; error?: string }> {
    localStorage.removeItem(CLAVE_ULTIMO_BACKUP);
    return ejecutarBackupDiario();
}