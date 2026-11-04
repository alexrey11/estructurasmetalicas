import { useShallow } from 'zustand/react/shallow';
import { useState, type FormEvent } from 'react';
import Boton from '@/components/ui/Boton';
import Campo, { claseInput } from '@/components/ui/Campo';
import { useToast } from '@/components/ui/Toast';
import type { DatosProducto, Producto, TipoProducto } from '@/lib/types';
import { useStore } from '@/store/useStore';

type Props = { producto?: Producto; onGuardado: () => void };

export default function ProductoForm({ producto, onGuardado }: Props) {
  const { crearProducto, actualizarProducto } = useStore(useShallow((s) => ({
    crearProducto: s.crearProducto,
    actualizarProducto: s.actualizarProducto,
  })));
  const { mostrar } = useToast();
  const [tipo, setTipo] = useState<TipoProducto>(producto?.tipo ?? 'tubo');
  const [medida, setMedida] = useState(producto?.medida ?? '');
  const [largo, setLargo] = useState(String(producto?.largoEstandar ?? 6));
  const [unidad, setUnidad] = useState<'barra' | 'metro'>(producto?.unidad ?? 'barra');
  const [costo, setCosto] = useState(String(producto?.costoUnitario ?? ''));
  const [precio, setPrecio] = useState(String(producto?.precioVentaUnitario ?? ''));
  const [stockMinimo, setStockMinimo] = useState(String(producto?.stockMinimo ?? '5'));
  const [error, setError] = useState('');

  const costoNum = Number(costo);
  const precioNum = Number(precio);
  const margen = precioNum > 0 ? ((precioNum - costoNum) / precioNum) * 100 : 0;

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    const datos: DatosProducto = {
      tipo,
      medida,
      largoEstandar: Number(largo),
      unidad,
      costoUnitario: costoNum,
      precioVentaUnitario: precioNum,
      stockMinimo: Number(stockMinimo),
    };
    const resultado = producto ? actualizarProducto(producto.id, datos) : crearProducto(datos);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    mostrar(producto ? 'Producto actualizado.' : 'Producto creado. Registra una compra para cargar stock.');
    onGuardado();
  };

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Tipo">
          <select className={claseInput} value={tipo} onChange={(e) => setTipo(e.target.value as TipoProducto)}>
            <option value="tubo">Tubo</option>
            <option value="angular">Angular</option>
          </select>
        </Campo>
        <Campo etiqueta="Unidad de venta">
          <select className={claseInput} value={unidad} onChange={(e) => setUnidad(e.target.value as 'barra' | 'metro')}>
            <option value="barra">Barra</option>
            <option value="metro">Metro</option>
          </select>
        </Campo>
      </div>

      <Campo etiqueta="Medida" ayuda="Ejemplo: 30×30×3 mm">
        <input className={claseInput} value={medida} onChange={(e) => setMedida(e.target.value)} />
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Largo estándar (m)">
          <input type="number" inputMode="decimal" className={claseInput} value={largo} onChange={(e) => setLargo(e.target.value)} />
        </Campo>
        <Campo etiqueta="Stock mínimo">
          <input type="number" inputMode="numeric" className={claseInput} value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value)} />
        </Campo>
        <Campo etiqueta="Costo unitario">
          <input type="number" inputMode="decimal" min="0" step="0.01" className={claseInput} value={costo} onChange={(e) => setCosto(e.target.value)} />
        </Campo>
        <Campo etiqueta="Precio de venta">
          <input type="number" inputMode="decimal" min="0" step="0.01" className={claseInput} value={precio} onChange={(e) => setPrecio(e.target.value)} />
        </Campo>
      </div>

      <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
        Margen estimado: <span className="font-semibold text-emerald-700">{margen.toFixed(1)} %</span>
        {producto && <span className="block text-xs text-slate-500">Stock actual: {producto.stockActual}. Se modifica con compras y ventas.</span>}
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Boton type="submit" bloque>
        {producto ? 'Guardar cambios' : 'Crear producto'}
      </Boton>
    </form>
  );
}
