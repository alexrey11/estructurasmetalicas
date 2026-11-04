import { useShallow } from 'zustand/react/shallow';
import { useMemo, useState } from 'react';
import { ChevronDown, Clock, Receipt, CheckCircle2, Trash2, AlertCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import EstadoVacio from '@/components/ui/EstadoVacio';
import { claseInput } from '@/components/ui/Campo';
import { useToast } from '@/components/ui/Toast';
import { format } from 'date-fns';
import { formatFecha, formatMonto, nombreProducto, nombreSocio } from '@/lib/utils';
import { useStore } from '@/store/useStore';

const ETIQUETA_PAGO = { efectivo: 'Efectivo', transferencia: 'Transferencia', credito: 'Crédito' };

export default function HistorialTab() {
  const { ventas, productos, config, socios, marcarVentaPagada, eliminarVenta } = useStore(
    useShallow((s) => ({
      ventas: s.ventas, productos: s.productos, config: s.config, socios: s.socios,
      marcarVentaPagada: s.marcarVentaPagada, eliminarVenta: s.eliminarVenta
    }))
  );
  const { mostrar } = useToast();
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

  const cobrar = (id: string) => {
    if (!window.confirm('¿Marcar esta venta como pagada?')) return;
    marcarVentaPagada(id);
    mostrar('Venta marcada como pagada.');
  };

  const borrar = (id: string) => {
    if (!window.confirm('¿Eliminar esta venta permanentemente? El stock y las cuentas se revertirán.')) return;
    const r = eliminarVenta(id);
    mostrar(r.ok ? 'Venta eliminada y cuentas revertidas.' : r.error, r.ok ? 'exito' : 'error');
  };

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
        <EstadoVacio Icono={Receipt} titulo="No hay ventas en este rango" texto="Cuando registres ventas aparecerán aquí." />
      ) : (
        <ul className="space-y-3">
          {filtradas.map((venta) => {
            const expandida = abierta === venta.id;
            const esCreditoPendiente = venta.metodoPago === 'credito' && venta.estadoPago === 'pendiente';

            return (
              <li key={venta.id}>
                <Card className={`p-0 ${esCreditoPendiente ? 'border-amber-400' : ''}`}>
                  <button type="button" onClick={() => setAbierta(expandida ? null : venta.id)} aria-expanded={expandida}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl p-4 text-left transition hover:bg-slate-50">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Clock size={14} className="text-slate-500" /> {formatFecha(venta.fecha)}
                      </p>
                      <p className="text-xs text-slate-500 flex gap-2">
                        <span>{nombreSocio(venta.socioAtendio, socios)}</span>
                        <span>· {ETIQUETA_PAGO[venta.metodoPago]}</span>
                        {venta.cliente && <span className="text-amber-700 font-medium">· {venta.cliente}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {esCreditoPendiente && <AlertCircle size={16} className="text-amber-500" />}
                      <p className="font-bold tabular-nums text-slate-900">{formatMonto(venta.total, moneda)}</p>
                      <ChevronDown size={18} className={`text-slate-500 transition ${expandida ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {expandida && (
                    <div className="space-y-4 border-t border-slate-100 p-4">
                      {/* Botones de acción para esta venta */}
                      <div className="flex gap-2">
                        {esCreditoPendiente && (
                          <button onClick={() => cobrar(venta.id)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-100 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-200">
                            <CheckCircle2 size={14} /> Marcar Pagada
                          </button>
                        )}
                        <button onClick={() => borrar(venta.id)} className="flex items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100">
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[320px] text-left text-sm">
                          <tbody className="divide-y divide-slate-100">
                            {venta.items.map((item) => {
                              const producto = productos.find((p) => p.id === item.productoId);
                              return (
                                <tr key={item.productoId}>
                                  <td className="py-2">{producto ? nombreProducto(producto) : 'Prod. eliminado'}</td>
                                  <td className="py-2 text-right tabular-nums">{item.cantidad} x {formatMonto(item.precioUnitario, moneda)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
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