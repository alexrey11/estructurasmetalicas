export type SocioId = string;

export type Socio = { id: SocioId; nombre: string; pin: string; color: string };

export type TipoProducto = 'tubo' | 'angular' | 'otro';
export type UnidadVenta = 'barra' | 'metro' | 'unidad' | 'libra' | 'litro' | 'paquete';

export type Producto = {
  id: string;
  tipo: TipoProducto;
  nombre: string;
  medida: string;
  largoEstandar: number;
  unidadVenta: UnidadVenta;
  costoUnitario: number;
  precioVentaUnitario: number;
  stockActual: number;
  stockMinimo: number;
  categoria?: string;
};

export type DatosProducto = Omit<Producto, 'id' | 'stockActual'>;

export type Compra = {
  id: string;
  productoId: string;
  cantidad: number;
  costoTotal: number;
  aportes: Record<SocioId, number>;
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
  reparto: Record<SocioId, number>;
  cliente?: string;
  estadoPago: 'pagado' | 'pendiente';
};

export type EstadoTriciclo = 'disponible' | 'alquilado' | 'cargando';

export type Triciclo = {
  id: string;
  nombre: string;
  precioAlquiler: number;
  estado: EstadoTriciclo;
  cargandoHasta?: string;
};

export type Alquiler = {
  id: string;
  tricicloId: string;
  cliente: string;
  telefono: string;
  carnet: string;
  inicio: string;
  fin?: string;
  montoPactado: number;
  monto?: number;
  metodoPago?: MetodoPagoAlquiler;
  estado: 'activo' | 'finalizado';
};

export type DatosAlquiler = {
  tricicloId: string;
  cliente: string;
  telefono: string;
  carnet: string;
  montoPactado: number;
};

export type Retiro = {
  id: string;
  socioId: SocioId;
  monto: number;
  fecha: string;
  nota?: string;
};

export type Gasto = {
  id: string;
  descripcion: string;
  monto: number;
  fecha: string;
  socioId?: SocioId;
};

// NUEVO: tipo Moneda
export type Moneda = {
  codigo: string;      // 'CUP', 'USD', 'EUR', 'MLC', 'ZELLE'
  nombre: string;      // 'Peso Cubano', 'Dólar EE.UU.', etc.
  tasaEnBase: number;  // cuántos CUP vale 1 unidad. CUP siempre = 1.
};

export type Config = {
  moneda: string;
  nombreNegocio: string;
  repartoAlquiler: Record<SocioId, number>;
  monedas: Moneda[];   // ← NUEVO
};

export type CuentaSocio = { capital: number; gananciaAcumulada: number; retiros: number };

export type EstadoDatos = {
  socios: Socio[];
  productos: Producto[];
  compras: Compra[];
  ventas: Venta[];
  triciclos: Triciclo[];
  alquileres: Alquiler[];
  retiros: Retiro[];
  gastos: Gasto[];
  config: Config;
  cuentas: Record<SocioId, CuentaSocio>;
};

export type Resultado<T = null> = { ok: true; data: T } | { ok: false; error: string };

export type TabId = 'inicio' | 'ventas' | 'alquiler' | 'cuadre';