import { isSameDay } from 'date-fns';
import type {
  Alquiler, Compra, CuentaSocio, DatosProducto, MetodoPagoVenta,
  Producto, SocioId, Venta, VentaItem,
} from '@/lib/types';
import { nombreProducto } from '@/lib/utils';
import type { Moneda } from '@/lib/types';

export function redondear(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export function calcularPorcentajes(capitales: Record<SocioId, number>): Record<SocioId, number> {
  const ids = Object.keys(capitales);
  if (ids.length === 0) return {};
  const total = ids.reduce((suma, id) => suma + capitales[id], 0);
  if (total <= 0) {
    const pct = 1 / ids.length;
    return Object.fromEntries(ids.map((id) => [id, pct]));
  }
  return Object.fromEntries(ids.map((id) => [id, capitales[id] / total]));
}

type LineaVenta = Pick<VentaItem, 'cantidad' | 'precioUnitario' | 'costoUnitarioMomento'>;

export type CalculoVenta = {
  total: number;
  cogs: number;
  gananciaBruta: number;
  pct: Record<SocioId, number>;
  reparto: Record<SocioId, number>;
  reembolso: Record<SocioId, number>;
};

export function calcularVenta(lineas: LineaVenta[], capitales: Record<SocioId, number>): CalculoVenta {
  const total = redondear(lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0));
  const cogs = redondear(lineas.reduce((s, l) => s + l.cantidad * l.costoUnitarioMomento, 0));
  const gananciaBruta = redondear(total - cogs);
  const pct = calcularPorcentajes(capitales);
  const ids = Object.keys(capitales);
  const reparto: Record<SocioId, number> = {};
  const reembolso: Record<SocioId, number> = {};
  let acumR = 0;
  let acumReemb = 0;
  ids.forEach((id, i) => {
    if (i === ids.length - 1) {
      reparto[id] = redondear(gananciaBruta - acumR);
      reembolso[id] = redondear(cogs - acumReemb);
    } else {
      reparto[id] = redondear(gananciaBruta * pct[id]);
      reembolso[id] = redondear(cogs * pct[id]);
      acumR += reparto[id];
      acumReemb += reembolso[id];
    }
  });
  return { total, cogs, gananciaBruta, pct, reparto, reembolso };
}


export function validarStock(
  productos: Producto[],
  lineas: { productoId: string; cantidad: number }[]
): string | null {
  for (const linea of lineas) {
    const producto = productos.find((p) => p.id === linea.productoId);
    if (!producto) return 'Uno de los productos ya no existe.';
    if (!Number.isInteger(linea.cantidad) || linea.cantidad <= 0) {
      return `La cantidad de ${nombreProducto(producto)} no es válida.`;
    }
    if (linea.cantidad > producto.stockActual) {
      return `No hay suficiente stock de ${nombreProducto(producto)}. Disponible: ${producto.stockActual}.`;
    }
  }
  return null;
}

export function validarProducto(datos: DatosProducto): string | null {
  if (!datos.nombre.trim()) return 'Escribe un nombre para el producto.';
  if (datos.tipo === 'otro' && !datos.categoria?.trim()) return 'Escribe una categoría (ej. Bebidas).';
  if (!(datos.costoUnitario >= 0)) return 'El costo no puede ser negativo.';
  if (!(datos.precioVentaUnitario > 0)) return 'El precio de venta debe ser mayor que cero.';
  if (!Number.isInteger(datos.stockMinimo) || datos.stockMinimo < 0) return 'El stock mínimo debe ser un entero mayor o igual a cero.';

  // Validaciones específicas para tubos/angulares
  if (datos.tipo !== 'otro') {
    if (!datos.medida.trim()) return 'Escribe la medida (ej. 30x30x2 mm).';
    if (!(datos.largoEstandar > 0)) return 'El largo estándar debe ser mayor que cero.';
  }
  return null;
}

export function validarCompra(datos: {
  cantidad: number;
  costoTotal: number;
  aportes: Record<SocioId, number>;
}): string | null {
  if (!Number.isInteger(datos.cantidad) || datos.cantidad <= 0) return 'La cantidad debe ser un entero mayor que cero.';
  if (!(datos.costoTotal > 0)) return 'El costo total debe ser mayor que cero.';
  const valores = Object.values(datos.aportes);
  if (valores.some((v) => v < 0)) return 'Los aportes no pueden ser negativos.';
  const suma = valores.reduce((a, b) => a + b, 0);
  if (Math.abs(suma - datos.costoTotal) > 0.005) {
    return 'Los aportes deben sumar exactamente el costo total.';
  }
  return null;
}

export function validarBateria(valor: number): string | null {
  return Number.isInteger(valor) && valor >= 0 && valor <= 100
    ? null
    : 'La batería debe ser un entero entre 0 y 100.';
}

export function validarInicioAlquiler(datos: {
  cliente: string;
  telefono: string;
  carnet: string;
  montoPactado: number;
}): string | null {
  if (!datos.cliente.trim()) return 'Escribe el nombre del cliente.';
  if (!datos.telefono.trim()) return 'Escribe el teléfono del cliente.';
  if (!datos.carnet.trim()) return 'Escribe el carnet de identidad.';
  if (!(datos.montoPactado > 0)) return 'El monto pactado debe ser mayor que cero.';
  return null;
}

export function segundosTranscurridos(inicio: string, ahora: number): number {
  return Math.max(0, Math.floor((ahora - new Date(inicio).getTime()) / 1000));
}

export function calcularCobro(segundos: number, tarifaPorMinuto: number) {
  const minutos = Math.max(1, Math.ceil(segundos / 60));
  return { minutos, monto: redondear(minutos * tarifaPorMinuto) };
}

export function repartirAlquiler(
  monto: number,
  porcentajes: Record<SocioId, number>
): Record<SocioId, number> {
  const ids = Object.keys(porcentajes);
  const resultado: Record<SocioId, number> = {};
  let acum = 0;
  ids.forEach((id, i) => {
    if (i === ids.length - 1) {
      resultado[id] = redondear(monto - acum);
    } else {
      resultado[id] = redondear(monto * (porcentajes[id] / 100));
      acum += resultado[id];
    }
  });
  return resultado;
}

export function saldoDisponible(cuenta: CuentaSocio): number {
  return redondear(cuenta.gananciaAcumulada - cuenta.retiros);
}

export function gananciaVentasSocio(ventas: Venta[], socio: SocioId): number {
  return redondear(ventas.reduce((s, v) => s + (v.reparto[socio] ?? 0), 0));
}

export function inversionAcumulada(compras: Compra[]): number {
  return redondear(compras.reduce((s, c) => s + c.costoTotal, 0));
}

export type ResumenDia = {
  ventasCantidad: number;
  ventasTotal: number;
  gananciaVentas: number;
  alquilerCantidad: number;
  alquilerTotal: number;
  gananciaDia: number;
  porMetodo: Record<MetodoPagoVenta, number>;
};

export function resumenDia(ventas: Venta[], alquileres: Alquiler[], dia: Date): ResumenDia {
  const ventasDia = ventas.filter((v) => isSameDay(new Date(v.fecha), dia));
  const alquileresDia = alquileres.filter(
    (a) => a.estado === 'finalizado' && a.fin && isSameDay(new Date(a.fin), dia)
  );
  const porMetodo: Record<MetodoPagoVenta, number> = { efectivo: 0, transferencia: 0, credito: 0 };
  for (const v of ventasDia) porMetodo[v.metodoPago] += v.total;
  for (const a of alquileresDia) if (a.metodoPago) porMetodo[a.metodoPago] += a.monto ?? 0;
  const ventasTotal = redondear(ventasDia.reduce((s, v) => s + v.total, 0));
  const gananciaVentas = redondear(ventasDia.reduce((s, v) => s + v.gananciaBruta, 0));
  const alquilerTotal = redondear(alquileresDia.reduce((s, a) => s + (a.monto ?? 0), 0));
  return {
    ventasCantidad: ventasDia.length,
    ventasTotal,
    gananciaVentas,
    alquilerCantidad: alquileresDia.length,
    alquilerTotal,
    gananciaDia: redondear(gananciaVentas + alquilerTotal),
    porMetodo: {
      efectivo: redondear(porMetodo.efectivo),
      transferencia: redondear(porMetodo.transferencia),
      credito: redondear(porMetodo.credito),
    },
  };
}

export function ejemploReparto(capitales: Record<SocioId, number>) {
  const total = redondear(Object.values(capitales).reduce((a, b) => a + b, 0));
  const base = total > 0 ? total : 10000;
  const precioVenta = redondear(base * 1.5);
  const calculo = calcularVenta(
    [{ cantidad: 1, precioUnitario: precioVenta, costoUnitarioMomento: base }],
    capitales
  );
  return { capitales, base, precioVenta, calculo };
}

export function convertir(
  monto: number,
  desdeCodigo: string,
  haciaCodigo: string,
  monedas: Moneda[]
): number {
  const desde = monedas.find((m) => m.codigo === desdeCodigo);
  const hacia = monedas.find((m) => m.codigo === haciaCodigo);
  if (!desde || !hacia) return 0;
  if (hacia.tasaEnBase === 0) return 0;
  return redondear((monto * desde.tasaEnBase) / hacia.tasaEnBase);
}
export function equivalencias(
  codigo: string,
  monedas: Moneda[]
): Array<{ moneda: Moneda; valor: number }> {
  return monedas
    .filter((m) => m.codigo !== codigo)
    .map((m) => ({ moneda: m, valor: convertir(1, codigo, m.codigo, monedas) }));
}