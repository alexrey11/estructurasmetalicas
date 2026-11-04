import { isSameDay } from 'date-fns';
import type {
  Alquiler,
  Compra,
  CuentaSocio,
  DatosProducto,
  MetodoPagoVenta,
  Producto,
  SocioId,
  Venta,
  VentaItem,
} from '@/lib/types';
import { nombreProducto } from '@/lib/utils';

export function redondear(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export type Porcentajes = { pctPedro: number; pctJuan: number };

// Ejemplo: capital Pedro 6000 y Juan 4000 -> 60 % / 40 %. Sin capital, reparto 50/50.
export function calcularPorcentajes(capitalPedro: number, capitalJuan: number): Porcentajes {
  const total = capitalPedro + capitalJuan;
  if (total <= 0) return { pctPedro: 0.5, pctJuan: 0.5 };
  const pctPedro = capitalPedro / total;
  return { pctPedro, pctJuan: 1 - pctPedro };
}

type LineaVenta = Pick<VentaItem, 'cantidad' | 'precioUnitario' | 'costoUnitarioMomento'>;

export type CalculoVenta = {
  total: number;
  cogs: number;
  gananciaBruta: number;
  pctPedro: number;
  pctJuan: number;
  repartoPedro: number;
  repartoJuan: number;
  reembolsoPedro: number;
  reembolsoJuan: number;
};

// Ejemplo: venta 15000, COGS 10000 -> ganancia 5000 -> Pedro 3000 / Juan 2000 con capital 6000/4000.
export function calcularVenta(lineas: LineaVenta[], capitalPedro: number, capitalJuan: number): CalculoVenta {
  const total = redondear(lineas.reduce((suma, l) => suma + l.cantidad * l.precioUnitario, 0));
  const cogs = redondear(lineas.reduce((suma, l) => suma + l.cantidad * l.costoUnitarioMomento, 0));
  const gananciaBruta = redondear(total - cogs);
  const { pctPedro, pctJuan } = calcularPorcentajes(capitalPedro, capitalJuan);
  const repartoPedro = redondear(gananciaBruta * pctPedro);
  const repartoJuan = redondear(gananciaBruta - repartoPedro);
  const reembolsoPedro = redondear(cogs * pctPedro);
  const reembolsoJuan = redondear(cogs - reembolsoPedro);
  return {
    total,
    cogs,
    gananciaBruta,
    pctPedro,
    pctJuan,
    repartoPedro,
    repartoJuan,
    reembolsoPedro,
    reembolsoJuan,
  };
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
  if (!datos.medida.trim()) return 'Escribe la medida del producto.';
  if (!(datos.largoEstandar > 0)) return 'El largo estándar debe ser mayor que cero.';
  if (!(datos.costoUnitario >= 0)) return 'El costo no puede ser negativo.';
  if (!(datos.precioVentaUnitario > 0)) return 'El precio de venta debe ser mayor que cero.';
  if (!Number.isInteger(datos.stockMinimo) || datos.stockMinimo < 0) {
    return 'El stock mínimo debe ser un número entero mayor o igual a cero.';
  }
  return null;
}

export function validarCompra(datos: Pick<Compra, 'cantidad' | 'costoTotal' | 'aportePedro' | 'aporteJuan'>): string | null {
  if (!Number.isInteger(datos.cantidad) || datos.cantidad <= 0) return 'La cantidad debe ser un número entero mayor que cero.';
  if (!(datos.costoTotal > 0)) return 'El costo total debe ser mayor que cero.';
  if (datos.aportePedro < 0 || datos.aporteJuan < 0) return 'Los aportes no pueden ser negativos.';
  if (Math.abs(datos.aportePedro + datos.aporteJuan - datos.costoTotal) > 0.005) {
    return 'Los aportes de Pedro y Juan deben sumar exactamente el costo total.';
  }
  return null;
}

export function validarBateria(valor: number): string | null {
  return Number.isInteger(valor) && valor >= 0 && valor <= 100 ? null : 'La batería debe ser un número entero entre 0 y 100.';
}

export function validarInicioAlquiler(datos: { cliente: string; bateriaInicio: number; minutosContratados: number }): string | null {
  if (!datos.cliente.trim()) return 'Escribe el nombre del cliente.';
  const errorBateria = validarBateria(datos.bateriaInicio);
  if (errorBateria) return errorBateria;
  if (!Number.isInteger(datos.minutosContratados) || datos.minutosContratados < 1) {
    return 'El tiempo contratado debe ser de al menos 1 minuto.';
  }
  return null;
}

export function segundosTranscurridos(inicio: string, ahora: number): number {
  return Math.max(0, Math.floor((ahora - new Date(inicio).getTime()) / 1000));
}

// Se cobra por minuto iniciado: 1 min 5 s = 2 minutos.
export function calcularCobro(segundos: number, tarifaPorMinuto: number): { minutos: number; monto: number } {
  const minutos = Math.max(1, Math.ceil(segundos / 60));
  return { minutos, monto: redondear(minutos * tarifaPorMinuto) };
}

export function repartirAlquiler(monto: number, porcentajePedro: number): { repartoPedro: number; repartoJuan: number } {
  const repartoPedro = redondear((monto * porcentajePedro) / 100);
  return { repartoPedro, repartoJuan: redondear(monto - repartoPedro) };
}

export function saldoDisponible(cuenta: CuentaSocio): number {
  return redondear(cuenta.gananciaAcumulada - cuenta.retiros);
}

export function gananciaVentasSocio(ventas: Venta[], socio: SocioId): number {
  return redondear(ventas.reduce((suma, v) => suma + (socio === 'pedro' ? v.repartoPedro : v.repartoJuan), 0));
}

export function gananciaAlquilerSocio(cuenta: CuentaSocio, gananciaVentas: number): number {
  return redondear(cuenta.gananciaAcumulada - gananciaVentas);
}

export function inversionAcumulada(compras: Compra[]): number {
  return redondear(compras.reduce((suma, c) => suma + c.costoTotal, 0));
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
  const alquileresDia = alquileres.filter((a) => a.estado === 'finalizado' && a.fin && isSameDay(new Date(a.fin), dia));

  const porMetodo: Record<MetodoPagoVenta, number> = { efectivo: 0, transferencia: 0, credito: 0 };
  for (const venta of ventasDia) porMetodo[venta.metodoPago] += venta.total;
  for (const alquiler of alquileresDia) {
    if (alquiler.metodoPago) porMetodo[alquiler.metodoPago] += alquiler.monto ?? 0;
  }

  const ventasTotal = redondear(ventasDia.reduce((suma, v) => suma + v.total, 0));
  const gananciaVentas = redondear(ventasDia.reduce((suma, v) => suma + v.gananciaBruta, 0));
  const alquilerTotal = redondear(alquileresDia.reduce((suma, a) => suma + (a.monto ?? 0), 0));

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

// Base de ejemplo = capital actual (o 10000 si no hay capital). Venta de ejemplo a 1.5 veces el costo.
export function ejemploReparto(capitalPedro: number, capitalJuan: number) {
  const base = capitalPedro + capitalJuan > 0 ? redondear(capitalPedro + capitalJuan) : 10000;
  const precioVenta = redondear(base * 1.5);
  const calculo = calcularVenta(
    [{ cantidad: 1, precioUnitario: precioVenta, costoUnitarioMomento: base }],
    capitalPedro,
    capitalJuan
  );
  return { capitalPedro, capitalJuan, base, precioVenta, calculo };
}
