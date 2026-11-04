import { useShallow } from 'zustand/react/shallow';
import { useMemo } from 'react';
import { Bike, ShoppingCart, TriangleAlert, Wallet, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Boton from '@/components/ui/Boton';
import Card from '@/components/ui/Card';
import { calcularPorcentajes, inversionAcumulada, resumenDia, saldoDisponible } from '@/lib/calculos';
import { formatDiaCorto, formatDiaLargo, formatMonto, formatPorcentaje } from '@/lib/utils';
import type { TabId } from '@/lib/types';
import { useStore } from '@/store/useStore';
import { subDays } from 'date-fns';

type Props = { onNavegar: (tab: TabId, accion?: 'nuevo-alquiler') => void };

export default function Dashboard({ onNavegar }: Props) {
  const { ventas, alquileres, productos, triciclos, cuentas, config, compras, socios } = useStore(
    useShallow((s) => ({
      ventas: s.ventas, alquileres: s.alquileres, productos: s.productos,
      triciclos: s.triciclos, cuentas: s.cuentas, config: s.config,
      compras: s.compras, socios: s.socios,
    }))
  );
  const moneda = config.moneda;
  const hoy = new Date();

  const resumen = useMemo(() => resumenDia(ventas, alquileres, hoy), [ventas, alquileres]);
  const alquileresActivos = alquileres.filter((a) => a.estado === 'activo').length;
  const stockBajo = productos.filter((p) => p.stockActual < p.stockMinimo).length;

  const datosSemana = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const dia = subDays(hoy, 6 - i);
        return { dia: formatDiaCorto(dia), ganancia: resumenDia(ventas, alquileres, dia).gananciaDia };
      }),
    [ventas, alquileres]
  );

  const capitales = Object.fromEntries(socios.map((s) => [s.id, cuentas[s.id]?.capital ?? 0]));
  const porcentajes = calcularPorcentajes(capitales);
  const inversion = inversionAcumulada(compras);

  const tarjetas = [
    { titulo: 'Ganancia del día', valor: formatMonto(resumen.gananciaDia, moneda), detalle: 'Ventas y alquileres', Icono: TrendingUp, color: 'text-emerald-700' },
    { titulo: 'Ventas del día', valor: formatMonto(resumen.ventasTotal, moneda), detalle: `${resumen.ventasCantidad} venta(s)`, Icono: ShoppingCart, color: 'text-slate-900' },
    { titulo: 'Alquileres activos', valor: String(alquileresActivos), detalle: `${triciclos.filter((t) => t.estado === 'alquilado').length} en uso`, Icono: Bike, color: 'text-slate-900' },
    { titulo: 'Stock bajo', valor: String(stockBajo), detalle: 'Productos bajo el mínimo', Icono: TriangleAlert, color: stockBajo > 0 ? 'text-amber-700' : 'text-slate-900' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm capitalize text-slate-600">{formatDiaLargo(hoy)}</p>
        <h1 className="text-2xl font-bold text-slate-900">Resumen del negocio</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tarjetas.map(({ titulo, valor, detalle, Icono, color }) => (
          <Card key={titulo} className="space-y-2 p-4">
            <div className="flex items-center justify-between text-slate-500">
              <p className="text-xs font-medium uppercase tracking-wide">{titulo}</p>
              <Icono size={18} />
            </div>
            <p className={`text-xl font-bold tabular-nums ${color}`}>{valor}</p>
            <p className="text-xs text-slate-500">{detalle}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Boton onClick={() => onNavegar('ventas')} className="min-h-16 text-lg">
          <ShoppingCart size={22} /> Nueva venta
        </Boton>
        <Boton variante="secundaria" onClick={() => onNavegar('alquiler', 'nuevo-alquiler')} className="min-h-16 text-lg">
          <Bike size={22} /> Nuevo alquiler
        </Boton>
      </div>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-slate-900">Ganancias de los últimos 7 días</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={datosSemana} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="dia" tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} width={56} />
            <Tooltip formatter={(valor) => formatMonto(Number(valor), moneda)} cursor={{ fill: '#F1F5F9' }} />
            <Bar dataKey="ganancia" name="Ganancia" fill="#10B981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Socios</h2>
          <p className="text-xs text-slate-600">Reparto según capital</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="pb-2 font-medium">Socio</th>
                <th className="pb-2 text-right font-medium">Capital</th>
                <th className="pb-2 text-right font-medium">Reparto</th>
                <th className="pb-2 text-right font-medium">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {socios.map((socio) => (
                <tr key={socio.id}>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-2 font-semibold text-slate-900">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: socio.color }} />
                      {socio.nombre}
                    </span>
                  </td>
                  <td className="py-3 text-right tabular-nums">{formatMonto(cuentas[socio.id]?.capital ?? 0, moneda)}</td>
                  <td className="py-3 text-right tabular-nums">{formatPorcentaje(porcentajes[socio.id] ?? 0)}</td>
                  <td className="py-3 text-right font-semibold tabular-nums text-emerald-700">
                    {formatMonto(saldoDisponible(cuentas[socio.id] ?? { capital: 0, gananciaAcumulada: 0, retiros: 0 }), moneda)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <Wallet size={14} /> Inversión acumulada: {formatMonto(inversion, moneda)}
        </p>
      </Card>
    </div>
  );
}