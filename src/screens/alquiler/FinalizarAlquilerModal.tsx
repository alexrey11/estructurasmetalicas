import { useShallow } from 'zustand/react/shallow';
import { useState, type FormEvent } from 'react';
import Boton from '@/components/ui/Boton';
import Campo, { claseInput } from '@/components/ui/Campo';
import { useToast } from '@/components/ui/Toast';
import { calcularCobro, segundosTranscurridos } from '@/lib/calculos';
import type { Alquiler, MetodoPagoAlquiler, Triciclo } from '@/lib/types';
import { formatDuracion, formatMonto } from '@/lib/utils';
import { useStore } from '@/store/useStore';

type Props = { alquiler: Alquiler; triciclo: Triciclo | undefined; ahora: number; onFinalizado: () => void };

export default function FinalizarAlquilerModal({ alquiler, triciclo, ahora, onFinalizado }: Props) {
  const { finalizarAlquiler, moneda } = useStore(useShallow((s) => ({
    finalizarAlquiler: s.finalizarAlquiler,
    moneda: s.config.moneda,
  })));
  const { mostrar } = useToast();
  const [bateriaFin, setBateriaFin] = useState(String(alquiler.bateriaInicio));
  const [metodoPago, setMetodoPago] = useState<MetodoPagoAlquiler>('efectivo');
  const [error, setError] = useState('');

  const transcurridos = segundosTranscurridos(alquiler.inicio, ahora);
  const cobro = triciclo ? calcularCobro(transcurridos, triciclo.tarifaPorMinuto) : null;

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    const resultado = finalizarAlquiler(alquiler.id, { bateriaFin: Number(bateriaFin), metodoPago });
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    mostrar(`Alquiler finalizado cobrado ${formatMonto(cobro?.monto ?? 0, moneda)}.`);
    onFinalizado();
  };

  return (
    <form onSubmit={enviar} className="space-y-5">
      <dl className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4 text-center">
        <div>
          <dt className="text-xs text-slate-500">Tiempo</dt>
          <dd className="font-mono font-bold tabular-nums">{formatDuracion(transcurridos)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Minutos cobrados</dt>
          <dd className="font-bold tabular-nums">{cobro?.minutos ?? 0}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Monto</dt>
          <dd className="font-bold tabular-nums text-emerald-700">{formatMonto(cobro?.monto ?? 0, moneda)}</dd>
        </div>
      </dl>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Método de pago</p>
        <div className="grid grid-cols-2 gap-2">
          {(['efectivo', 'transferencia'] as const).map((metodo) => (
            <button
              key={metodo}
              type="button"
              aria-pressed={metodoPago === metodo}
              onClick={() => setMetodoPago(metodo)}
              className={`min-h-12 rounded-xl border-2 text-sm font-semibold capitalize transition ${
                metodoPago === metodo ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-200 text-slate-700'
              }`}
            >
              {metodo}
            </button>
          ))}
        </div>
      </div>

      <Campo etiqueta="Batería final (%)">
        <input type="number" inputMode="numeric" min="0" max="100" className={claseInput} value={bateriaFin} onChange={(e) => setBateriaFin(e.target.value)} />
      </Campo>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Boton type="submit" bloque className="min-h-14 text-lg">
        Cobrar y finalizar
      </Boton>
    </form>
  );
}
