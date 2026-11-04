import { useShallow } from 'zustand/react/shallow';
import { useEffect, useRef, useState } from 'react';
import { Bike, Clock, Timer } from 'lucide-react';
import Boton from '@/components/ui/Boton';
import Card from '@/components/ui/Card';
import EstadoVacio from '@/components/ui/EstadoVacio';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useAhora } from '@/hooks/useAhora';
import { calcularCobro, segundosTranscurridos } from '@/lib/calculos';
import type { Alquiler, Triciclo } from '@/lib/types';
import { formatDuracion, formatFecha, formatMonto } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import FinalizarAlquilerModal from '@/screens/alquiler/FinalizarAlquilerModal';

export default function AlquileresActivos() {
  const { alquileres, triciclos, moneda } = useStore(useShallow((s) => ({
    alquileres: s.alquileres,
    triciclos: s.triciclos,
    moneda: s.config.moneda,
  })));
  const { mostrar } = useToast();
  const ahora = useAhora();
  const [finalizando, setFinalizando] = useState<Alquiler | null>(null);
  const avisados = useRef<Set<string>>(new Set());

  const activos = alquileres.filter((a) => a.estado === 'activo');

  useEffect(() => {
    for (const alquiler of activos) {
      if (alquiler.minutosContratados === undefined || avisados.current.has(alquiler.id)) continue;
      const restante = alquiler.minutosContratados * 60 - segundosTranscurridos(alquiler.inicio, ahora);
      if (restante <= 60 && restante > 0) {
        avisados.current.add(alquiler.id);
        mostrar(`Queda menos de 1 minuto para terminar el alquiler de ${alquiler.cliente}.`, 'aviso');
        console.warn(`Alquiler ${alquiler.cliente}: queda menos de 1 minuto.`);
      }
    }
  }, [ahora, activos, mostrar]);

  if (activos.length === 0) {
    return (
      <EstadoVacio
        Icono={Timer}
        titulo="No hay alquileres en curso"
        texto="Cuando inicies un alquiler, el cronómetro aparecerá aquí."
      />
    );
  }

  return (
    <>
      <ul className="grid gap-4 md:grid-cols-2">
        {activos.map((alquiler) => {
          const triciclo = triciclos.find((t) => t.id === alquiler.tricicloId);
          if (!triciclo) return null;
          const transcurridos = segundosTranscurridos(alquiler.inicio, ahora);
          const contratado = alquiler.minutosContratados !== undefined ? alquiler.minutosContratados * 60 : null;
          const restante = contratado !== null ? contratado - transcurridos : null;
          return (
            <li key={alquiler.id}>
              <TarjetaActiva
                alquiler={alquiler}
                triciclo={triciclo}
                transcurridos={transcurridos}
                restante={restante}
                moneda={moneda}
                onFinalizar={() => setFinalizando(alquiler)}
              />
            </li>
          );
        })}
      </ul>

      <Modal abierto={finalizando !== null} onCerrar={() => setFinalizando(null)} titulo="Finalizar alquiler">
        {finalizando && (
          <FinalizarAlquilerModal
            alquiler={finalizando}
            triciclo={triciclos.find((t) => t.id === finalizando.tricicloId)}
            ahora={ahora}
            onFinalizado={() => setFinalizando(null)}
          />
        )}
      </Modal>
    </>
  );
}

type TarjetaProps = {
  alquiler: Alquiler;
  triciclo: Triciclo;
  transcurridos: number;
  restante: number | null;
  moneda: string;
  onFinalizar: () => void;
};

function TarjetaActiva({ alquiler, triciclo, transcurridos, restante, moneda, onFinalizar }: TarjetaProps) {
  const porVencer = restante !== null && restante > 0 && restante <= 60;
  const vencido = restante !== null && restante <= 0;
  const { monto } = calcularCobro(transcurridos, triciclo.tarifaPorMinuto);
  const progreso =
    alquiler.minutosContratados !== undefined
      ? Math.min(100, (transcurridos / (alquiler.minutosContratados * 60)) * 100)
      : 0;

  return (
    <Card
      className={`space-y-4 transition ${porVencer ? 'animate-pulse border-amber-500 ring-2 ring-amber-400/40' : ''} ${
        vencido ? 'border-red-500' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{alquiler.cliente}</p>
          <p className="flex items-center gap-1.5 text-sm text-slate-600">
            <Bike size={14} /> {triciclo.nombre} · desde {formatFecha(alquiler.inicio)}
          </p>
        </div>
        <p className="font-mono text-2xl font-bold tabular-nums text-slate-900" aria-live="off">
          {formatDuracion(transcurridos)}
        </p>
      </div>

      {alquiler.minutosContratados !== undefined && (
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <Clock size={12} /> Tiempo contratado: {alquiler.minutosContratados} min
            </span>
            <span>{vencido ? 'Tiempo cumplido' : `Restan ${formatDuracion(restante ?? 0)}`}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all ${vencido ? 'bg-red-500' : porVencer ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
      )}

      {porVencer && <p className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900">¡Queda menos de 1 minuto!</p>}
      {vencido && <p className="rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-900">El tiempo se cumplió. Sigue sumando cobro.</p>}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Cobro actual: <span className="font-bold text-slate-900">{formatMonto(monto, moneda)}</span>
        </p>
        <Boton onClick={onFinalizar} className="min-h-11" variante="peligro">
          Finalizar
        </Boton>
      </div>
    </Card>
  );
}
