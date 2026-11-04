import { useShallow } from 'zustand/react/shallow';
import { useState, type FormEvent } from 'react';
import { ArrowRight, Truck } from 'lucide-react';
import Boton from '@/components/ui/Boton';
import Campo, { claseInput } from '@/components/ui/Campo';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/store/useStore';
import { formatMonto, nombreProducto } from '@/lib/utils';
import { redondear } from '@/lib/calculos';

type Props = { onGuardado: () => void };

export default function CompraForm({ onGuardado }: Props) {
  const { productos, moneda, registrarCompra } = useStore(useShallow((s) => ({
    productos: s.productos,
    moneda: s.config.moneda,
    registrarCompra: s.registrarCompra,
  })));
  const { mostrar } = useToast();
  const [productoId, setProductoId] = useState(productos[0]?.id ?? '');
  const [cantidad, setCantidad] = useState('');
  const [costoTotal, setCostoTotal] = useState('');
  const [aportePedro, setAportePedro] = useState('');
  const [aporteJuan, setAporteJuan] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [error, setError] = useState('');

  const sumaAportes = redondear(Number(aportePedro || 0) + Number(aporteJuan || 0));
  const costo = Number(costoTotal || 0);
  const cuadra = costo > 0 && Math.abs(sumaAportes - costo) < 0.005;

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    const resultado = registrarCompra({
      productoId,
      cantidad: Number(cantidad),
      costoTotal: costo,
      aportePedro: Number(aportePedro || 0),
      aporteJuan: Number(aporteJuan || 0),
      proveedor: proveedor.trim() || 'Sin proveedor',
    });
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    mostrar('Compra registrada. Stock y capital actualizados.');
    onGuardado();
  };

  return (
    <form onSubmit={enviar} className="space-y-4">
      <Campo etiqueta="Producto">
        <select className={claseInput} value={productoId} onChange={(e) => setProductoId(e.target.value)}>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {nombreProducto(p)} (stock {p.stockActual})
            </option>
          ))}
        </select>
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Cantidad (barras)">
          <input type="number" inputMode="numeric" min="1" className={claseInput} value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        </Campo>
        <Campo etiqueta="Costo total">
          <input type="number" inputMode="decimal" min="0" step="0.01" className={claseInput} value={costoTotal} onChange={(e) => setCostoTotal(e.target.value)} />
        </Campo>
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <p className="mb-3 text-sm font-semibold text-slate-800">¿Quién puso el dinero?</p>
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Pedro pagó">
            <input type="number" inputMode="decimal" min="0" step="0.01" className={claseInput} value={aportePedro} onChange={(e) => setAportePedro(e.target.value)} />
          </Campo>
          <Campo etiqueta="Juan pagó">
            <input type="number" inputMode="decimal" min="0" step="0.01" className={claseInput} value={aporteJuan} onChange={(e) => setAporteJuan(e.target.value)} />
          </Campo>
        </div>
        <p className={`mt-3 flex items-center gap-2 text-sm ${cuadra ? 'text-emerald-700' : 'text-amber-700'}`}>
          <ArrowRight size={16} />
          Aportes: {formatMonto(sumaAportes, moneda)} de {formatMonto(costo, moneda)}
          {cuadra ? ' (cuadra)' : ''}
        </p>
      </div>

      <Campo etiqueta="Proveedor (opcional)">
        <input className={claseInput} value={proveedor} onChange={(e) => setProveedor(e.target.value)} />
      </Campo>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Boton type="submit" bloque disabled={productos.length === 0}>
        <Truck size={18} /> Registrar compra
      </Boton>
    </form>
  );
}
