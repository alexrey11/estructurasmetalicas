import { useShallow } from 'zustand/react/shallow';
import { useState, type FormEvent } from 'react';
import Boton from '@/components/ui/Boton';
import Campo, { claseInput } from '@/components/ui/Campo';
import { useToast } from '@/components/ui/Toast';
import type { Alquiler, MetodoPagoAlquiler, Triciclo } from '@/lib/types';
import { formatDuracion, formatMonto, formatFecha } from '@/lib/utils';
import { useStore } from '@/store/useStore';

type Props = { alquiler: Alquiler; triciclo: Triciclo | undefined; onFinalizado: () => void };

export default function FinalizarAlquilerModal({ alquiler, triciclo, onFinalizado }: Props) {
  const { finalizarAlquiler, moneda } = useStore(
    useShallow((s) => ({ finalizarAlquiler: s.finalizarAlquiler, moneda: s.config.moneda }))
  );
  const { mostrar } = useToast();
  const [monto, setMonto] = useState(String(alquiler.montoPactado));
  const [metodoPago, setMetodoPago] = useState<MetodoPagoAlquiler>('efectivo');
  const [error, setError] = useState('');

  const segundos = Math.floor((Date.now() - new Date(alquiler.inicio).getTime()) / 1000);
  const montoNum = Number(monto);

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    const resultado = finalizarAlquiler(alquiler.id, { metodoPago, monto: montoNum });
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    mostrar(`Alquiler cerrado: ${formatMonto(montoNum, moneda)}`);
    onFinalizado();
  };

  return (
    <form onSubmit={enviar} className="space-y-5">
      <dl className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
        <div>
          <dt className="text-xs text-slate-500">Cliente</dt>
          <dd className="font-semibold">{alquiler.cliente}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Triciclo</dt>
          <dd className="font-semibold">{triciclo?.nombre ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Desde</dt>
          <dd className="font-semibold">{formatFecha(alquiler.inicio)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Tiempo</dt>
          <dd className="font-mono font-semibold tabular-nums">{formatDuracion(segundos)}</dd>
        </div>
      </dl>

      <Campo etiqueta="Monto final a cobrar" ayuda={`Pactado: ${formatMonto(alquiler.montoPactado, moneda)}`}>
        <input type="number" inputMode="decimal" min="0" step="0.01" className={claseInput} value={monto} onChange={(e) => setMonto(e.target.value)} />
      </Campo>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Método de pago</p>
        <div className="grid grid-cols-2 gap-2">
          {(['efectivo', 'transferencia'] as const).map((metodo) => (
            <button
              key={metodo}
              type="button"
              aria-pressed={metodoPago === metodo}
              onClick={() => setMetodoPago(metodo)}
              className={`min-h-12 rounded-xl border-2 text-sm font-semibold capitalize transition ${metodoPago === metodo ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-200 text-slate-700'
                }`}
            >
              {metodo}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Boton type="submit" bloque className="min-h-14 text-lg">
        Cobrar y finalizar
      </Boton>
    </form>
  );
}