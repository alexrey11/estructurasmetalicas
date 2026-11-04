import type { ReactNode } from 'react';
import Modal from '@/components/ui/Modal';
import { ejemploReparto } from '@/lib/calculos';
import { formatMonto, formatPorcentaje } from '@/lib/utils';
import { useStore } from '@/store/useStore';

type Props = { abierto: boolean; onCerrar: () => void };

export default function EjemploRepartoModal({ abierto, onCerrar }: Props) {
  const cuentas = useStore((s) => s.cuentas);
  const moneda = useStore((s) => s.config.moneda);
  const socios = useStore((s) => s.socios);

  const capitales = Object.fromEntries(socios.map((s) => [s.id, cuentas[s.id]?.capital ?? 0]));
  const ejemplo = ejemploReparto(capitales);
  const { calculo, base, precioVenta } = ejemplo;
  const m = (v: number) => formatMonto(v, moneda);

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Ejemplo de reparto">
      <div className="space-y-5 text-sm text-slate-700">
        <p>Ejemplo con los datos reales del negocio. No registra ninguna venta.</p>

        <Paso numero={1} titulo="Capital actual">
          {socios.map((s) => (
            <p key={s.id}>{s.nombre}: {m(capitales[s.id] ?? 0)} → {formatPorcentaje(calculo.pct[s.id] ?? 0)}</p>
          ))}
        </Paso>

        <Paso numero={2} titulo="Venta de ejemplo">
          <p>Costo de lo vendido (COGS): {m(base)}</p>
          <p>Total cobrado: {m(precioVenta)}</p>
          <p className="font-semibold text-emerald-700">Ganancia bruta: {m(calculo.gananciaBruta)}</p>
        </Paso>

        <Paso numero={3} titulo="Reparto de la ganancia">
          {socios.map((s) => (
            <p key={s.id}>{s.nombre}: <strong>{m(calculo.reparto[s.id] ?? 0)}</strong></p>
          ))}
        </Paso>

        <Paso numero={4} titulo="Capital después de la venta">
          {socios.map((s) => (
            <p key={s.id}>
              {s.nombre}: {m(capitales[s.id] ?? 0)} − {m(calculo.reembolso[s.id] ?? 0)} ={' '}
              {m((capitales[s.id] ?? 0) - (calculo.reembolso[s.id] ?? 0))}
            </p>
          ))}
        </Paso>
      </div>
    </Modal>
  );
}

function Paso({ numero, titulo, children }: { numero: number; titulo: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-700 text-xs font-bold text-white">
        {numero}
      </span>
      <div className="space-y-1">
        <p className="font-semibold text-slate-900">{titulo}</p>
        {children}
      </div>
    </div>
  );
}