import { useState, useMemo } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { claseInput } from '@/components/ui/Campo';
import { convertir, equivalencias } from '@/lib/calculos';
import { useStore } from '@/store/useStore';
import { formatMonto } from '@/lib/utils';

type Props = { abierto: boolean; onCerrar: () => void };

export default function ConversorMoneda({ abierto, onCerrar }: Props) {
    const monedas = useStore((s) => s.config.monedas);
    const [monto, setMonto] = useState('100');
    const [de, setDe] = useState('USD');
    const [a, setA] = useState('CUP');

    const montoNum = Number(monto) || 0;
    const resultado = convertir(montoNum, de, a, monedas);

    const intercambiar = () => {
        setDe(a);
        setA(de);
    };

    // Equivalencias rápidas del monto en las demás monedas
    const equivalenciasRapidas = useMemo(() => {
        if (montoNum <= 0) return [];
        return equivalencias(de, monedas).map((eq) => ({
            ...eq,
            valorTotal: convertir(montoNum, de, eq.moneda.codigo, monedas),
        }));
    }, [de, montoNum, monedas]);

    const nombreDe = monedas.find((m) => m.codigo === de)?.nombre ?? de;
    const nombreA = monedas.find((m) => m.codigo === a)?.nombre ?? a;

    return (
        <Modal abierto={abierto} onCerrar={onCerrar} titulo="Conversor de monedas">
            <div className="space-y-5">
                <div>
                    <label className="block space-y-1.5">
                        <span className="text-sm font-medium text-slate-700">Monto</span>
                        <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            className={`${claseInput} text-xl font-semibold`}
                            value={monto}
                            onChange={(e) => setMonto(e.target.value)}
                        />
                    </label>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                    <label className="space-y-1.5">
                        <span className="text-sm font-medium text-slate-700">De</span>
                        <select className={claseInput} value={de} onChange={(e) => setDe(e.target.value)}>
                            {monedas.map((m) => (
                                <option key={m.codigo} value={m.codigo}>{m.codigo} — {m.nombre}</option>
                            ))}
                        </select>
                    </label>
                    <button
                        type="button"
                        onClick={intercambiar}
                        aria-label="Intercambiar monedas"
                        className="grid size-12 place-items-center rounded-xl border-2 border-slate-200 text-slate-700 transition hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-800"
                    >
                        <ArrowLeftRight size={18} />
                    </button>
                    <label className="space-y-1.5">
                        <span className="text-sm font-medium text-slate-700">A</span>
                        <select className={claseInput} value={a} onChange={(e) => setA(e.target.value)}>
                            {monedas.map((m) => (
                                <option key={m.codigo} value={m.codigo}>{m.codigo} — {m.nombre}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-5 text-center">
                    <p className="text-sm text-emerald-800">{montoNum.toLocaleString('es-ES')} {de} equivalen a</p>
                    <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-900">{formatMonto(resultado, a)}</p>
                    <p className="mt-1 text-xs text-emerald-700">{nombreDe} → {nombreA}</p>
                </div>

                {equivalenciasRapidas.length > 0 && (
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {montoNum.toLocaleString('es-ES')} {de} también son
                        </p>
                        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                            {equivalenciasRapidas.map((eq) => (
                                <li key={eq.moneda.codigo} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                                    <span className="flex items-center gap-2">
                                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-700">{eq.moneda.codigo}</span>
                                        <span className="text-slate-600">{eq.moneda.nombre}</span>
                                    </span>
                                    <span className="font-semibold tabular-nums text-slate-900">
                                        {eq.valorTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <p className="text-center text-xs text-slate-500">
                    Las tasas se pueden editar en Cuadre → Configuración.
                </p>
            </div>
        </Modal>
    );
}