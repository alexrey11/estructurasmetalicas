import { useStore } from '@/store/useStore';
import type { Resultado } from '@/lib/types';

export function exportarDatos(): string {
    const { sesion, ...datos } = useStore.getState();
    return JSON.stringify({ version: 2, fecha: new Date().toISOString(), datos }, null, 2);
}

export function descargarBackup(): void {
    const json = exportarDatos();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metaltrike-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

export async function importarBackup(archivo: File): Promise<Resultado> {
    try {
        const texto = await archivo.text();
        const parsed = JSON.parse(texto);
        if (!parsed.datos) return { ok: false, error: 'Archivo inválido (no contiene datos).' };
        if (parsed.version !== 2) return { ok: false, error: 'Versión de backup incompatible.' };
        useStore.setState({ ...parsed.datos, sesion: useStore.getState().sesion });
        return { ok: true, data: null };
    } catch {
        return { ok: false, error: 'No se pudo leer el archivo.' };
    }
}

export function resetearTodo(): void {
    if (!window.confirm('¿Borrar TODOS los datos? Esta acción no se puede deshacer.')) return;
    useStore.setState(useStore.getInitialState(), true);
    window.location.reload();
}