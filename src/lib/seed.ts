import type { Compra, Config, CuentaSocio, EstadoDatos, Producto, Socio, SocioId, Triciclo } from '@/lib/types';

export const SOCIOS: Socio[] = [
  { id: 'pedro', nombre: 'Pedro', pin: '1234' },
  { id: 'juan', nombre: 'Juan', pin: '1234' },
];

const PRODUCTOS_SEMILLA: Producto[] = [
  {
    id: 'prod-tubo-30x30',
    tipo: 'tubo',
    medida: '30×30×3 mm',
    largoEstandar: 6,
    unidad: 'barra',
    costoUnitario: 10,
    precioVentaUnitario: 15,
    stockActual: 20,
    stockMinimo: 5,
  },
  {
    id: 'prod-tubo-40x40',
    tipo: 'tubo',
    medida: '40×40×2 mm',
    largoEstandar: 6,
    unidad: 'barra',
    costoUnitario: 14,
    precioVentaUnitario: 20,
    stockActual: 15,
    stockMinimo: 5,
  },
  {
    id: 'prod-angular-25x25',
    tipo: 'angular',
    medida: '25×25×3 mm',
    largoEstandar: 6,
    unidad: 'barra',
    costoUnitario: 8,
    precioVentaUnitario: 12,
    stockActual: 25,
    stockMinimo: 8,
  },
  {
    id: 'prod-angular-40x40',
    tipo: 'angular',
    medida: '40×40×4 mm',
    largoEstandar: 6,
    unidad: 'barra',
    costoUnitario: 18,
    precioVentaUnitario: 26,
    stockActual: 10,
    stockMinimo: 4,
  },
];

const FECHA_SEMILLA = new Date().toISOString();

const COMPRAS_SEMILLA: Compra[] = PRODUCTOS_SEMILLA.map((producto, indice) => ({
  id: `compra-semilla-${indice + 1}`,
  productoId: producto.id,
  cantidad: producto.stockActual,
  costoTotal: 2500,
  aportePedro: 1500,
  aporteJuan: 1000,
  proveedor: 'Inventario inicial',
  fecha: FECHA_SEMILLA,
}));

const TRICICLOS_SEMILLA: Triciclo[] = [
  { id: 'triciclo-1', nombre: 'Triciclo 1', tarifaPorMinuto: 5, estado: 'disponible', bateria: 100 },
  { id: 'triciclo-2', nombre: 'Triciclo 2', tarifaPorMinuto: 5, estado: 'disponible', bateria: 100 },
];

const CONFIG_INICIAL: Config = { moneda: 'CUP', porcentajeRepartoAlquiler: 50 };

function capitalDeSocio(socioId: SocioId): number {
  return COMPRAS_SEMILLA.reduce(
    (total, compra) => total + (socioId === 'pedro' ? compra.aportePedro : compra.aporteJuan),
    0
  );
}

export function datosIniciales(): EstadoDatos {
  const cuentas: Record<SocioId, CuentaSocio> = {
    pedro: { capital: capitalDeSocio('pedro'), gananciaAcumulada: 0, retiros: 0 },
    juan: { capital: capitalDeSocio('juan'), gananciaAcumulada: 0, retiros: 0 },
  };
  return {
    productos: PRODUCTOS_SEMILLA.map((producto) => ({ ...producto })),
    compras: COMPRAS_SEMILLA.map((compra) => ({ ...compra })),
    ventas: [],
    triciclos: TRICICLOS_SEMILLA.map((triciclo) => ({ ...triciclo })),
    alquileres: [],
    retiros: [],
    config: { ...CONFIG_INICIAL },
    cuentas,
  };
}
