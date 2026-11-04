import { useShallow } from 'zustand/react/shallow';
import { CheckCircle2 } from 'lucide-react';
import Boton from '@/components/ui/Boton';
import Modal from '@/components/ui/Modal';
import type { Venta } from '@/lib/types';
import { formatMonto, formatPorcentaje } from '@/lib/utils';
import { useStore } from '@/store/useStore';

type Props = { venta: Venta | null; onCerrar: () => void };

export default function ResumenVenta({ venta, onCerrar }: Props) {
  const { socios, moneda, cuentas } = useStore(
    useShallow((s) => ({ socios: s.socios, moneda: s.config.moneda, cuentas: s.cuentas }))
  );
  if (!venta) return null;

  const totales = Object.values(venta.reparto).reduce((a, b) => a + b, 0);
  const capitales = Object.fromEntries(socios.map((s) => [s.id, cuentas[s.id]?.capital ?? 0]));
  const totalCap = Object.values(capitales).reduce((a, b) => a + b, 0);

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Venta registrada">
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-900">
          <CheckCircle2 size={28} className="shrink-0 text-emerald-700" />
          <p className="text-sm font-medium">La venta se guardó y el stock fue descontado.</p>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Dato etiqueta="Total cobrado" valor={formatMonto(venta.total, moneda)} />
          <Dato etiqueta="Ganancia bruta" valor={formatMonto(venta.gananciaBruta, moneda)} color="text-emerald-700" />
        </dl>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-800">Reparto de la ganancia</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {socios.map((s) => {
              const pct = totalCap > 0 ? (capitales[s.id] ?? 0) / totalCap : 1 / socios.length;
              return (
                <div key={s.id} className="rounded-xl border border-slate-200 p-3">
                  <p className="flex items-center gap-1.5 text-sm text-slate-600">
                    <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.nombre} <span className="text-xs">({formatPorcentaje(pct)})</span>
                  </p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">
                    {formatMonto(venta.reparto[s.id] ?? 0, moneda)}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-500">
            El reparto se calcula según el capital de cada socio al momento de la venta.
            {Math.abs(totales - venta.gananciaBruta) > 0.01 && ' (ajustado por redondeo)'}
          </p>
        </div>

        <Boton bloque onClick={onCerrar}>Listo</Boton>
      </div>
    </Modal>
  );
}

function Dato({ etiqueta, valor, color = 'text-slate-900' }: { etiqueta: string; valor: string; color?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <dt className="text-xs text-slate-500">{etiqueta}</dt>
      <dd className={`text-base font-bold tabular-nums ${color}`}>{valor}</dd>
    </div>
  );
}