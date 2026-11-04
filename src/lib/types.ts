export type SocioId = 'pedro' | 'juan';

export type Socio = { id: SocioId; nombre: string; pin: string };

export type TipoProducto = 'angular' | 'tubo';

export type Producto = {
  id: string;
  tipo: TipoProducto;
  medida: string;
  largoEstandar: number;
  unidad: 'barra' | 'metro';
  costoUnitario: number;
  precioVentaUnitario: number;
  stockActual: number;
  stockMinimo: number;
};

export type DatosProducto = Omit<Producto, 'id' | 'stockActual'>;

export type Compra = {
  id: string;
  productoId: string;
  cantidad: number;
  costoTotal: number;
  aportePedro: number;
  aporteJuan: number;
  proveedor: string;
  fecha: string;
};

export type DatosCompra = Omit<Compra, 'id' | 'fecha'>;

export type MetodoPagoVenta = 'efectivo' | 'transferencia' | 'credito';
export type MetodoPagoAlquiler = 'efectivo' | 'transferencia';

export type VentaItem = {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
  costoUnitarioMomento: number;
};

export type Venta = {
  id: string;
  fecha: string;
  items: VentaItem[];
  total: number;
  cogs: number;
  gananciaBruta: number;
  metodoPago: MetodoPagoVenta;
  socioAtendio: SocioId;
  repartoPedro: number;
  repartoJuan: number;
};

export type EstadoTriciclo = 'disponible' | 'alquilado' | 'mantenimiento';

export type Triciclo = {
  id: string;
  nombre: string;
  tarifaPorMinuto: number;
  estado: EstadoTriciclo;
  bateria: number;
};

export type Alquiler = {
  id: string;
  tricicloId: string;
  cliente: string;
  inicio: string;
  fin?: string;
  duracionMinutos?: number;
  monto?: number;
  metodoPago?: MetodoPagoAlquiler;
  bateriaInicio: number;
  bateriaFin?: number;
  estado: 'activo' | 'finalizado';
  minutosContratados?: number;
};

export type DatosAlquiler = {
  tricicloId: string;
  cliente: string;
  bateriaInicio: number;
  minutosContratados: number;
};

export type Retiro = {
  id: string;
  socioId: SocioId;
  monto: number;
  fecha: string;
  nota?: string;
};

export type Config = { moneda: string; porcentajeRepartoAlquiler: number };

export type CuentaSocio = { capital: number; gananciaAcumulada: number; retiros: number };

export type EstadoDatos = {
  productos: Producto[];
  compras: Compra[];
  ventas: Venta[];
  triciclos: Triciclo[];
  alquileres: Alquiler[];
  retiros: Retiro[];
  config: Config;
  cuentas: Record<SocioId, CuentaSocio>;
};

export type Resultado<T = null> = { ok: true; data: T } | { ok: false; error: string };

export type TabId = 'inicio' | 'ventas' | 'alquiler' | 'cuadre';
