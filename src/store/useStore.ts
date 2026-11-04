import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  calcularCobro,
  calcularVenta,
  redondear,
  repartirAlquiler,
  saldoDisponible,
  segundosTranscurridos,
  validarBateria,
  validarCompra,
  validarInicioAlquiler,
  validarProducto,
  validarStock,
} from '@/lib/calculos';
import { datosIniciales } from '@/lib/seed';
import type {
  Alquiler,
  Compra,
  Config,
  DatosAlquiler,
  DatosCompra,
  DatosProducto,
  EstadoDatos,
  EstadoTriciclo,
  MetodoPagoAlquiler,
  MetodoPagoVenta,
  Producto,
  Resultado,
  Retiro,
  SocioId,
  Triciclo,
  Venta,
  VentaItem,
} from '@/lib/types';
import { exito, fallo, formatMonto, newId } from '@/lib/utils';

type Acciones = {
  login: (socio: SocioId) => void;
  logout: () => void;
  crearProducto: (datos: DatosProducto) => Resultado<Producto>;
  actualizarProducto: (id: string, datos: DatosProducto) => Resultado;
  registrarCompra: (datos: DatosCompra) => Resultado<Compra>;
  registrarVenta: (lineas: { productoId: string; cantidad: number }[], metodoPago: MetodoPagoVenta) => Resultado<Venta>;
  iniciarAlquiler: (datos: DatosAlquiler) => Resultado<Alquiler>;
  finalizarAlquiler: (id: string, datos: { bateriaFin: number; metodoPago: MetodoPagoAlquiler }) => Resultado;
  cambiarEstadoTriciclo: (id: string, estado: Extract<EstadoTriciclo, 'disponible' | 'mantenimiento'>) => Resultado;
  registrarRetiro: (datos: { socioId: SocioId; monto: number; nota?: string }) => Resultado<Retiro>;
  actualizarConfig: (datos: Config) => Resultado;
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

      crearProducto: (datos) => {
        const error = validarProducto(datos);
        if (error) return fallo(error);
        const producto: Producto = { ...datos, id: newId('prod'), stockActual: 0 };
        set((s) => ({ productos: [...s.productos, producto] }));
        return exito(producto);
      },

      actualizarProducto: (id, datos) => {
        const existe = get().productos.some((p) => p.id === id);
        if (!existe) return fallo('No se encontró el producto.');
        const error = validarProducto(datos);
        if (error) return fallo(error);
        set((s) => ({
          productos: s.productos.map((p) => (p.id === id ? { ...p, ...datos } : p)),
        }));
        return exito(null);
      },

      registrarCompra: (datos) => {
        const { productos, cuentas } = get();
        if (!productos.some((p) => p.id === datos.productoId)) return fallo('Selecciona un producto.');
        const error = validarCompra(datos);
        if (error) return fallo(error);

        const compra: Compra = { ...datos, id: newId('compra'), fecha: ahoraIso() };
        set((s) => ({
          compras: [...s.compras, compra],
          productos: s.productos.map((p) =>
            p.id === compra.productoId ? { ...p, stockActual: p.stockActual + compra.cantidad } : p
          ),
          cuentas: {
            pedro: { ...cuentas.pedro, capital: redondear(cuentas.pedro.capital + compra.aportePedro) },
            juan: { ...cuentas.juan, capital: redondear(cuentas.juan.capital + compra.aporteJuan) },
          },
        }));
        return exito(compra);
      },

      registrarVenta: (lineas, metodoPago) => {
        const { sesion, productos, cuentas } = get();
        if (!sesion) return fallo('Inicia sesión para registrar ventas.');
        if (lineas.length === 0) return fallo('Agrega al menos un producto a la venta.');
        const errorStock = validarStock(productos, lineas);
        if (errorStock) return fallo(errorStock);

        const items: VentaItem[] = lineas.map((linea) => {
          const producto = productos.find((p) => p.id === linea.productoId)!;
          return {
            productoId: producto.id,
            cantidad: linea.cantidad,
            precioUnitario: producto.precioVentaUnitario,
            costoUnitarioMomento: producto.costoUnitario,
          };
        });

        const calculo = calcularVenta(items, cuentas.pedro.capital, cuentas.juan.capital);
        const venta: Venta = {
          id: newId('venta'),
          fecha: ahoraIso(),
          items,
          total: calculo.total,
          cogs: calculo.cogs,
          gananciaBruta: calculo.gananciaBruta,
          metodoPago,
          socioAtendio: sesion,
          repartoPedro: calculo.repartoPedro,
          repartoJuan: calculo.repartoJuan,
        };

        set((s) => ({
          ventas: [venta, ...s.ventas],
          productos: s.productos.map((p) => {
            const vendido = items.find((i) => i.productoId === p.id);
            return vendido ? { ...p, stockActual: p.stockActual - vendido.cantidad } : p;
          }),
          cuentas: {
            pedro: {
              ...s.cuentas.pedro,
              capital: redondear(s.cuentas.pedro.capital - calculo.reembolsoPedro),
              gananciaAcumulada: redondear(s.cuentas.pedro.gananciaAcumulada + calculo.repartoPedro),
            },
            juan: {
              ...s.cuentas.juan,
              capital: redondear(s.cuentas.juan.capital - calculo.reembolsoJuan),
              gananciaAcumulada: redondear(s.cuentas.juan.gananciaAcumulada + calculo.repartoJuan),
            },
          },
        }));
        return exito(venta);
      },

      iniciarAlquiler: (datos) => {
        const { triciclos } = get();
        const triciclo = triciclos.find((t) => t.id === datos.tricicloId);
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
        const { alquileres, triciclos, config, cuentas } = get();
        const alquiler = alquileres.find((a) => a.id === id);
        if (!alquiler || alquiler.estado !== 'activo') return fallo('Este alquiler ya no está activo.');
        const triciclo = triciclos.find((t) => t.id === alquiler.tricicloId);
        if (!triciclo) return fallo('No se encontró el triciclo de este alquiler.');
        const error = validarBateria(datos.bateriaFin);
        if (error) return fallo(error);

        const ahora = new Date();
        const { minutos, monto } = calcularCobro(
          segundosTranscurridos(alquiler.inicio, ahora.getTime()),
          triciclo.tarifaPorMinuto
        );
        const { repartoPedro, repartoJuan } = repartirAlquiler(monto, config.porcentajeRepartoAlquiler);

        const finalizado: Alquiler = {
          ...alquiler,
          estado: 'finalizado',
          fin: ahora.toISOString(),
          duracionMinutos: minutos,
          monto,
          metodoPago: datos.metodoPago,
          bateriaFin: datos.bateriaFin,
        };
        set((s) => ({
          alquileres: s.alquileres.map((a) => (a.id === id ? finalizado : a)),
          triciclos: s.triciclos.map((t): Triciclo =>
            t.id === triciclo.id ? { ...t, estado: 'disponible', bateria: datos.bateriaFin } : t
          ),
          cuentas: {
            pedro: {
              ...cuentas.pedro,
              gananciaAcumulada: redondear(cuentas.pedro.gananciaAcumulada + repartoPedro),
            },
            juan: {
              ...cuentas.juan,
              gananciaAcumulada: redondear(cuentas.juan.gananciaAcumulada + repartoJuan),
            },
          },
        }));
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

      registrarRetiro: ({ socioId, monto, nota }) => {
        const { cuentas, config } = get();
        if (!(monto > 0)) return fallo('El monto debe ser mayor que cero.');
        const saldo = saldoDisponible(cuentas[socioId]);
        if (monto > saldo) {
          return fallo(`Saldo insuficiente. Disponible: ${formatMonto(saldo, config.moneda)}.`);
        }
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
            [socioId]: {
              ...s.cuentas[socioId],
              retiros: redondear(s.cuentas[socioId].retiros + retiro.monto),
            },
          },
        }));
        return exito(retiro);
      },

      actualizarConfig: (datos) => {
        const moneda = datos.moneda.trim();
        if (!moneda) return fallo('Escribe la moneda.');
        if (!(datos.porcentajeRepartoAlquiler >= 0 && datos.porcentajeRepartoAlquiler <= 100)) {
          return fallo('El porcentaje debe estar entre 0 y 100.');
        }
        set({ config: { moneda, porcentajeRepartoAlquiler: datos.porcentajeRepartoAlquiler } });
        return exito(null);
      },
    }),
    { name: 'metaltrike-manager', version: 1 }
  )
);
