import { useShallow } from 'zustand/react/shallow';
import { useState } from 'react';
import { Plus, Truck } from 'lucide-react';
import Boton from '@/components/ui/Boton';
import Card from '@/components/ui/Card';
import EstadoVacio from '@/components/ui/EstadoVacio';
import Modal from '@/components/ui/Modal';
import { formatFecha, formatMonto, nombreProducto } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import CompraForm from '@/screens/ventas/CompraForm';

export default function ComprasTab() {
  const { compras, productos, moneda, socios } = useStore(
    useShallow((s) => ({
      compras: s.compras, productos: s.productos,
      moneda: s.config.moneda, socios: s.socios,
    }))
  );
  const [abierto, setAbierto] = useState(false);
  const ordenadas = [...compras].sort((a, b) => b.fecha.localeCompare(a.fecha));

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
                    <p className="text-sm font-semibold text-slate-900">{compra.cantidad} barra(s)</p>
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