import { useShallow } from 'zustand/react/shallow';
import { useState, type FormEvent } from 'react';
import { Plus, Receipt, Trash2 } from 'lucide-react';
import Boton from '@/components/ui/Boton';
import Campo, { claseInput } from '@/components/ui/Campo';
import Card from '@/components/ui/Card';
import EstadoVacio from '@/components/ui/EstadoVacio';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { formatFecha, formatMonto } from '@/lib/utils';
import { useStore } from '@/store/useStore';

export default function GastosPanel() {
    const { gastos, moneda, registrarGasto } = useStore(
        useShallow((s) => ({ gastos: s.gastos || [], moneda: s.config.moneda, registrarGasto: s.registrarGasto }))
    );
    const { mostrar } = useToast();
    const [abierto, setAbierto] = useState(false);
    const ordenados = [...gastos].sort((a, b) => b.fecha.localeCompare(a.fecha));
    const total = ordenados.reduce((suma, g) => suma + g.monto, 0);

    return (
        <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Gastos Operativos</h2>
                    <p className="text-xs text-slate-500">Total acumulado: {formatMonto(total, moneda)}</p>
                </div>
                <Boton onClick={() => setAbierto(true)} className="min-h-11" variante="secundaria">
                    <Plus size={18} /> Añadir
                </Boton>
            </div>

            {ordenados.length === 0 ? (
                <EstadoVacio Icono={Receipt} titulo="Sin gastos" texto="Registra la luz, transporte, etc." />
            ) : (
                <ul className="divide-y divide-slate-100">
                    {ordenados.map((g) => (
                        <li key={g.id} className="flex items-center justify-between gap-3 py-3">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">{g.descripcion}</p>
                                <p className="truncate text-xs text-slate-500">{formatFecha(g.fecha)}</p>
                            </div>
                            <p className="shrink-0 font-semibold tabular-nums text-red-600">-{formatMonto(g.monto, moneda)}</p>
                        </li>
                    ))}
                </ul>
            )}

            <Modal abierto={abierto} onCerrar={() => setAbierto(false)} titulo="Nuevo gasto">
                {abierto && (
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const fd = new FormData(form);
                        const r = registrarGasto({
                            descripcion: fd.get('descripcion') as string,
                            monto: Number(fd.get('monto')),
                        });
                        if (r.ok) { mostrar('Gasto registrado.'); setAbierto(false); }
                    }} className="space-y-4">
                        <Campo etiqueta="Descripción">
                            <input name="descripcion" required className={claseInput} placeholder="Ej: Pago de luz, transporte" />
                        </Campo>
                        <Campo etiqueta="Monto">
                            <input name="monto" type="number" min="0.1" step="0.01" required className={claseInput} />
                        </Campo>
                        <Boton type="submit" bloque>Registrar gasto</Boton>
                    </form>
                )}
            </Modal>
        </Card>
    );
}