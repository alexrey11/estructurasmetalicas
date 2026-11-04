import { useShallow } from 'zustand/react/shallow';
import { useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import Boton from '@/components/ui/Boton';
import Campo, { claseInput } from '@/components/ui/Campo';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { COLORES_SOCIOS } from '@/lib/seed';
import type { Socio } from '@/lib/types';
import { formatMonto, formatPorcentaje } from '@/lib/utils';
import { calcularPorcentajes } from '@/lib/calculos';
import { useStore } from '@/store/useStore';

type Edicion = { modo: 'nuevo' } | { modo: 'editar'; socio: Socio } | null;

export default function SociosPanel() {
    const { socios, cuentas, moneda, eliminarSocio } = useStore(
        useShallow((s) => ({
            socios: s.socios, cuentas: s.cuentas,
            moneda: s.config.moneda, eliminarSocio: s.eliminarSocio,
        }))
    );
    const { mostrar } = useToast();
    const [edicion, setEdicion] = useState<Edicion>(null);

    const capitales = Object.fromEntries(socios.map((s) => [s.id, cuentas[s.id]?.capital ?? 0]));
    const porcentajes = calcularPorcentajes(capitales);

    const borrar = (socio: Socio) => {
        if (!window.confirm(`¿Eliminar a ${socio.nombre}? Solo se puede si no tiene movimientos.`)) return;
        const r = eliminarSocio(socio.id);
        mostrar(r.ok ? 'Socio eliminado.' : r.error, r.ok ? 'exito' : 'error');
    };

    return (
        <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Users size={20} className="text-slate-700" />
                    <h2 className="text-lg font-semibold text-slate-900">Socios</h2>
                </div>
                <Boton onClick={() => setEdicion({ modo: 'nuevo' })} className="min-h-11">
                    <Plus size={18} /> Añadir socio
                </Boton>
            </div>

            <ul className="divide-y divide-slate-100">
                {socios.map((s) => {
                    const cuenta = cuentas[s.id] ?? { capital: 0, gananciaAcumulada: 0, retiros: 0 };
                    return (
                        <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                                <div className="min-w-0">
                                    <p className="truncate font-semibold text-slate-900">{s.nombre}</p>
                                    <p className="truncate text-xs text-slate-500">
                                        Capital {formatMonto(cuenta.capital, moneda)} · Reparto {formatPorcentaje(porcentajes[s.id] ?? 0)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                                <button type="button" onClick={() => setEdicion({ modo: 'editar', socio: s })}
                                    aria-label={`Editar ${s.nombre}`}
                                    className="grid size-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                                    <Pencil size={16} />
                                </button>
                                <button type="button" onClick={() => borrar(s)}
                                    aria-label={`Eliminar ${s.nombre}`}
                                    className="grid size-10 place-items-center rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600"
                                    disabled={socios.length <= 1}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>

            <Modal abierto={edicion !== null} onCerrar={() => setEdicion(null)}
                titulo={edicion?.modo === 'editar' ? 'Editar socio' : 'Nuevo socio'}>
                {edicion && (
                    <SocioForm socio={edicion.modo === 'editar' ? edicion.socio : undefined}
                        onGuardado={() => setEdicion(null)} />
                )}
            </Modal>
        </Card>
    );
}

function SocioForm({ socio, onGuardado }: { socio?: Socio; onGuardado: () => void }) {
    const crearSocio = useStore((s) => s.crearSocio);
    const actualizarSocio = useStore((s) => s.actualizarSocio);
    const { mostrar } = useToast();
    const [nombre, setNombre] = useState(socio?.nombre ?? '');
    const [pin, setPin] = useState(socio?.pin ?? '1234');
    const [color, setColor] = useState(socio?.color ?? COLORES_SOCIOS[0]);
    const [error, setError] = useState('');

    const enviar = (evento: FormEvent) => {
        evento.preventDefault();
        const r = socio
            ? actualizarSocio(socio.id, { nombre, pin, color })
            : crearSocio({ nombre, pin, color });
        if (!r.ok) { setError(r.error); return; }
        mostrar(socio ? 'Socio actualizado.' : 'Socio creado.');
        onGuardado();
    };

    return (
        <form onSubmit={enviar} className="space-y-4">
            <Campo etiqueta="Nombre">
                <input className={claseInput} value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </Campo>
            <Campo etiqueta="PIN de 4 dígitos">
                <input className={claseInput} inputMode="numeric" maxLength={4}
                    value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
            </Campo>
            <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Color</p>
                <div className="flex flex-wrap gap-2">
                    {COLORES_SOCIOS.map((c) => (
                        <button key={c} type="button" onClick={() => setColor(c)}
                            aria-label={`Color ${c}`} aria-pressed={color === c}
                            className={`size-10 rounded-full border-2 transition ${color === c ? 'border-slate-900' : 'border-transparent'}`}
                            style={{ backgroundColor: c }} />
                    ))}
                </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Boton type="submit" bloque>{socio ? 'Guardar cambios' : 'Crear socio'}</Boton>
        </form>
    );
}