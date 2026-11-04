import { useShallow } from 'zustand/react/shallow';
import { useState } from 'react';
import { Plus, Truck, Trash2 } from 'lucide-react';
import Boton from '@/components/ui/Boton';
import Card from '@/components/ui/Card';
import EstadoVacio from '@/components/ui/EstadoVacio';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { formatFecha, formatMonto, nombreProducto } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import CompraForm from '@/screens/ventas/CompraForm';

export default function ComprasTab() {
  const { compras, productos, moneda, socios, eliminarCompra } = useStore(
    useShallow((s) => ({
      compras: s.compras, productos: s.productos, moneda: s.config.moneda, socios: s.socios,
      eliminarCompra: s.eliminarCompra
    }))
  );
  const { mostrar } = useToast();
  const [abierto, setAbierto] = useState(false);
  const ordenadas = [...compras].sort((a, b) => b.fecha.localeCompare(a.fecha));

  const borrar = (id: string) => {
    if (!window.confirm('¿Anular esta compra? Se devolverá el capital y se restará el stock.')) return;
    const r = eliminarCompra(id);
    mostrar(r.ok ? 'Compra anulada.' : r.error, r.ok ? 'exito' : 'error');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">Cada compra suma stock y capital.</p>
        <Boton onClick={() => setAbierto(true)} className="min-h-11" disabled={productos.length === 0}>
          <Plus size={18} /> Registrar compra
        </Boton>
      </div>

      {ordenadas.length === 0 ? (
        <EstadoVacio Icono={Truck} titulo="Sin compras registradas" texto="Registra la primera compra de inventario." />
      ) : (
        <ul className="space-y-3">
          {ordenadas.map((compra) => {
            const producto = productos.find((p) => p.id === compra.productoId);
            return (
              <li key={compra.id}>
                <Card className="space-y-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{producto ? nombreProducto(producto) : 'Producto eliminado'}</p>
                      <p className="text-xs text-slate-500">{formatFecha(compra.fecha)} · {compra.proveedor}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{compra.cantidad} barra(s)</p>
                      <button onClick={() => borrar(compra.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-2 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-[1fr_repeat(auto-fit,minmax(0,1fr))]">
                    <div>
                      <p className="text-xs text-slate-500">Costo total</p>
                      <p className="font-semibold tabular-nums">{formatMonto(compra.costoTotal, moneda)}</p>
                    </div>
                    {socios.map((s) => (
                      <div key={s.id}>
                        <p className="flex items-center gap-1 text-xs text-slate-500">
                          <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
                          {s.nombre}
                        </p>
                        <p className="font-semibold tabular-nums">{formatMonto(compra.aportes[s.id] ?? 0, moneda)}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Modal abierto={abierto} onCerrar={() => setAbierto(false)} titulo="Registrar compra">
        {abierto && <CompraForm onGuardado={() => setAbierto(false)} />}
      </Modal>
    </div>
  );
}