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
  const { productos, moneda, registrarCompra, socios } = useStore(
    useShallow((s) => ({
      productos: s.productos, moneda: s.config.moneda,
      registrarCompra: s.registrarCompra, socios: s.socios,
    }))
  );
  const { mostrar } = useToast();
  const [productoId, setProductoId] = useState(productos[0]?.id ?? '');
  const [cantidad, setCantidad] = useState('');
  const [costoTotal, setCostoTotal] = useState('');
  const [aportes, setAportes] = useState<Record<string, string>>(
    Object.fromEntries(socios.map((s) => [s.id, '']))
  );
  const [proveedor, setProveedor] = useState('');
  const [error, setError] = useState('');

  const sumaAportes = redondear(Object.values(aportes).reduce((suma, v) => suma + Number(v || 0), 0));
  const costo = Number(costoTotal || 0);
  const cuadra = costo > 0 && Math.abs(sumaAportes - costo) < 0.005;

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    const aportesNum = Object.fromEntries(socios.map((s) => [s.id, Number(aportes[s.id] || 0)]));
    const resultado = registrarCompra({
      productoId, cantidad: Number(cantidad), costoTotal: costo,
      aportes: aportesNum, proveedor: proveedor.trim() || 'Sin proveedor',
    });
    if (!resultado.ok) { setError(resultado.error); return; }
    mostrar('Compra registrada. Stock y capital actualizados.');
    onGuardado();
  };

  const repartirIgual = () => {
    if (costo <= 0 || socios.length === 0) return;
    const pct = costo / socios.length;
    setAportes(Object.fromEntries(socios.map((s) => [s.id, pct.toFixed(2)])));
  };

  return (
    <form onSubmit={enviar} className="space-y-4">
      <Campo etiqueta="Producto">
        <select className={claseInput} value={productoId} onChange={(e) => setProductoId(e.target.value)}>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>{nombreProducto(p)} (stock {p.stockActual})</option>
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
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">¿Quién puso el dinero?</p>
          <button type="button" onClick={repartirIgual} className="text-xs font-semibold text-emerald-700 hover:underline">
            Repartir en partes iguales
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {socios.map((socio) => (
            <Campo key={socio.id} etiqueta={`${socio.nombre} pagó`}>
              <input type="number" inputMode="decimal" min="0" step="0.01" className={claseInput}
                value={aportes[socio.id] ?? ''}
                onChange={(e) => setAportes({ ...aportes, [socio.id]: e.target.value })} />
            </Campo>
          ))}
        </div>
        <p className={`mt-3 flex items-center gap-2 text-sm ${cuadra ? 'text-emerald-700' : 'text-amber-700'}`}>
          <ArrowRight size={16} />
          Aportes: {formatMonto(sumaAportes, moneda)} de {formatMonto(costo, moneda)}
          {cuadra ? ' (cuadra ✓)' : costo > 0 ? ` (faltan ${formatMonto(redondear(costo - sumaAportes), moneda)})` : ''}
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