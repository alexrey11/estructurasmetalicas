import { useShallow } from 'zustand/react/shallow';
import { useState } from 'react';
import { Clock, Phone, IdCard, Timer } from 'lucide-react';
import Boton from '@/components/ui/Boton';
import Card from '@/components/ui/Card';
import EstadoVacio from '@/components/ui/EstadoVacio';
import Modal from '@/components/ui/Modal';
import { useAhora } from '@/hooks/useAhora';
import { segundosTranscurridos } from '@/lib/calculos';
import type { Alquiler, Triciclo } from '@/lib/types';
import { formatDuracion, formatFecha, formatMonto } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import FinalizarAlquilerModal from '@/screens/alquiler/FinalizarAlquilerModal';
import TricicloIcon from '@/components/TricicloIcon';

export default function AlquileresActivos() {
  const { alquileres, triciclos, moneda } = useStore(
    useShallow((s) => ({ alquileres: s.alquileres, triciclos: s.triciclos, moneda: s.config.moneda }))
  );
  const ahora = useAhora();
  const [finalizando, setFinalizando] = useState<Alquiler | null>(null);

  const activos = alquileres.filter((a) => a.estado === 'activo');

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
          return (
            <li key={alquiler.id}>
              <TarjetaActiva
                alquiler={alquiler}
                triciclo={triciclo}
                transcurridos={transcurridos}
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
  moneda: string;
  onFinalizar: () => void;
};

function TarjetaActiva({ alquiler, triciclo, transcurridos, moneda, onFinalizar }: TarjetaProps) {
  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{alquiler.cliente}</p>
          <p className="flex items-center gap-1.5 text-sm text-slate-600">
            <TricicloIcon size={14} /> {triciclo.nombre} · desde {formatFecha(alquiler.inicio)}
          </p>
        </div>
        <p className="font-mono text-2xl font-bold tabular-nums text-slate-900" aria-live="off">
          {formatDuracion(transcurridos)}
        </p>
      </div>

      <div className="space-y-1.5 rounded-xl bg-slate-50 p-3 text-sm">
        <p className="flex items-center gap-1.5 text-slate-700">
          <Phone size={14} className="text-slate-500" /> {alquiler.telefono}
        </p>
        <p className="flex items-center gap-1.5 text-slate-700">
          <IdCard size={14} className="text-slate-500" /> {alquiler.carnet}
        </p>
        <p className="flex items-center gap-1.5 text-slate-700">
          <Clock size={14} className="text-slate-500" /> Pactado: <span className="font-semibold">{formatMonto(alquiler.montoPactado, moneda)}</span>
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">Cobro pactado: {formatMonto(alquiler.montoPactado, moneda)}</p>
        <Boton onClick={onFinalizar} className="min-h-11" variante="peligro">
          Finalizar
        </Boton>
      </div>
    </Card>
  );
}