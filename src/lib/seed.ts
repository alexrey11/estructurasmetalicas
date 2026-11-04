import type { Config, CuentaSocio, EstadoDatos, Moneda, Producto, Socio, SocioId, Triciclo } from '@/lib/types';

export const COLORES_SOCIOS = [
  '#10B981', '#3B82F6', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
];

export const SOCIOS_INICIALES: Socio[] = [
  { id: 'socio-1', nombre: 'Socio 1', pin: '1234', color: COLORES_SOCIOS[0] },
  { id: 'socio-2', nombre: 'Socio 2', pin: '1234', color: COLORES_SOCIOS[1] },
];

const PRODUCTOS_EJEMPLO: Producto[] = [];

const TRICICLOS_EJEMPLO: Triciclo[] = [
  { id: 'triciclo-1', nombre: 'Triciclo 1', precioAlquiler: 6000, estado: 'disponible' },
  { id: 'triciclo-2', nombre: 'Triciclo 2', precioAlquiler: 6000, estado: 'disponible' },
];

// Tasas por defecto (editables en Configuración)
const MONEDAS_INICIALES: Moneda[] = [
  { codigo: 'CUP', nombre: 'Peso Cubano', tasaEnBase: 1 },
  { codigo: 'USD', nombre: 'Dólar EE.UU.', tasaEnBase: 320 },
  { codigo: 'EUR', nombre: 'Euro', tasaEnBase: 350 },
  { codigo: 'MLC', nombre: 'MLC', tasaEnBase: 250 },
  { codigo: 'ZELLE', nombre: 'Zelle (USD)', tasaEnBase: 320 },
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
    monedas: MONEDAS_INICIALES.map((m) => ({ ...m })),
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
    gastos: [],
    config: configInicial(socios),
    cuentas: cuentasVacias(socios),
  };
}