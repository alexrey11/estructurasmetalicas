import { formatMonto, nombreSocio } from '@/lib/utils';
import type { SocioId } from '@/lib/types';

export type FilaSocio = {
  socio: { id: SocioId };
  capital: number;
  porVentas: number;
  porAlquiler: number;
  retiros: number;
  saldo: number;
};

type Props = { filas: FilaSocio[]; moneda: string };

export default function TablaSocios({ filas, moneda }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Socio</th>
              <th className="px-4 py-3 text-right font-medium">Capital</th>
              <th className="px-4 py-3 text-right font-medium">Ganancia ventas</th>
              <th className="px-4 py-3 text-right font-medium">Ganancia alquiler</th>
              <th className="px-4 py-3 text-right font-medium">Retiros</th>
              <th className="px-4 py-3 text-right font-medium">Saldo disponible</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filas.map((fila) => (
              <tr key={fila.socio.id}>
                <td className="px-4 py-3 font-semibold text-slate-900">{nombreSocio(fila.socio.id)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatMonto(fila.capital, moneda)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatMonto(fila.porVentas, moneda)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatMonto(fila.porAlquiler, moneda)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-red-600">{formatMonto(fila.retiros, moneda)}</td>
                <td className="px-4 py-3 text-right font-bold tabular-nums text-emerald-700">{formatMonto(fila.saldo, moneda)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
