import { useRef } from 'react';
import { Download, RotateCcw, Upload } from 'lucide-react';
import Boton from '@/components/ui/Boton';
import Card from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { descargarBackup, importarBackup, resetearTodo } from '@/lib/backup';

export default function BackupPanel() {
    const inputRef = useRef<HTMLInputElement>(null);
    const { mostrar } = useToast();

    const importar = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;
        const r = await importarBackup(archivo);
        if (r.ok) {
            mostrar('Backup importado correctamente.');
            setTimeout(() => window.location.reload(), 600);
        } else {
            mostrar(r.error, 'error');
        }
        e.target.value = '';
    };

    return (
        <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Datos y respaldo</h2>
            <p className="text-xs text-emerald-700">
                ✅ Backup automático diario en Documentos/MetalTrike si no Exportar Backup al Día
            </p>

            <div className="grid gap-2 sm:grid-cols-2">
                <Boton onClick={() => { descargarBackup(); mostrar('Backup descargado.'); }} variante="secundaria">
                    <Download size={18} /> Exportar datos
                </Boton>
                <Boton onClick={() => inputRef.current?.click()} variante="secundaria">
                    <Upload size={18} /> Importar datos
                </Boton>
            </div>
            <input ref={inputRef} type="file" accept=".json,application/json" onChange={importar} className="hidden" />

            <div className="border-t border-slate-200 pt-4">
                <p className="mb-2 text-sm font-medium text-red-700">Zona peligrosa</p>
                <Boton onClick={resetearTodo} variante="peligro" bloque>
                    <RotateCcw size={18} /> Borrar todos los datos
                </Boton>
            </div>
        </Card>
    );
}