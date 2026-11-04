import { useShallow } from 'zustand/react/shallow';
import { useState, type FormEvent } from 'react';
import Boton from '@/components/ui/Boton';
import Campo, { claseInput } from '@/components/ui/Campo';
import { useToast } from '@/components/ui/Toast';
import type { DatosProducto, Producto, TipoProducto, UnidadVenta } from '@/lib/types';
import { redondear } from '@/lib/calculos';
import { useStore } from '@/store/useStore';

type Props = { producto?: Producto; onGuardado: () => void };

export default function ProductoForm({ producto, onGuardado }: Props) {
  const { crearProducto, actualizarProducto, registrarCompra, socios, cuentas } = useStore(
    useShallow((s) => ({
      crearProducto: s.crearProducto,
      actualizarProducto: s.actualizarProducto,
      registrarCompra: s.registrarCompra,
      socios: s.socios,
      cuentas: s.cuentas,
    }))
  );
  const { mostrar } = useToast();

  const [tipo, setTipo] = useState<TipoProducto>(producto?.tipo ?? 'tubo');
  const [nombre, setNombre] = useState(producto?.nombre ?? '');
  const [medida, setMedida] = useState(producto?.medida ?? '');
  const [largo, setLargo] = useState(String(producto?.largoEstandar ?? 6));
  const [unidadVenta, setUnidadVenta] = useState<UnidadVenta>(producto?.unidadVenta ?? 'barra');
  const [costo, setCosto] = useState(String(producto?.costoUnitario ?? ''));
  const [precio, setPrecio] = useState(String(producto?.precioVentaUnitario ?? ''));
  const [stockMinimo, setStockMinimo] = useState(String(producto?.stockMinimo ?? '5'));
  const [categoria, setCategoria] = useState(producto?.categoria ?? '');

  // NUEVO: Campo simplificado de stock inicial
  const [stockInicial, setStockInicial] = useState('0');

  const [error, setError] = useState('');

  const costoNum = Number(costo);
  const precioNum = Number(precio);
  const margen = precioNum > 0 ? ((precioNum - costoNum) / precioNum) * 100 : 0;
  const esEdicion = !!producto;

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();

    const cantInicial = Number(stockInicial);
    if (!esEdicion && cantInicial > 0 && costoNum <= 0) {
      setError('Si cargas stock inicial, el costo unitario debe ser mayor a 0.');
      return;
    }

    const datos: DatosProducto = {
      tipo, nombre, medida, largoEstandar: Number(largo), unidadVenta,
      costoUnitario: costoNum, precioVentaUnitario: precioNum, stockMinimo: Number(stockMinimo),
      categoria: tipo === 'otro' ? categoria : undefined,
    };

    const resultado = producto
      ? actualizarProducto(producto.id, datos)
      : crearProducto(datos);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    // Si es un producto nuevo y tiene stock inicial, creamos la compra automáticamente
    if (!esEdicion && cantInicial > 0) {
      const productoId = (resultado as { ok: true; data: Producto }).data.id;
      const totalCosto = cantInicial * costoNum;

      // Calcular aportes proporcionales al capital actual
      const capitalTotal = socios.reduce((suma, s) => suma + (cuentas[s.id]?.capital ?? 0), 0);
      const aportes: Record<string, number> = {};

      socios.forEach((s) => {
        const capitalSocio = cuentas[s.id]?.capital ?? 0;
        const pct = capitalTotal > 0 ? capitalSocio / capitalTotal : 1 / socios.length;
        aportes[s.id] = redondear(totalCosto * pct);
      });

      // Ajustar último socio para evitar errores por decimales
      const sumaAportes = Object.values(aportes).reduce((a, b) => a + b, 0);
      if (socios.length > 0) {
        const diff = totalCosto - sumaAportes;
        const ultimoId = socios[socios.length - 1].id;
        aportes[ultimoId] = redondear(aportes[ultimoId] + diff);
      }

      const compra = registrarCompra({
        productoId,
        cantidad: cantInicial,
        costoTotal: totalCosto,
        aportes,
        proveedor: 'Stock inicial (Auto)',
      });

      if (!compra.ok) {
        setError(`Producto creado, pero falló el stock inicial: ${compra.error}`);
        return;
      }
      mostrar('Producto creado con stock. Capital actualizado.');
    } else {
      mostrar(esEdicion ? 'Producto actualizado.' : 'Producto creado sin stock inicial.');
    }
    onGuardado();
  };

  const esOtro = tipo === 'otro';

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Tipo de producto">
          <select className={claseInput} value={tipo} onChange={(e) => setTipo(e.target.value as TipoProducto)}>
            <option value="tubo">Tubo </option>
            <option value="angular">Angular </option>
            <option value="otro">Otro (Bebidas, Alimentos...)</option>
          </select>
        </Campo>
        <Campo etiqueta="Unidad de venta">
          <select className={claseInput} value={unidadVenta} onChange={(e) => setUnidadVenta(e.target.value as UnidadVenta)}>
            <option value="barra">Barra (6m)</option>
            <option value="metro">Metro lineal</option>
            <option value="unidad">Unidad</option>
            <option value="libra">Libra</option>
            <option value="litro">Litro</option>
            <option value="paquete">Paquete</option>
          </select>
        </Campo>
      </div>

      <Campo etiqueta="Nombre del producto" ayuda="Ej: Tubo 30x30, Refresco Cola">
        <input className={claseInput} value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </Campo>

      {esOtro ? (
        <Campo etiqueta="Categoría" ayuda="Ej: Bebidas, Alimentos, Ferretería">
          <input className={claseInput} value={categoria} onChange={(e) => setCategoria(e.target.value)} />
        </Campo>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Medida" ayuda="Ej: 30x30x2 mm">
            <input className={claseInput} value={medida} onChange={(e) => setMedida(e.target.value)} />
          </Campo>
          <Campo etiqueta="Largo estándar (m)">
            <input type="number" inputMode="decimal" className={claseInput} value={largo} onChange={(e) => setLargo(e.target.value)} />
          </Campo>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Costo unitario">
          <input type="number" inputMode="decimal" min="0" step="0.01" className={claseInput} value={costo} onChange={(e) => setCosto(e.target.value)} />
        </Campo>
        <Campo etiqueta="Precio de venta">
          <input type="number" inputMode="decimal" min="0" step="0.01" className={claseInput} value={precio} onChange={(e) => setPrecio(e.target.value)} />
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Stock mínimo" ayuda="Alerta cuando baje de aquí">
          <input type="number" inputMode="numeric" className={claseInput} value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value)} />
        </Campo>
        {!esEdicion && (
          <Campo etiqueta="Stock inicial" ayuda="Cantidad que tienes ahora">
            <input type="number" inputMode="numeric" min="0" className={claseInput} value={stockInicial} onChange={(e) => setStockInicial(e.target.value)} placeholder="Ej: 20" />
          </Campo>
        )}
      </div>

      <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
        Margen estimado: <span className="font-semibold text-emerald-700">{margen.toFixed(1)} %</span>
        {esEdicion && producto && (
          <span className="block text-xs text-slate-500">Stock actual: {producto.stockActual} {producto.unidadVenta}</span>
        )}
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Boton type="submit" bloque>
        {esEdicion ? 'Guardar cambios' : 'Crear producto'}
      </Boton>
    </form>
  );
}