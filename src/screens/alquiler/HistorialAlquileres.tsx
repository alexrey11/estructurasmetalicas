import { useShallow } from 'zustand/react/shallow';
import { useMemo, useState } from 'react';
import { ChevronDown, Clock, Receipt, Phone, IdCard } from 'lucide-react';
import Card from '@/components/ui/Card';
import EstadoVacio from '@/components/ui/EstadoVacio';
import { claseInput } from '@/components/ui/Campo';
import { format } from 'date-fns';
import { formatFecha, formatMonto } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import TricicloIcon from '@/components/TricicloIcon';

export default function HistorialAlquileres() {
    const { alquileres, triciclos, moneda } = useStore(
        useShallow((s) => ({
            alquileres: s.alquileres, triciclos: s.triciclos, moneda: s.config.moneda,
        }))
    );
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');
    const [tricicloFiltro, setTricicloFiltro] = useState('todos');
    const [abierta, setAbierta] = useState<string | null>(null);

    const filtrados = useMemo(() => {
        return alquileres
            .filter((a) => {
                if (a.estado !== 'finalizado' || !a.fin) return false;
                const dia = format(new Date(a.fin), 'yyyy-MM-dd');
                if (desde && dia < desde) return false;
                if (hasta && dia > hasta) return false;
                if (tricicloFiltro !== 'todos' && a.tricicloId !== tricicloFiltro) return false;
                return true;
            })
            .sort((a, b) => new Date(b.fin!).getTime() - new Date(a.fin!).getTime());
    }, [alquileres, desde, hasta, tricicloFiltro]);

    const totalFiltrado = filtrados.reduce((suma, a) => suma + (a.monto ?? 0), 0);

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Historial de alquileres</h2>
            </div>

            <Card className="grid gap-3 p-4 sm:grid-cols-3">
                <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">Desde</span>
                    <input type="date" className={claseInput} value={desde} onChange={(e) => setDesde(e.target.value)} />
                </label>
                <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">Hasta</span>
                    <input type="date" className={claseInput} value={hasta} onChange={(e) => setHasta(e.target.value)} />
                </label>
                <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">Triciclo</span>
                    <select className={claseInput} value={tricicloFiltro} onChange={(e) => setTricicloFiltro(e.target.value)}>
                        <option value="todos">Todos</option>
                        {triciclos.map((t) => (<option key={t.id} value={t.id}>{t.nombre}</option>))}
                    </select>
                </label>
            </Card>

            <p className="text-sm text-slate-600">
                {filtrados.length} alquiler(es) · Total {formatMonto(totalFiltrado, moneda)}
            </p>

            {filtrados.length === 0 ? (
                <EstadoVacio Icono={Receipt} titulo="No hay alquileres finalizados" texto="Cuando cierres un alquiler aparecerá aquí." />
            ) : (
                <ul className="space-y-3">
                    {filtrados.map((alquiler) => {
                        const triciclo = triciclos.find((t) => t.id === alquiler.tricicloId);
                        const expandida = abierta === alquiler.id;
                        return (
                            <li key={alquiler.id}>
                                <Card className="p-0">
                                    <button
                                        type="button"
                                        onClick={() => setAbierta(expandida ? null : alquiler.id)}
                                        aria-expanded={expandida}
                                        className="flex w-full items-center justify-between gap-3 rounded-2xl p-4 text-left transition hover:bg-slate-50"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="truncate font-semibold text-slate-900">{alquiler.cliente}</p>
                                                <p className="font-bold tabular-nums text-slate-900">{formatMonto(alquiler.monto ?? 0, moneda)}</p>
                                            </div>
                                            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                                <span className="flex items-center gap-1"><Clock size={12} />{formatFecha(alquiler.fin!)}</span>
                                                <span className="flex items-center gap-1"><TricicloIcon size={12} />{triciclo?.nombre ?? 'Triciclo eliminado'}</span>
                                            </div>
                                        </div>
                                        <ChevronDown size={18} className={`shrink-0 text-slate-500 transition ${expandida ? 'rotate-180' : ''}`} />
                                    </button>

                                    {expandida && (
                                        <div className="space-y-3 border-t border-slate-100 p-4 text-sm">
                                            <dl className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <dt className="text-xs text-slate-500">Inicio</dt>
                                                    <dd className="font-medium">{formatFecha(alquiler.inicio)}</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-xs text-slate-500">Fin</dt>
                                                    <dd className="font-medium">{formatFecha(alquiler.fin!)}</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-xs text-slate-500">Monto pactado</dt>
                                                    <dd className="font-medium">{formatMonto(alquiler.montoPactado, moneda)}</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-xs text-slate-500">Cobrado</dt>
                                                    <dd className="font-medium">{formatMonto(alquiler.monto ?? 0, moneda)}</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-xs text-slate-500">Método</dt>
                                                    <dd className="font-medium capitalize">{alquiler.metodoPago ?? '—'}</dd>
                                                </div>
                                            </dl>
                                            <div className="rounded-lg bg-slate-50 p-2 text-xs space-y-1">
                                                <p className="flex items-center gap-1.5"><Phone size={12} /> {alquiler.telefono}</p>
                                                <p className="flex items-center gap-1.5"><IdCard size={12} /> {alquiler.carnet}</p>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}