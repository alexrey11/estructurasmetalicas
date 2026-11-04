import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  calcularVenta, redondear, repartirAlquiler, saldoDisponible,
  validarCompra, validarInicioAlquiler, validarProducto, validarStock,
} from '@/lib/calculos';
import { COLORES_SOCIOS, datosIniciales } from '@/lib/seed';
import type {
  Alquiler, Compra, Config, DatosAlquiler, DatosCompra, DatosProducto, EstadoDatos,
  EstadoTriciclo, MetodoPagoAlquiler, MetodoPagoVenta, Moneda, Producto, Resultado, Retiro,
  Socio, SocioId, Triciclo, Venta, VentaItem, Gasto,
} from '@/lib/types';
import { exito, fallo, formatMonto, newId } from '@/lib/utils';
import { createJSONStorage } from 'zustand/middleware';
import { capacitorStorage } from '@/lib/storage';

type Acciones = {
  login: (socio: SocioId) => void;
  logout: () => void;

  crearSocio: (datos: { nombre: string; pin: string; color?: string }) => Resultado<Socio>;
  actualizarSocio: (id: SocioId, datos: Partial<Pick<Socio, 'nombre' | 'pin' | 'color'>>) => Resultado;
  eliminarSocio: (id: SocioId) => Resultado;

  crearProducto: (datos: DatosProducto) => Resultado<Producto>;
  actualizarProducto: (id: string, datos: DatosProducto) => Resultado;
  eliminarProducto: (id: string) => Resultado;

  registrarCompra: (datos: DatosCompra) => Resultado<Compra>;
  eliminarCompra: (id: string) => Resultado;
  registrarVenta: (lineas: { productoId: string; cantidad: number }[], metodoPago: MetodoPagoVenta, cliente?: string) => Resultado<Venta>;
  marcarVentaPagada: (id: string) => Resultado;
  eliminarVenta: (id: string) => Resultado;

  iniciarAlquiler: (datos: DatosAlquiler) => Resultado<Alquiler>;
  finalizarAlquiler: (id: string, datos: { metodoPago: MetodoPagoAlquiler; monto?: number }) => Resultado;
  enviarACargar: (id: string, horas: number) => Resultado;
  marcarCargado: (id: string) => Resultado;

  crearTriciclo: (datos: { nombre: string; precioAlquiler: number }) => Resultado<Triciclo>;
  actualizarTriciclo: (id: string, datos: Partial<Pick<Triciclo, 'nombre' | 'precioAlquiler'>>) => Resultado;
  eliminarTriciclo: (id: string) => Resultado;

  registrarRetiro: (datos: { socioId: SocioId; monto: number; nota?: string }) => Resultado<Retiro>;
  registrarGasto: (datos: { descripcion: string; monto: number; socioId?: SocioId }) => Resultado<Gasto>;
  actualizarConfig: (datos: Partial<Config>) => Resultado;

  // NUEVO: gestión de monedas
  agregarMoneda: (datos: { codigo: string; nombre: string; tasaEnBase: number }) => Resultado<Moneda>;
  actualizarMoneda: (codigo: string, datos: Partial<Pick<Moneda, 'nombre' | 'tasaEnBase'>>) => Resultado;
  eliminarMoneda: (codigo: string) => Resultado;
};

export type EstadoApp = EstadoDatos & Acciones & { sesion: SocioId | null };

const ahoraIso = () => new Date().toISOString();

export const useStore = create<EstadoApp>()(
  persist(
    (set, get) => ({
      ...datosIniciales(),
      sesion: null,

      login: (socio) => set({ sesion: socio }),
      logout: () => set({ sesion: null }),

      crearSocio: ({ nombre, pin, color }) => {
        const n = nombre.trim();
        if (!n) return fallo('Escribe el nombre del socio.');
        if (!/^\d{4}$/.test(pin)) return fallo('El PIN debe ser de 4 dígitos.');
        const state = get();
        if (state.socios.some((s) => s.nombre.toLowerCase() === n.toLowerCase())) return fallo('Ya existe un socio con ese nombre.');
        const usado = new Set(state.socios.map((s) => s.color));
        const libre = COLORES_SOCIOS.find((c) => !usado.has(c)) ?? COLORES_SOCIOS[state.socios.length % COLORES_SOCIOS.length];
        const socio: Socio = { id: newId('socio'), nombre: n, pin, color: color ?? libre };
        const nuevosSocios = [...state.socios, socio];
        const pct = 100 / nuevosSocios.length;
        set({
          socios: nuevosSocios,
          cuentas: { ...state.cuentas, [socio.id]: { capital: 0, gananciaAcumulada: 0, retiros: 0 } },
          config: { ...state.config, repartoAlquiler: Object.fromEntries(nuevosSocios.map((s) => [s.id, pct])) },
        });
        return exito(socio);
      },

      actualizarSocio: (id, datos) => {
        const state = get();
        if (!state.socios.some((s) => s.id === id)) return fallo('Socio no encontrado.');
        if (datos.pin !== undefined && !/^\d{4}$/.test(datos.pin)) return fallo('El PIN debe ser de 4 dígitos.');
        set({ socios: state.socios.map((s) => (s.id === id ? { ...s, ...datos } : s)) });
        return exito(null);
      },

      eliminarSocio: (id) => {
        const state = get();
        if (state.socios.length <= 1) return fallo('Debe quedar al menos un socio.');
        const cuenta = state.cuentas[id];
        if (!cuenta) return fallo('Socio no encontrado.');
        if (cuenta.capital > 0 || cuenta.gananciaAcumulada > 0 || cuenta.retiros > 0) return fallo('No se puede eliminar: tiene movimientos.');
        const nuevos = state.socios.filter((s) => s.id !== id);
        const cuentas = { ...state.cuentas };
        delete cuentas[id];
        const pct = 100 / nuevos.length;
        set({ socios: nuevos, cuentas, config: { ...state.config, repartoAlquiler: Object.fromEntries(nuevos.map((s) => [s.id, pct])) } });
        return exito(null);
      },

      crearProducto: (datos) => {
        const error = validarProducto(datos);
        if (error) return fallo(error);
        const producto: Producto = { ...datos, id: newId('prod'), stockActual: 0 };
        set((s) => ({ productos: [...s.productos, producto] }));
        return exito(producto);
      },

      actualizarProducto: (id, datos) => {
        const error = validarProducto(datos);
        if (error) return fallo(error);
        set((s) => ({ productos: s.productos.map((p) => (p.id === id ? { ...p, ...datos } : p)) }));
        return exito(null);
      },

      eliminarProducto: (id) => {
        const state = get();
        const conVentas = state.ventas.some((v) => v.items.some((i) => i.productoId === id));
        if (conVentas) return fallo('No se puede eliminar: tiene ventas registradas.');
        set({ productos: state.productos.filter((p) => p.id !== id) });
        return exito(null);
      },

      registrarCompra: (datos) => {
        const state = get();
        if (!state.productos.some((p) => p.id === datos.productoId)) return fallo('Selecciona un producto.');
        const error = validarCompra(datos);
        if (error) return fallo(error);
        const compra: Compra = { ...datos, id: newId('compra'), fecha: ahoraIso() };
        set((s) => {
          const cuentas = { ...s.cuentas };
          for (const [socioId, aporte] of Object.entries(datos.aportes)) {
            if (aporte > 0 && cuentas[socioId]) {
              cuentas[socioId] = { ...cuentas[socioId], capital: redondear(cuentas[socioId].capital + aporte) };
            }
          }
          const productoActual = s.productos.find((p) => p.id === datos.productoId)!;
          const nuevoStock = productoActual.stockActual + datos.cantidad;
          const costoTotalActual = productoActual.stockActual * productoActual.costoUnitario;
          const nuevoCostoUnitario = redondear((costoTotalActual + datos.costoTotal) / nuevoStock);
          return {
            compras: [...s.compras, compra],
            productos: s.productos.map((p) =>
              p.id === compra.productoId ? { ...p, stockActual: nuevoStock, costoUnitario: nuevoCostoUnitario } : p
            ),
            cuentas,
          };
        });
        return exito(compra);
      },

      eliminarCompra: (id) => {
        const state = get();
        const compra = state.compras.find((c) => c.id === id);
        if (!compra) return fallo('Compra no encontrada.');
        const producto = state.productos.find((p) => p.id === compra.productoId);
        if (producto && producto.stockActual < compra.cantidad) return fallo('No puedes anular: ya vendiste parte de ese stock.');
        set((s) => {
          const cuentas = { ...s.cuentas };
          for (const [socioId, aporte] of Object.entries(compra.aportes)) {
            if (aporte > 0 && cuentas[socioId]) {
              cuentas[socioId] = { ...cuentas[socioId], capital: redondear(cuentas[socioId].capital - aporte) };
            }
          }
          return {
            compras: s.compras.filter((c) => c.id !== id),
            productos: s.productos.map((p) => p.id === compra.productoId ? { ...p, stockActual: p.stockActual - compra.cantidad } : p),
            cuentas,
          };
        });
        return exito(null);
      },

      registrarVenta: (lineas, metodoPago, cliente) => {
        const state = get();
        if (!state.sesion) return fallo('Inicia sesión para registrar ventas.');
        if (lineas.length === 0) return fallo('Agrega al menos un producto a la venta.');
        if (metodoPago === 'credito' && !cliente?.trim()) return fallo('Escribe el nombre del cliente para ventas a crédito.');
        const errorStock = validarStock(state.productos, lineas);
        if (errorStock) return fallo(errorStock);

        const items: VentaItem[] = lineas.map((l) => {
          const p = state.productos.find((x) => x.id === l.productoId)!;
          return { productoId: p.id, cantidad: l.cantidad, precioUnitario: p.precioVentaUnitario, costoUnitarioMomento: p.costoUnitario };
        });

        const capitales = Object.fromEntries(state.socios.map((s) => [s.id, state.cuentas[s.id]?.capital ?? 0]));
        const calculo = calcularVenta(items, capitales);

        const venta: Venta = {
          id: newId('venta'),
          fecha: ahoraIso(),
          items, total: calculo.total, cogs: calculo.cogs, gananciaBruta: calculo.gananciaBruta,
          metodoPago, socioAtendio: state.sesion, reparto: calculo.reparto,
          cliente: metodoPago === 'credito' ? cliente?.trim() : undefined,
          estadoPago: metodoPago === 'credito' ? 'pendiente' : 'pagado',
        };

        set((s) => {
          const cuentas = { ...s.cuentas };
          for (const [socioId, ganancia] of Object.entries(calculo.reparto)) {
            if (cuentas[socioId]) {
              cuentas[socioId] = {
                ...cuentas[socioId],
                capital: redondear(cuentas[socioId].capital - (calculo.reembolso[socioId] ?? 0)),
                gananciaAcumulada: redondear(cuentas[socioId].gananciaAcumulada + ganancia),
              };
            }
          }
          return {
            ventas: [venta, ...s.ventas],
            productos: s.productos.map((p) => {
              const v = items.find((i) => i.productoId === p.id);
              return v ? { ...p, stockActual: p.stockActual - v.cantidad } : p;
            }),
            cuentas,
          };
        });
        return exito(venta);
      },

      marcarVentaPagada: (id) => {
        set((s) => ({ ventas: s.ventas.map((v) => (v.id === id ? { ...v, estadoPago: 'pagado' } : v)) }));
        return exito(null);
      },

      eliminarVenta: (id) => {
        const state = get();
        const venta = state.ventas.find((v) => v.id === id);
        if (!venta) return fallo('Venta no encontrada.');
        set((s) => {
          const cuentas = { ...s.cuentas };
          for (const [socioId, ganancia] of Object.entries(venta.reparto)) {
            if (cuentas[socioId]) {
              const pct = venta.gananciaBruta > 0 ? ganancia / venta.gananciaBruta : 1 / state.socios.length;
              const reembolso = venta.cogs * pct;
              cuentas[socioId] = {
                ...cuentas[socioId],
                capital: redondear(cuentas[socioId].capital + reembolso),
                gananciaAcumulada: redondear(cuentas[socioId].gananciaAcumulada - ganancia),
              };
            }
          }
          return {
            ventas: s.ventas.filter((v) => v.id !== id),
            productos: s.productos.map((p) => {
              const item = venta.items.find((i) => i.productoId === p.id);
              return item ? { ...p, stockActual: p.stockActual + item.cantidad } : p;
            }),
            cuentas,
          };
        });
        return exito(null);
      },

      iniciarAlquiler: (datos) => {
        const state = get();
        const triciclo = state.triciclos.find((t) => t.id === datos.tricicloId);
        if (!triciclo) return fallo('Selecciona un triciclo.');
        if (triciclo.estado !== 'disponible') return fallo(`${triciclo.nombre} no está disponible.`);
        const error = validarInicioAlquiler(datos);
        if (error) return fallo(error);
        const alquiler: Alquiler = {
          id: newId('alq'),
          tricicloId: triciclo.id,
          cliente: datos.cliente.trim(),
          telefono: datos.telefono.trim(),
          carnet: datos.carnet.trim(),
          montoPactado: redondear(datos.montoPactado),
          inicio: ahoraIso(),
          estado: 'activo',
        };
        set((s) => ({
          alquileres: [alquiler, ...s.alquileres],
          triciclos: s.triciclos.map((t): Triciclo =>
            t.id === triciclo.id ? { ...t, estado: 'alquilado' } : t
          ),
        }));
        return exito(alquiler);
      },

      finalizarAlquiler: (id, datos) => {
        const state = get();
        const alquiler = state.alquileres.find((a) => a.id === id);
        if (!alquiler || alquiler.estado !== 'activo') return fallo('Este alquiler ya no está activo.');
        const triciclo = state.triciclos.find((t) => t.id === alquiler.tricicloId);
        if (!triciclo) return fallo('No se encontró el triciclo.');
        const montoFinal = redondear(datos.monto ?? alquiler.montoPactado);
        const reparto = repartirAlquiler(montoFinal, state.config.repartoAlquiler);
        const finalizado: Alquiler = {
          ...alquiler,
          estado: 'finalizado',
          fin: ahoraIso(),
          monto: montoFinal,
          metodoPago: datos.metodoPago,
        };
        set((s) => {
          const cuentas = { ...s.cuentas };
          for (const [socioId, ganancia] of Object.entries(reparto)) {
            if (cuentas[socioId]) {
              cuentas[socioId] = { ...cuentas[socioId], gananciaAcumulada: redondear(cuentas[socioId].gananciaAcumulada + ganancia) };
            }
          }
          return {
            alquileres: s.alquileres.map((a) => (a.id === id ? finalizado : a)),
            triciclos: s.triciclos.map((t): Triciclo => t.id === triciclo.id ? { ...t, estado: 'disponible' } : t),
            cuentas,
          };
        });
        return exito(null);
      },

      enviarACargar: (id, horas) => {
        if (!(horas > 0)) return fallo('Las horas deben ser mayores que cero.');
        const state = get();
        const triciclo = state.triciclos.find((t) => t.id === id);
        if (!triciclo) return fallo('Triciclo no encontrado.');
        if (triciclo.estado === 'alquilado') return fallo('El triciclo está alquilado.');
        const cargandoHasta = new Date(Date.now() + horas * 3600 * 1000).toISOString();
        set((s) => ({
          triciclos: s.triciclos.map((t): Triciclo =>
            t.id === id ? { ...t, estado: 'cargando', cargandoHasta } : t
          ),
        }));
        return exito(null);
      },

      marcarCargado: (id) => {
        set((s) => ({
          triciclos: s.triciclos.map((t): Triciclo =>
            t.id === id ? { ...t, estado: 'disponible', cargandoHasta: undefined } : t
          ),
        }));
        return exito(null);
      },

      crearTriciclo: (datos) => {
        if (!datos.nombre.trim()) return fallo('Escribe el nombre del triciclo.');
        if (!(datos.precioAlquiler > 0)) return fallo('El precio debe ser mayor que cero.');
        const triciclo: Triciclo = {
          id: newId('triciclo'),
          nombre: datos.nombre.trim(),
          precioAlquiler: redondear(datos.precioAlquiler),
          estado: 'disponible',
        };
        set((s) => ({ triciclos: [...s.triciclos, triciclo] }));
        return exito(triciclo);
      },

      actualizarTriciclo: (id, datos) => {
        const state = get();
        if (!state.triciclos.some((t) => t.id === id)) return fallo('Triciclo no encontrado.');
        if (datos.precioAlquiler !== undefined && datos.precioAlquiler <= 0) return fallo('El precio debe ser mayor que cero.');
        set({ triciclos: state.triciclos.map((t) => (t.id === id ? { ...t, ...datos } : t)) });
        return exito(null);
      },

      eliminarTriciclo: (id) => {
        const state = get();
        if (state.alquileres.some((a) => a.tricicloId === id)) return fallo('No se puede eliminar: tiene alquileres.');
        set({ triciclos: state.triciclos.filter((t) => t.id !== id) });
        return exito(null);
      },

      registrarRetiro: ({ socioId, monto, nota }) => {
        const state = get();
        if (!(monto > 0)) return fallo('El monto debe ser mayor que cero.');
        const cuenta = state.cuentas[socioId];
        if (!cuenta) return fallo('Socio no encontrado.');
        const saldo = saldoDisponible(cuenta);
        if (monto > saldo) return fallo(`Saldo insuficiente. Disponible: ${formatMonto(saldo, state.config.moneda)}.`);
        const retiro: Retiro = { id: newId('retiro'), socioId, monto: redondear(monto), fecha: ahoraIso(), nota: nota?.trim() || undefined };
        set((s) => ({
          retiros: [retiro, ...s.retiros],
          cuentas: { ...s.cuentas, [socioId]: { ...cuenta, retiros: redondear(cuenta.retiros + retiro.monto) } },
        }));
        return exito(retiro);
      },

      registrarGasto: (datos) => {
        if (!datos.descripcion.trim()) return fallo('Escribe una descripción.');
        if (datos.monto <= 0) return fallo('El monto debe ser mayor a 0.');
        const gasto: Gasto = { id: newId('gasto'), descripcion: datos.descripcion, monto: redondear(datos.monto), fecha: ahoraIso(), socioId: datos.socioId };
        set((s) => ({ gastos: [gasto, ...s.gastos] }));
        return exito(gasto);
      },

      actualizarConfig: (datos) => {
        const state = get();
        const nueva: Config = { ...state.config, ...datos };
        if (!nueva.moneda.trim()) return fallo('Escribe la moneda.');
        if (!nueva.nombreNegocio.trim()) return fallo('Escribe el nombre del negocio.');
        const sumaAlq = Object.values(nueva.repartoAlquiler).reduce((a, b) => a + b, 0);
        if (Math.abs(sumaAlq - 100) > 0.5) return fallo('Los porcentajes deben sumar 100 %.');
        set({ config: nueva });
        return exito(null);
      },

      // --- MONEDAS ---
      agregarMoneda: (datos) => {
        const codigo = datos.codigo.trim().toUpperCase();
        if (!codigo) return fallo('Escribe un código (ej. USD).');
        if (!datos.nombre.trim()) return fallo('Escribe un nombre.');
        if (!(datos.tasaEnBase > 0)) return fallo('La tasa debe ser mayor que cero.');
        const state = get();
        if (state.config.monedas.some((m) => m.codigo === codigo)) return fallo('Ya existe una moneda con ese código.');
        const moneda: Moneda = { codigo, nombre: datos.nombre.trim(), tasaEnBase: datos.tasaEnBase };
        set({
          config: { ...state.config, monedas: [...state.config.monedas, moneda] },
        });
        return exito(moneda);
      },

      actualizarMoneda: (codigo, datos) => {
        const state = get();
        const existente = state.config.monedas.find((m) => m.codigo === codigo);
        if (!existente) return fallo('Moneda no encontrada.');
        if (codigo === 'CUP' && datos.tasaEnBase !== undefined && datos.tasaEnBase !== 1) {
          return fallo('El CUP siempre vale 1 (es la base).');
        }
        if (datos.tasaEnBase !== undefined && !(datos.tasaEnBase > 0)) return fallo('La tasa debe ser mayor que cero.');
        set({
          config: {
            ...state.config,
            monedas: state.config.monedas.map((m) =>
              m.codigo === codigo ? { ...m, ...datos } : m
            ),
          },
        });
        return exito(null);
      },

      eliminarMoneda: (codigo) => {
        if (codigo === 'CUP') return fallo('No puedes eliminar el CUP: es la moneda base.');
        const state = get();
        if (state.config.monedas.length <= 1) return fallo('Debe quedar al menos una moneda.');
        set({
          config: {
            ...state.config,
            monedas: state.config.monedas.filter((m) => m.codigo !== codigo),
          },
        });
        return exito(null);
      },
    }),
    {
      name: 'metaltrike-manager',
      version: 5,
      migrate: () => ({ ...datosIniciales(), sesion: null }),
      storage: createJSONStorage(() => capacitorStorage),
    }
  )
);

export function sociosActuales(): Socio[] {
  return useStore.getState().socios;
}