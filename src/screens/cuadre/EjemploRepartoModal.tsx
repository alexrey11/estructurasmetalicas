import type { ReactNode } from 'react';
import Modal from '@/components/ui/Modal';
import { ejemploReparto } from '@/lib/calculos';
import { formatMonto, formatPorcentaje } from '@/lib/utils';
import { useStore } from '@/store/useStore';

type Props = { abierto: boolean; onCerrar: () => void };

export default function EjemploRepartoModal({ abierto, onCerrar }: Props) {
  const cuentas = useStore((s) => s.cuentas);
  const moneda = useStore((s) => s.config.moneda);
  const ejemplo = ejemploReparto(cuentas.pedro.capital, cuentas.juan.capital);
  const { calculo, base, precioVenta, capitalPedro, capitalJuan } = ejemplo;
  const m = (valor: number) => formatMonto(valor, moneda);

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Ejemplo de reparto">
      <div className="space-y-5 text-sm text-slate-700">
        <p>
          Ejemplo con los datos reales del negocio. No registra ninguna venta.
        </p>

        <Paso numero={1} titulo="Capital actual">
          <p>
            Pedro {m(capitalPedro)} · Juan {m(capitalJuan)}
          </p>
          <p>
            Reparto: Pedro {formatPorcentaje(calculo.pctPedro)} / Juan {formatPorcentaje(calculo.pctJuan)}
          </p>
        </Paso>

        <Paso numero={2} titulo="Venta de ejemplo">
          <p>Costo de lo vendido (COGS): {m(base)}</p>
          <p>Total cobrado: {m(precioVenta)}</p>
          <p className="font-semibold text-emerald-700">Ganancia bruta: {m(calculo.gananciaBruta)}</p>
        </Paso>

        <Paso numero={3} titulo="Reparto de la ganancia">
          <p>
            Pedro: {m(calculo.gananciaBruta)} × {formatPorcentaje(calculo.pctPedro)} = <strong>{m(calculo.repartoPedro)}</strong>
          </p>
          <p>
            Juan: {m(calculo.gananciaBruta)} × {formatPorcentaje(calculo.pctJuan)} = <strong>{m(calculo.repartoJuan)}</strong>
          </p>
        </Paso>

        <Paso numero={4} titulo="Capital después de la venta">
          <p>Se descuenta el costo recuperado en la misma proporción.</p>
          <p>
            Pedro: {m(capitalPedro)} − {m(calculo.reembolsoPedro)} = {m(capitalPedro - calculo.reembolsoPedro)}
          </p>
          <p>
            Juan: {m(capitalJuan)} − {m(calculo.reembolsoJuan)} = {m(capitalJuan - calculo.reembolsoJuan)}
          </p>
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
