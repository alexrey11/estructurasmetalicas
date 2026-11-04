import { useShallow } from 'zustand/react/shallow';
import { useState, type FormEvent } from 'react';
import { Pencil, Plus, Settings2, Trash2 } from 'lucide-react';
import Boton from '@/components/ui/Boton';
import Campo, { claseInput } from '@/components/ui/Campo';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import type { Triciclo } from '@/lib/types';
import { formatMonto } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import TricicloIcon from '@/components/TricicloIcon';

type Edicion = { modo: 'nuevo' } | { modo: 'editar'; triciclo: Triciclo } | null;

export default function GestionTriciclos() {
    const { triciclos, moneda, eliminarTriciclo } = useStore(
        useShallow((s) => ({
            triciclos: s.triciclos,
            moneda: s.config.moneda,
            eliminarTriciclo: s.eliminarTriciclo,
        }))
    );
    const { mostrar } = useToast();
    const [edicion, setEdicion] = useState<Edicion>(null);

    const borrar = (triciclo: Triciclo) => {
        if (!window.confirm(`¿Eliminar "${triciclo.nombre}"? Solo se puede si no tiene alquileres.`)) return;
        const r = eliminarTriciclo(triciclo.id);
        mostrar(r.ok ? 'Triciclo eliminado.' : r.error, r.ok ? 'exito' : 'error');
    };

    return (
        <Card className="space-y-4 border-slate-300 bg-slate-50">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Settings2 size={20} className="text-slate-700" />
                    <h2 className="text-lg font-semibold text-slate-900">Flota de triciclos</h2>
                </div>
                <Boton onClick={() => setEdicion({ modo: 'nuevo' })} className="min-h-11" variante="secundaria">
                    <Plus size={18} /> Añadir
                </Boton>
            </div>

            <ul className="divide-y divide-slate-200">
                {triciclos.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-slate-700 shadow-sm border border-slate-200">
                                <TricicloIcon size={20} />
                            </span>
                            <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900">{t.nombre}</p>
                                <p className="truncate text-xs text-slate-500">
                                    {formatMonto(t.tarifaPorMinuto, moneda)}/min · {t.estado}
                                </p>
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setEdicion({ modo: 'editar', triciclo: t })}
                                aria-label={`Editar ${t.nombre}`}
                                className="grid size-10 place-items-center rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition"
                            >
                                <Pencil size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => borrar(t)}
                                aria-label={`Eliminar ${t.nombre}`}
                                className="grid size-10 place-items-center rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>

            <Modal
                abierto={edicion !== null}
                onCerrar={() => setEdicion(null)}
                titulo={edicion?.modo === 'editar' ? 'Editar triciclo' : 'Nuevo triciclo'}
            >
                {edicion && (
                    <TricicloForm
                        triciclo={edicion.modo === 'editar' ? edicion.triciclo : undefined}
                        onGuardado={() => setEdicion(null)}
                    />
                )}
            </Modal>
        </Card>
    );
}

function TricicloForm({ triciclo, onGuardado }: { triciclo?: Triciclo; onGuardado: () => void }) {
    const crearTriciclo = useStore((s) => s.crearTriciclo);
    const actualizarTriciclo = useStore((s) => s.actualizarTriciclo);
    const { mostrar } = useToast();
    const [nombre, setNombre] = useState(triciclo?.nombre ?? '');
    const [tarifa, setTarifa] = useState(String(triciclo?.tarifaPorMinuto ?? '5'));
    const [error, setError] = useState('');

    const enviar = (evento: FormEvent) => {
        evento.preventDefault();
        const datos = { nombre, tarifaPorMinuto: Number(tarifa) };
        const r = triciclo
            ? actualizarTriciclo(triciclo.id, datos)
            : crearTriciclo(datos);

        if (!r.ok) {
            setError(r.error);
            return;
        }
        mostrar(triciclo ? 'Triciclo actualizado.' : 'Triciclo añadido a la flota.');
        onGuardado();
    };

    return (
        <form onSubmit={enviar} className="space-y-4">
            <Campo etiqueta="Nombre del triciclo">
                <input
                    className={claseInput}
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Triciclo 3 - El Rayo"
                />
            </Campo>
            <Campo etiqueta="Tarifa por minuto" ayuda="Precio que cobras por cada minuto de alquiler">
                <input
                    type="number"
                    inputMode="decimal"
                    min="0.1"
                    step="0.1"
                    className={claseInput}
                    value={tarifa}
                    onChange={(e) => setTarifa(e.target.value)}
                />
            </Campo>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Boton type="submit" bloque>
                {triciclo ? 'Guardar cambios' : 'Crear triciclo'}
            </Boton>
        </form>
    );
}