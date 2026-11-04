import type { Config, CuentaSocio, EstadoDatos, Producto, Socio, SocioId, Triciclo } from '@/lib/types';

export const COLORES_SOCIOS = [
  '#10B981', '#3B82F6', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
];

export const SOCIOS_INICIALES: Socio[] = [
  { id: 'socio-1', nombre: 'Socio 1', pin: '1234', color: COLORES_SOCIOS[0] },
  { id: 'socio-2', nombre: 'Socio 2', pin: '1234', color: COLORES_SOCIOS[1] },
];

const PRODUCTOS_EJEMPLO: Producto[] = [
  { id: 'prod-tubo-30x30', tipo: 'tubo', medida: '30×30×3 mm', largoEstandar: 6, unidad: 'barra', costoUnitario: 10, precioVentaUnitario: 15, stockActual: 0, stockMinimo: 5 },
  { id: 'prod-tubo-40x40', tipo: 'tubo', medida: '40×40×2 mm', largoEstandar: 6, unidad: 'barra', costoUnitario: 14, precioVentaUnitario: 20, stockActual: 0, stockMinimo: 5 },
  { id: 'prod-angular-25x25', tipo: 'angular', medida: '25×25×3 mm', largoEstandar: 6, unidad: 'barra', costoUnitario: 8, precioVentaUnitario: 12, stockActual: 0, stockMinimo: 8 },
  { id: 'prod-angular-40x40', tipo: 'angular', medida: '40×40×4 mm', largoEstandar: 6, unidad: 'barra', costoUnitario: 18, precioVentaUnitario: 26, stockActual: 0, stockMinimo: 4 },
];

const TRICICLOS_EJEMPLO: Triciclo[] = [
  { id: 'triciclo-1', nombre: 'Triciclo 1', tarifaPorMinuto: 5, estado: 'disponible', bateria: 100 },
  { id: 'triciclo-2', nombre: 'Triciclo 2', tarifaPorMinuto: 5, estado: 'disponible', bateria: 100 },
];

export function cuentasVacias(socios: Socio[]): Record<SocioId, CuentaSocio> {
  return Object.fromEntries(socios.map((s) => [s.id, { capital: 0, gananciaAcumulada: 0, retiros: 0 }]));
}

export function configInicial(socios: Socio[]): Config {
  const pct = socios.length > 0 ? 100 / socios.length : 50;
  return {
    moneda: 'CUP',
    nombreNegocio: 'Mi negocio',
    repartoAlquiler: Object.fromEntries(socios.map((s) => [s.id, pct])),
  };
}

export function datosIniciales(socios: Socio[] = SOCIOS_INICIALES): EstadoDatos {
  return {
    socios,
    productos: PRODUCTOS_EJEMPLO.map((p) => ({ ...p })),
    compras: [],
    ventas: [],
    triciclos: TRICICLOS_EJEMPLO.map((t) => ({ ...t })),
    alquileres: [],
    retiros: [],
    config: configInicial(socios),
    cuentas: cuentasVacias(socios),
  };
}