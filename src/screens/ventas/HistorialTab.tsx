import { useShallow } from 'zustand/react/shallow';
import { useMemo, useState } from 'react';
import { ChevronDown, Clock, Receipt } from 'lucide-react';
import Card from '@/components/ui/Card';
import EstadoVacio from '@/components/ui/EstadoVacio';
import { claseInput } from '@/components/ui/Campo';
import { format } from 'date-fns';
import { formatFecha, formatMonto, nombreProducto, nombreSocio } from '@/lib/utils';
import { useStore } from '@/store/useStore';

const ETIQUETA_PAGO = { efectivo: 'Efectivo', transferencia: 'Transferencia', credito: 'Crédito' };

export default function HistorialTab() {
  const { ventas, productos, config, socios } = useStore(
    useShallow((s) => ({ ventas: s.ventas, productos: s.productos, config: s.config, socios: s.socios }))
  );
  const moneda = config.moneda;
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [socioFiltro, setSocioFiltro] = useState<string>('todos');
  const [abierta, setAbierta] = useState<string | null>(null);

  const filtradas = useMemo(
    () =>
      ventas.filter((v) => {
        const dia = format(new Date(v.fecha), 'yyyy-MM-dd');
        if (desde && dia < desde) return false;
        if (hasta && dia > hasta) return false;
        if (socioFiltro !== 'todos' && v.socioAtendio !== socioFiltro) return false;
        return true;
      }),
    [ventas, desde, hasta, socioFiltro]
  );

  const totalFiltrado = filtradas.reduce((suma, v) => suma + v.total, 0);

  return (
    <div className="space-y-4">
      <Card className="grid gap-3 p-4 sm:grid-cols-3">
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Desde</span>
          <input type="date" className={claseInput} value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Hasta</span>
          <input type="date" className={claseInput} value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Socio</span>
          <select className={claseInput} value={socioFiltro} onChange={(e) => setSocioFiltro(e.target.value)}>
            <option value="todos">Todos</option>
            {socios.map((s) => (<option key={s.id} value={s.id}>{s.nombre}</option>))}
          </select>
        </label>
      </Card>

      <p className="text-sm text-slate-600">{filtradas.length} venta(s) · Total {formatMonto(totalFiltrado, moneda)}</p>

      {filtradas.length === 0 ? (
        <EstadoVacio Icono={Receipt} titulo="No hay ventas en este rango"
          texto={ventas.length === 0 ? 'Cuando registres ventas aparecerán aquí.' : 'Prueba con otras fechas o socio.'} />
      ) : (
        <ul className="space-y-3">
          {filtradas.map((venta) => {
            const expandida = abierta === venta.id;
            return (
              <li key={venta.id}>
                <Card className="p-0">
                  <button type="button" onClick={() => setAbierta(expandida ? null : venta.id)}
                    aria-expanded={expandida}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl p-4 text-left transition hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Clock size={14} className="text-slate-500" /> {formatFecha(venta.fecha)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {nombreSocio(venta.socioAtendio, socios)} · {ETIQUETA_PAGO[venta.metodoPago]}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold tabular-nums text-slate-900">{formatMonto(venta.total, moneda)}</p>
                      <ChevronDown size={18} className={`text-slate-500 transition ${expandida ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {expandida && (
                    <div className="space-y-4 border-t border-slate-100 p-4">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[320px] text-left text-sm">
                          <thead className="text-xs uppercase text-slate-500">
                            <tr>
                              <th className="pb-2 font-medium">Producto</th>
                              <th className="pb-2 text-right font-medium">Cant.</th>
                              <th className="pb-2 text-right font-medium">Precio</th>
                              <th className="pb-2 text-right font-medium">Costo</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {venta.items.map((item) => {
                              const producto = productos.find((p) => p.id === item.productoId);
                              return (
                                <tr key={item.productoId}>
                                  <td className="py-2">{producto ? nombreProducto(producto) : 'Producto eliminado'}</td>
                                  <td className="py-2 text-right tabular-nums">{item.cantidad}</td>
                                  <td className="py-2 text-right tabular-nums">{formatMonto(item.precioUnitario, moneda)}</td>
                                  <td className="py-2 text-right tabular-nums">{formatMonto(item.costoUnitarioMomento, moneda)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                        <Dato etiqueta="COGS" valor={formatMonto(venta.cogs, moneda)} />
                        <Dato etiqueta="Ganancia bruta" valor={formatMonto(venta.gananciaBruta, moneda)} color="text-emerald-700" />
                        {socios.map((s) => (
                          <Dato key={s.id} etiqueta={`Reparto ${s.nombre}`} valor={formatMonto(venta.reparto[s.id] ?? 0, moneda)} />
                        ))}
                      </dl>
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Dato({ etiqueta, valor, color = 'text-slate-900' }: { etiqueta: string; valor: string; color?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <dt className="text-xs text-slate-500">{etiqueta}</dt>
      <dd className={`font-semibold tabular-nums ${color}`}>{valor}</dd>
    </div>
  );
}