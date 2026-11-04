import { useShallow } from 'zustand/react/shallow';
import { useState } from 'react';
import { Battery, Plus, Wrench, Gauge } from 'lucide-react';
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
import GestionTriciclos from '@/screens/alquiler/GestionTriciclos'; // <-- IMPORTAMOS EL NUEVO
import TricicloIcon from '@/components/TricicloIcon'; // <-- USAMOS EL ICONO NUEVO
import HistorialAlquileres from '@/screens/alquiler/HistorialAlquileres';

const ETIQUETA_ESTADO: Record<Triciclo['estado'], { texto: string; clase: string }> = {
  disponible: { texto: 'Disponible', clase: 'bg-emerald-100 text-emerald-800' },
  alquilado: { texto: 'Alquilado', clase: 'bg-amber-100 text-amber-800' },
  mantenimiento: { texto: 'Mantenimiento', clase: 'bg-red-100 text-red-800' },
};

type Props = { abrirNuevo: boolean };

export default function AlquilerPage({ abrirNuevo }: Props) {
  const { triciclos, moneda, cambiarEstadoTriciclo } = useStore(useShallow((s) => ({
    triciclos: s.triciclos,
    moneda: s.config.moneda,
    cambiarEstadoTriciclo: s.cambiarEstadoTriciclo,
  })));
  const { mostrar } = useToast();
  const [nuevoAbierto, setNuevoAbierto] = useState(abrirNuevo);

  const alternarMantenimiento = (triciclo: Triciclo) => {
    const nuevoEstado = triciclo.estado === 'mantenimiento' ? 'disponible' : 'mantenimiento';
    const resultado = cambiarEstadoTriciclo(triciclo.id, nuevoEstado);
    if (!resultado.ok) {
      mostrar(resultado.error, 'error');
      return;
    }
    mostrar(nuevoEstado === 'disponible' ? `${triciclo.nombre} marcado como disponible.` : `${triciclo.nombre} enviado a mantenimiento.`, 'aviso');
  };

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
          return (
            <Card key={triciclo.id} className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-700">
                    <TricicloIcon size={22} />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{triciclo.nombre}</p>
                    <p className="text-sm text-slate-600">{formatMonto(triciclo.tarifaPorMinuto, moneda)} por minuto</p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${estado.clase}`}>{estado.texto}</span>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <Battery size={16} /> Batería
                  </span>
                  <span className={`font-semibold tabular-nums ${triciclo.bateria < 20 ? 'text-red-600' : 'text-slate-900'}`}>
                    {triciclo.bateria} %
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all ${triciclo.bateria < 20 ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${triciclo.bateria}%` }}
                  />
                </div>
              </div>

              {triciclo.estado !== 'alquilado' && (
                <Boton variante="secundaria" bloque onClick={() => alternarMantenimiento(triciclo)} className="min-h-11">
                  {triciclo.estado === 'mantenimiento' ? (
                    <>
                      <Gauge size={18} /> Marcar disponible
                    </>
                  ) : (
                    <>
                      <Wrench size={18} /> Enviar a mantenimiento
                    </>
                  )}
                </Boton>
              )}
            </Card>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Alquileres activos</h2>
        <AlquileresActivos />
      </section>
      {/* AQUÍ AGREGAMOS EL HISTORIAL */}
      <CierreCaja />

      {/* AQUÍ AGREGAMOS EL PANEL DE GESTIÓN */}
      <GestionTriciclos />

      <Modal abierto={nuevoAbierto} onCerrar={() => setNuevoAbierto(false)} titulo="Nuevo alquiler">
        {nuevoAbierto && <NuevoAlquilerForm onGuardado={() => setNuevoAbierto(false)} />}
      </Modal>
    </div>
  );
}