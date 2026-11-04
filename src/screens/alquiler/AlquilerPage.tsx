import { useShallow } from 'zustand/react/shallow';
import { useState, useEffect } from 'react';
import { BatteryCharging, Plus, Zap, CheckCircle2 } from 'lucide-react';
import Boton from '@/components/ui/Boton';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/store/useStore';
import type { Triciclo } from '@/lib/types';
import { formatMonto } from '@/lib/utils';
import NuevoAlquilerForm from '@/screens/alquiler/NuevoAlquilerForm';
import AlquileresActivos from '@/screens/alquiler/AlquileresActivos';
import CierreCaja from '@/screens/alquiler/CierreCaja';
import GestionTriciclos from '@/screens/alquiler/GestionTriciclos';
import HistorialAlquileres from '@/screens/alquiler/HistorialAlquileres';
import TricicloIcon from '@/components/TricicloIcon';

const ETIQUETA_ESTADO: Record<Triciclo['estado'], { texto: string; clase: string }> = {
  disponible: { texto: 'Disponible', clase: 'bg-emerald-100 text-emerald-800' },
  alquilado: { texto: 'Alquilado', clase: 'bg-amber-100 text-amber-800' },
  cargando: { texto: 'Cargando', clase: 'bg-blue-100 text-blue-800' },
};

type Props = { abrirNuevo: boolean };

export default function AlquilerPage({ abrirNuevo }: Props) {
  const { triciclos, moneda, marcarCargado } = useStore(
    useShallow((s) => ({
      triciclos: s.triciclos, moneda: s.config.moneda, marcarCargado: s.marcarCargado,
    }))
  );
  const { mostrar } = useToast();
  const [nuevoAbierto, setNuevoAbierto] = useState(abrirNuevo);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const ahora = Date.now();
    for (const t of triciclos) {
      if (t.estado === 'cargando' && t.cargandoHasta && new Date(t.cargandoHasta).getTime() <= ahora) {
        mostrar(`¡${t.nombre} ya terminó de cargar!`, 'aviso');
      }
    }
  }, [triciclos, mostrar]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Alquiler de triciclos</h1>
        <Boton onClick={() => setNuevoAbierto(true)} className="min-h-12">
          <Plus size={18} /> Nuevo alquiler
        </Boton>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        {triciclos.map((triciclo) => {
          const estado = ETIQUETA_ESTADO[triciclo.estado];
          const cargandoListo =
            triciclo.estado === 'cargando' &&
            triciclo.cargandoHasta &&
            new Date(triciclo.cargandoHasta).getTime() <= Date.now();
          const segundosRestantes = triciclo.cargandoHasta
            ? Math.max(0, Math.floor((new Date(triciclo.cargandoHasta).getTime() - Date.now()) / 1000))
            : 0;

          return (
            <Card key={triciclo.id} className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-700">
                    <TricicloIcon size={22} />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{triciclo.nombre}</p>
                    <p className="text-sm text-slate-600">{formatMonto(triciclo.precioAlquiler, moneda)} por día</p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${estado.clase}`}>{estado.texto}</span>
              </div>

              {triciclo.estado === 'cargando' && (
                <div className={`rounded-xl p-3 text-sm ${cargandoListo ? 'bg-emerald-50 text-emerald-900' : 'bg-blue-50 text-blue-900'}`}>
                  {cargandoListo ? (
                    <div className="space-y-2">
                      <p className="flex items-center gap-1.5 font-semibold">
                        <CheckCircle2 size={16} /> Carga completa. Desconéctalo.
                      </p>
                      <Boton
                        onClick={() => { marcarCargado(triciclo.id); mostrar(`${triciclo.nombre} disponible.`); }}
                        className="min-h-10 w-full"
                      >
                        <Zap size={16} /> Marcar como disponible
                      </Boton>
                    </div>
                  ) : (
                    <p className="flex items-center gap-1.5">
                      <BatteryCharging size={16} />
                      En carga. Le quedan <strong>{Math.ceil(segundosRestantes / 60)} min</strong>
                    </p>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Alquileres activos</h2>
        <AlquileresActivos />
      </section>

      <HistorialAlquileres />

      <CierreCaja />

      <GestionTriciclos />

      <Modal abierto={nuevoAbierto} onCerrar={() => setNuevoAbierto(false)} titulo="Nuevo alquiler">
        {nuevoAbierto && <NuevoAlquilerForm onGuardado={() => setNuevoAbierto(false)} />}
      </Modal>
    </div>
  );
}