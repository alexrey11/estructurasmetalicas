import { useShallow } from 'zustand/react/shallow';
import { useState, type FormEvent } from 'react';
import { BatteryCharging, Pencil, Plus, Settings2, Trash2 } from 'lucide-react';
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
    const { triciclos, moneda, eliminarTriciclo, enviarACargar } = useStore(
        useShallow((s) => ({
            triciclos: s.triciclos, moneda: s.config.moneda,
            eliminarTriciclo: s.eliminarTriciclo, enviarACargar: s.enviarACargar,
        }))
    );
    const { mostrar } = useToast();
    const [edicion, setEdicion] = useState<Edicion>(null);
    const [cargando, setCargando] = useState<Triciclo | null>(null);

    const borrar = (t: Triciclo) => {
        if (!window.confirm(`¿Eliminar "${t.nombre}"? Solo se puede si no tiene alquileres.`)) return;
        const r = eliminarTriciclo(t.id);
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
                                    {formatMonto(t.precioAlquiler, moneda)}/día · {t.estado}
                                </p>
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                            {t.estado !== 'alquilado' && t.estado !== 'cargando' && (
                                <button
                                    type="button"
                                    onClick={() => setCargando(t)}
                                    aria-label={`Cargar ${t.nombre}`}
                                    className="grid size-10 place-items-center rounded-lg text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition"
                                    title="Enviar a cargar"
                                >
                                    <BatteryCharging size={16} />
                                </button>
                            )}
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

            <Modal abierto={cargando !== null} onCerrar={() => setCargando(null)} titulo={`Cargar ${cargando?.nombre ?? ''}`}>
                {cargando && (
                    <FormCarga
                        triciclo={cargando}
                        onGuardado={(horas) => {
                            const r = enviarACargar(cargando.id, horas);
                            if (r.ok) {
                                mostrar(`Triciclo en carga por ${horas}h. Aviso cuando termine.`);
                                setCargando(null);
                            } else {
                                mostrar(r.error, 'error');
                            }
                        }}
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
    const [precio, setPrecio] = useState(String(triciclo?.precioAlquiler ?? '6000'));
    const [error, setError] = useState('');

    const enviar = (evento: FormEvent) => {
        evento.preventDefault();
        const datos = { nombre, precioAlquiler: Number(precio) };
        const r = triciclo ? actualizarTriciclo(triciclo.id, datos) : crearTriciclo(datos);
        if (!r.ok) { setError(r.error); return; }
        mostrar(triciclo ? 'Triciclo actualizado.' : 'Triciclo añadido.');
        onGuardado();
    };

    return (
        <form onSubmit={enviar} className="space-y-4">
            <Campo etiqueta="Nombre del triciclo">
                <input className={claseInput} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Triciclo 3 - El Rayo" />
            </Campo>
            <Campo etiqueta="Precio de alquiler por día">
                <input type="number" inputMode="decimal" min="1" step="1" className={claseInput} value={precio} onChange={(e) => setPrecio(e.target.value)} />
            </Campo>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Boton type="submit" bloque>{triciclo ? 'Guardar cambios' : 'Crear triciclo'}</Boton>
        </form>
    );
}

function FormCarga({ triciclo, onGuardado }: { triciclo: Triciclo; onGuardado: (horas: number) => void }) {
    const [horas, setHoras] = useState('6');
    const horasNum = Number(horas);
    const valido = Number.isFinite(horasNum) && horasNum > 0;
    const fin = valido ? new Date(Date.now() + horasNum * 3600 * 1000) : null;

    return (
        <div className="space-y-4">
            <p className="text-sm text-slate-600">
                ¿Cuántas horas necesita cargar <strong>{triciclo.nombre}</strong>?
            </p>
            <Campo etiqueta="Horas de carga">
                <input type="number" inputMode="decimal" min="0.5" step="0.5" className={claseInput} value={horas} onChange={(e) => setHoras(e.target.value)} />
            </Campo>
            {fin && (
                <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
                    Estará listo a las <strong>{fin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</strong>.
                    La app te avisará cuando termine.
                </p>
            )}
            <Boton bloque onClick={() => valido && onGuardado(horasNum)} disabled={!valido}>
                <BatteryCharging size={18} /> Comenzar carga
            </Boton>
        </div>
    );
}