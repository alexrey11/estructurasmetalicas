import { useShallow } from 'zustand/react/shallow';
import { useState } from 'react';
import { CheckCircle2, Minus, Package, Plus, Search, ShoppingCart, Trash2 } from 'lucide-react';
import Boton from '@/components/ui/Boton';
import Card from '@/components/ui/Card';
import { claseInput } from '@/components/ui/Campo';
import EstadoVacio from '@/components/ui/EstadoVacio';
import { useToast } from '@/components/ui/Toast';
import { calcularPorcentajes, calcularVenta } from '@/lib/calculos';
import type { MetodoPagoVenta, Venta } from '@/lib/types';
import { formatMonto, formatPorcentaje, nombreProducto } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import ResumenVenta from '@/screens/ventas/ResumenVenta';

const METODOS: { id: MetodoPagoVenta; etiqueta: string }[] = [
  { id: 'efectivo', etiqueta: 'Efectivo' },
  { id: 'transferencia', etiqueta: 'Transferencia' },
  { id: 'credito', etiqueta: 'Crédito' },
];

type LineaCarrito = { productoId: string; cantidad: number };

export default function VenderTab() {
  const { productos, cuentas, config, registrarVenta, socios } = useStore(
    useShallow((s) => ({
      productos: s.productos, cuentas: s.cuentas, config: s.config,
      registrarVenta: s.registrarVenta, socios: s.socios,
    }))
  );
  const { mostrar } = useToast();
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState<LineaCarrito[]>([]);
  const [metodoPago, setMetodoPago] = useState<MetodoPagoVenta>('efectivo');
  const [ventaRealizada, setVentaRealizada] = useState<Venta | null>(null);

  const moneda = config.moneda;
  const productosFiltrados = productos.filter((p) =>
    nombreProducto(p).toLowerCase().includes(busqueda.trim().toLowerCase())
  );

  const lineas = carrito
    .map((linea) => {
      const producto = productos.find((p) => p.id === linea.productoId);
      return producto ? { ...linea, producto } : null;
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  const capitales = Object.fromEntries(socios.map((s) => [s.id, cuentas[s.id]?.capital ?? 0]));
  const calculo = calcularVenta(
    lineas.map((l) => ({
      cantidad: l.cantidad,
      precioUnitario: l.producto.precioVentaUnitario,
      costoUnitarioMomento: l.producto.costoUnitario,
    })),
    capitales
  );
  const porcentajes = calcularPorcentajes(capitales);

  const agregar = (productoId: string) => {
    const producto = productos.find((p) => p.id === productoId);
    if (!producto) return;
    const enCarrito = carrito.find((l) => l.productoId === productoId)?.cantidad ?? 0;
    if (enCarrito + 1 > producto.stockActual) {
      mostrar(`No hay más stock de ${nombreProducto(producto)}.`, 'error');
      return;
    }
    setCarrito((previo) =>
      enCarrito === 0
        ? [...previo, { productoId, cantidad: 1 }]
        : previo.map((l) => (l.productoId === productoId ? { ...l, cantidad: l.cantidad + 1 } : l))
    );
  };

  const cambiarCantidad = (productoId: string, delta: number) => {
    const producto = productos.find((p) => p.id === productoId);
    setCarrito((previo) =>
      previo
        .map((l) => {
          if (l.productoId !== productoId) return l;
          const nueva = l.cantidad + delta;
          if (producto && nueva > producto.stockActual) {
            mostrar(`Solo hay ${producto.stockActual} disponibles.`, 'error');
            return l;
          }
          return { ...l, cantidad: nueva };
        })
        .filter((l) => l.cantidad > 0)
    );
  };

  const confirmar = () => {
    const resultado = registrarVenta(carrito, metodoPago);
    if (!resultado.ok) {
      mostrar(resultado.error, 'error');
      return;
    }
    setCarrito([]);
    setVentaRealizada(resultado.data);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <section className="space-y-4 lg:col-span-3">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto (ej. 30×30)"
            className={`${claseInput} pl-11`}
            aria-label="Buscar producto"
          />
        </div>

        {productosFiltrados.length === 0 ? (
          <EstadoVacio Icono={Package} titulo="Sin productos" texto="No encontramos productos con esa búsqueda." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {productosFiltrados.map((producto) => {
              const sinStock = producto.stockActual <= 0;
              return (
                <Card key={producto.id} className="flex flex-col gap-3 p-4">
                  <div>
                    <p className="font-semibold text-slate-900">{nombreProducto(producto)}</p>
                    <p className="text-xs text-slate-500">Barra de {producto.largoEstandar} m</p>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-lg font-bold tabular-nums text-slate-900">
                        {formatMonto(producto.precioVentaUnitario, moneda)}
                      </p>
                      <p className={`text-xs font-medium ${producto.stockActual < producto.stockMinimo ? 'text-red-600' : 'text-slate-500'}`}>
                        Stock: {producto.stockActual}
                      </p>
                    </div>
                    <Boton onClick={() => agregar(producto.id)} disabled={sinStock} className="min-h-11 px-4">
                      <Plus size={18} /> Agregar
                    </Boton>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <aside className="lg:col-span-2">
        <Card className="space-y-5 lg:sticky lg:top-24">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-emerald-700" />
            <h2 className="text-lg font-semibold text-slate-900">Carrito</h2>
          </div>

          {lineas.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Agrega productos para armar la venta.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {lineas.map(({ producto, cantidad, productoId }) => (
                <li key={productoId} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{nombreProducto(producto)}</p>
                    <p className="text-xs text-slate-500">{formatMonto(producto.precioVentaUnitario, moneda)} c/u</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" aria-label="Quitar uno" onClick={() => cambiarCantidad(productoId, -1)}
                      className="grid size-10 place-items-center rounded-lg border border-slate-300 hover:bg-slate-50">
                      {cantidad === 1 ? <Trash2 size={16} className="text-red-600" /> : <Minus size={16} />}
                    </button>
                    <span className="w-8 text-center font-semibold tabular-nums">{cantidad}</span>
                    <button type="button" aria-label="Agregar uno" onClick={() => cambiarCantidad(productoId, 1)}
                      className="grid size-10 place-items-center rounded-lg border border-slate-300 hover:bg-slate-50">
                      <Plus size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Método de pago</p>
            <div className="grid grid-cols-3 gap-2">
              {METODOS.map(({ id, etiqueta }) => (
                <button key={id} type="button" aria-pressed={metodoPago === id} onClick={() => setMetodoPago(id)}
                  className={`min-h-11 rounded-xl border-2 text-sm font-semibold transition ${metodoPago === id ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}>
                  {etiqueta}
                </button>
              ))}
            </div>
          </div>

          {lineas.length > 0 && (
            <dl className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
              <Fila etiqueta="Total" valor={formatMonto(calculo.total, moneda)} destacado />
              <Fila etiqueta="Costo de lo vendido" valor={formatMonto(calculo.cogs, moneda)} />
              <Fila etiqueta="Ganancia bruta" valor={formatMonto(calculo.gananciaBruta, moneda)} color="text-emerald-700" />
              <div className="space-y-1 border-t border-slate-200 pt-2">
                {socios.map((s) => (
                  <Fila key={s.id}
                    etiqueta={`${s.nombre} (${formatPorcentaje(porcentajes[s.id] ?? 0)})`}
                    valor={formatMonto(calculo.reparto[s.id] ?? 0, moneda)} />
                ))}
              </div>
            </dl>
          )}

          <Boton bloque onClick={confirmar} disabled={lineas.length === 0} className="min-h-14 text-lg">
            <CheckCircle2 size={20} /> Confirmar venta
          </Boton>
        </Card>
      </aside>

      <ResumenVenta venta={ventaRealizada} onCerrar={() => setVentaRealizada(null)} />
    </div>
  );
}

function Fila({ etiqueta, valor, color = 'text-slate-900', destacado = false }: {
  etiqueta: string; valor: string; color?: string; destacado?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={destacado ? 'font-semibold text-slate-900' : 'text-slate-600'}>{etiqueta}</dt>
      <dd className={`font-semibold tabular-nums ${color}`}>{valor}</dd>
    </div>
  );
}