import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  calcularCobro, calcularVenta, redondear, repartirAlquiler, saldoDisponible,
  segundosTranscurridos, validarBateria, validarCompra, validarInicioAlquiler,
  validarProducto, validarStock,
} from '@/lib/calculos';
import { COLORES_SOCIOS, datosIniciales } from '@/lib/seed';
import type {
  Alquiler, Compra, Config, DatosAlquiler, DatosCompra, DatosProducto, EstadoDatos,
  EstadoTriciclo, MetodoPagoAlquiler, MetodoPagoVenta, Producto, Resultado, Retiro,
  Socio, SocioId, Triciclo, Venta, VentaItem,
} from '@/lib/types';
import { exito, fallo, formatMonto, newId } from '@/lib/utils';

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
  registrarVenta: (lineas: { productoId: string; cantidad: number }[], metodoPago: MetodoPagoVenta) => Resultado<Venta>;

  iniciarAlquiler: (datos: DatosAlquiler) => Resultado<Alquiler>;
  finalizarAlquiler: (id: string, datos: { bateriaFin: number; metodoPago: MetodoPagoAlquiler }) => Resultado;
  cambiarEstadoTriciclo: (id: string, estado: Extract<EstadoTriciclo, 'disponible' | 'mantenimiento'>) => Resultado;

  // NUEVAS ACCIONES DE TRICICLOS
  crearTriciclo: (datos: { nombre: string; tarifaPorMinuto: number }) => Resultado<Triciclo>;
  actualizarTriciclo: (id: string, datos: Partial<Pick<Triciclo, 'nombre' | 'tarifaPorMinuto' | 'bateria'>>) => Resultado;
  eliminarTriciclo: (id: string) => Resultado;

  registrarRetiro: (datos: { socioId: SocioId; monto: number; nota?: string }) => Resultado<Retiro>;
  actualizarConfig: (datos: Partial<Config>) => Resultado;
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
        if (state.socios.some((s) => s.nombre.toLowerCase() === n.toLowerCase())) {
          return fallo('Ya existe un socio con ese nombre.');
        }
        const usado = new Set(state.socios.map((s) => s.color));
        const libre = COLORES_SOCIOS.find((c) => !usado.has(c)) ?? COLORES_SOCIOS[state.socios.length % COLORES_SOCIOS.length];
        const socio: Socio = { id: newId('socio'), nombre: n, pin, color: color ?? libre };
        const nuevosSocios = [...state.socios, socio];
        const pct = 100 / nuevosSocios.length;
        set({
          socios: nuevosSocios,
          cuentas: { ...state.cuentas, [socio.id]: { capital: 0, gananciaAcumulada: 0, retiros: 0 } },
          config: {
            ...state.config,
            repartoAlquiler: Object.fromEntries(nuevosSocios.map((s) => [s.id, pct])),
          },
        });
        return exito(socio);
      },

      actualizarSocio: (id, datos) => {
        const state = get();
        if (!state.socios.some((s) => s.id === id)) return fallo('Socio no encontrado.');
        if (datos.pin !== undefined && !/^\d{4}$/.test(datos.pin)) return fallo('El PIN debe ser de 4 dígitos.');
        set({
          socios: state.socios.map((s) => (s.id === id ? { ...s, ...datos } : s)),
        });
        return exito(null);
      },

      eliminarSocio: (id) => {
        const state = get();
        if (state.socios.length <= 1) return fallo('Debe quedar al menos un socio.');
        const cuenta = state.cuentas[id];
        if (!cuenta) return fallo('Socio no encontrado.');
        if (cuenta.capital > 0 || cuenta.gananciaAcumulada > 0 || cuenta.retiros > 0) {
          return fallo('No se puede eliminar: el socio tiene movimientos registrados.');
        }
        const nuevos = state.socios.filter((s) => s.id !== id);
        const cuentas = { ...state.cuentas };
        delete cuentas[id];
        const pct = 100 / nuevos.length;
        set({
          socios: nuevos,
          cuentas,
          config: {
            ...state.config,
            repartoAlquiler: Object.fromEntries(nuevos.map((s) => [s.id, pct])),
          },
        });
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
        if (conVentas) return fallo('No se puede eliminar: el producto tiene ventas registradas.');
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
          return {
            compras: [...s.compras, compra],
            productos: s.productos.map((p) =>
              p.id === compra.productoId ? { ...p, stockActual: p.stockActual + compra.cantidad } : p
            ),
            cuentas,
          };
        });
        return exito(compra);
      },

      registrarVenta: (lineas, metodoPago) => {
        const state = get();
        if (!state.sesion) return fallo('Inicia sesión para registrar ventas.');
        if (lineas.length === 0) return fallo('Agrega al menos un producto a la venta.');
        const errorStock = validarStock(state.productos, lineas);
        if (errorStock) return fallo(errorStock);

        const items: VentaItem[] = lineas.map((l) => {
          const p = state.productos.find((x) => x.id === l.productoId)!;
          return {
            productoId: p.id,
            cantidad: l.cantidad,
            precioUnitario: p.precioVentaUnitario,
            costoUnitarioMomento: p.costoUnitario,
          };
        });

        const capitales = Object.fromEntries(state.socios.map((s) => [s.id, state.cuentas[s.id]?.capital ?? 0]));
        const calculo = calcularVenta(items, capitales);

        const venta: Venta = {
          id: newId('venta'),
          fecha: ahoraIso(),
          items,
          total: calculo.total,
          cogs: calculo.cogs,
          gananciaBruta: calculo.gananciaBruta,
          metodoPago,
          socioAtendio: state.sesion,
          reparto: calculo.reparto,
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
          inicio: ahoraIso(),
          bateriaInicio: datos.bateriaInicio,
          minutosContratados: datos.minutosContratados,
          estado: 'activo',
        };
        set((s) => ({
          alquileres: [alquiler, ...s.alquileres],
          triciclos: s.triciclos.map((t): Triciclo =>
            t.id === triciclo.id ? { ...t, estado: 'alquilado', bateria: datos.bateriaInicio } : t
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
        const error = validarBateria(datos.bateriaFin);
        if (error) return fallo(error);

        const ahora = new Date();
        const { minutos, monto } = calcularCobro(
          segundosTranscurridos(alquiler.inicio, ahora.getTime()),
          triciclo.tarifaPorMinuto
        );
        const reparto = repartirAlquiler(monto, state.config.repartoAlquiler);

        const finalizado: Alquiler = {
          ...alquiler,
          estado: 'finalizado',
          fin: ahora.toISOString(),
          duracionMinutos: minutos,
          monto,
          metodoPago: datos.metodoPago,
          bateriaFin: datos.bateriaFin,
        };

        set((s) => {
          const cuentas = { ...s.cuentas };
          for (const [socioId, ganancia] of Object.entries(reparto)) {
            if (cuentas[socioId]) {
              cuentas[socioId] = {
                ...cuentas[socioId],
                gananciaAcumulada: redondear(cuentas[socioId].gananciaAcumulada + ganancia),
              };
            }
          }
          return {
            alquileres: s.alquileres.map((a) => (a.id === id ? finalizado : a)),
            triciclos: s.triciclos.map((t): Triciclo =>
              t.id === triciclo.id ? { ...t, estado: 'disponible', bateria: datos.bateriaFin } : t
            ),
            cuentas,
          };
        });
        return exito(null);
      },

      cambiarEstadoTriciclo: (id, estado) => {
        const triciclo = get().triciclos.find((t) => t.id === id);
        if (!triciclo) return fallo('No se encontró el triciclo.');
        if (triciclo.estado === 'alquilado') return fallo('No puedes cambiar el estado de un triciclo alquilado.');
        set((s) => ({
          triciclos: s.triciclos.map((t): Triciclo => (t.id === id ? { ...t, estado } : t)),
        }));
        return exito(null);
      },

      // --- NUEVAS ACCIONES DE TRICICLOS ---
      crearTriciclo: (datos) => {
        if (!datos.nombre.trim()) return fallo('Escribe el nombre del triciclo.');
        if (!(datos.tarifaPorMinuto > 0)) return fallo('La tarifa debe ser mayor que cero.');
        const triciclo: Triciclo = {
          id: newId('triciclo'),
          nombre: datos.nombre.trim(),
          tarifaPorMinuto: datos.tarifaPorMinuto,
          estado: 'disponible',
          bateria: 100,
        };
        set((s) => ({ triciclos: [...s.triciclos, triciclo] }));
        return exito(triciclo);
      },

      actualizarTriciclo: (id, datos) => {
        const state = get();
        const existe = state.triciclos.some((t) => t.id === id);
        if (!existe) return fallo('Triciclo no encontrado.');
        if (datos.tarifaPorMinuto !== undefined && datos.tarifaPorMinuto <= 0) {
          return fallo('La tarifa debe ser mayor que cero.');
        }
        set({
          triciclos: state.triciclos.map((t) => (t.id === id ? { ...t, ...datos } : t)),
        });
        return exito(null);
      },

      eliminarTriciclo: (id) => {
        const state = get();
        const conAlquileres = state.alquileres.some((a) => a.tricicloId === id);
        if (conAlquileres) return fallo('No se puede eliminar: tiene alquileres registrados.');
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
        const retiro: Retiro = {
          id: newId('retiro'),
          socioId,
          monto: redondear(monto),
          fecha: ahoraIso(),
          nota: nota?.trim() || undefined,
        };
        set((s) => ({
          retiros: [retiro, ...s.retiros],
          cuentas: {
            ...s.cuentas,
            [socioId]: { ...cuenta, retiros: redondear(cuenta.retiros + retiro.monto) },
          },
        }));
        return exito(retiro);
      },

      actualizarConfig: (datos) => {
        const state = get();
        const nueva: Config = { ...state.config, ...datos };
        if (!nueva.moneda.trim()) return fallo('Escribe la moneda.');
        if (!nueva.nombreNegocio.trim()) return fallo('Escribe el nombre del negocio.');
        const sumaAlq = Object.values(nueva.repartoAlquiler).reduce((a, b) => a + b, 0);
        if (Math.abs(sumaAlq - 100) > 0.5) return fallo('Los porcentajes de alquiler deben sumar 100 %.');
        set({ config: nueva });
        return exito(null);
      },
    }),
    {
      name: 'metaltrike-manager',
      version: 2,
      migrate: () => ({ ...datosIniciales(), sesion: null }),
    }
  )
);

export function sociosActuales(): Socio[] {
  return useStore.getState().socios;
}