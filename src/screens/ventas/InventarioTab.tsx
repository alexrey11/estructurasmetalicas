import { useShallow } from 'zustand/react/shallow';
import { useState } from 'react';
import { Pencil, Plus, Package, Trash2 } from 'lucide-react';
import Boton from '@/components/ui/Boton';
import Card from '@/components/ui/Card';
import EstadoVacio from '@/components/ui/EstadoVacio';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import type { Producto } from '@/lib/types';
import { formatMonto, nombreProducto } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import ProductoForm from '@/screens/ventas/ProductoForm';

type Edicion = { modo: 'nuevo' } | { modo: 'editar'; producto: Producto } | null;

export default function InventarioTab() {
  const { productos, moneda, eliminarProducto } = useStore(useShallow((s) => ({
    productos: s.productos, moneda: s.config.moneda, eliminarProducto: s.eliminarProducto,
  })));
  const { mostrar } = useToast();
  const [edicion, setEdicion] = useState<Edicion>(null);

  const margen = (p: Producto) => p.precioVentaUnitario > 0 ? ((p.precioVentaUnitario - p.costoUnitario) / p.precioVentaUnitario) * 100 : 0;

  const borrar = (p: Producto) => {
    if (!window.confirm(`¿Eliminar "${nombreProducto(p)}"? Solo se puede si no tiene ventas.`)) return;
    const r = eliminarProducto(p.id);
    mostrar(r.ok ? 'Producto eliminado.' : r.error, r.ok ? 'exito' : 'error');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">{productos.length} producto(s) en catálogo</p>
        <Boton onClick={() => setEdicion({ modo: 'nuevo' })} className="min-h-11"><Plus size={18} /> Nuevo producto</Boton>
      </div>

      {productos.length === 0 ? (
        <EstadoVacio Icono={Package} titulo="Aún no tienes productos" texto="Crea el primero para empezar a vender." />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 text-right font-medium">Stock</th>
                  <th className="px-4 py-3 text-right font-medium">Costo</th>
                  <th className="px-4 py-3 text-right font-medium">Precio</th>
                  <th className="px-4 py-3 text-right font-medium">Margen</th>
                  <th className="px-4 py-3 text-right font-medium"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productos.map((p) => {
                  const bajo = p.stockActual < p.stockMinimo;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{nombreProducto(p)}</td>
                      <td className="px-4 py-3 capitalize text-slate-700">{p.tipo === 'otro' ? p.categoria : p.tipo}</td>
                      <td className={`px-4 py-3 text-right font-bold tabular-nums ${bajo ? 'text-red-600' : 'text-slate-900'}`}>
                        {p.stockActual} <span className="text-xs font-normal">{p.unidadVenta}</span>
                        {bajo && <span className="ml-1 text-xs font-medium">(mín. {p.stockMinimo})</span>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatMonto(p.costoUnitario, moneda)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatMonto(p.precioVentaUnitario, moneda)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-emerald-700">{margen(p).toFixed(1)} %</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" onClick={() => setEdicion({ modo: 'editar', producto: p })} aria-label={`Editar ${nombreProducto(p)}`} className="grid size-10 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
                            <Pencil size={16} />
                          </button>
                          <button type="button" onClick={() => borrar(p)} aria-label={`Eliminar ${nombreProducto(p)}`} className="grid size-10 place-items-center rounded-lg text-slate-600 transition hover:bg-red-50 hover:text-red-600">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal abierto={edicion !== null} onCerrar={() => setEdicion(null)} titulo={edicion?.modo === 'editar' ? 'Editar producto' : 'Nuevo producto'}>
        {edicion && (
          <ProductoForm producto={edicion.modo === 'editar' ? edicion.producto : undefined} onGuardado={() => setEdicion(null)} />
        )}
      </Modal>
    </div>
  );
}