import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Producto, Resultado, Socio, SocioId, TipoProducto } from '@/lib/types';

const ETIQUETA_TIPO: Record<TipoProducto, string> = { angular: 'Angular', tubo: 'Tubo', otro: '' };

export function nombreProducto(producto: Pick<Producto, 'tipo' | 'nombre'>): string {
  return producto.tipo === 'otro' ? producto.nombre : `${ETIQUETA_TIPO[producto.tipo]} ${producto.nombre}`;
}

export function nombreSocio(id: SocioId, socios: Socio[]): string {
  return socios.find((s) => s.id === id)?.nombre ?? id;
}

export function colorSocio(id: SocioId, socios: Socio[]): string {
  return socios.find((s) => s.id === id)?.color ?? '#64748B';
}

export function formatMonto(valor: number, moneda: string): string {
  const numero = valor.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${moneda} ${numero}`;
}

export function formatPorcentaje(fraccion: number): string {
  return `${(fraccion * 100).toLocaleString('es-ES', { maximumFractionDigits: 1 })} %`;
}

export function formatFecha(iso: string): string {
  return format(new Date(iso), 'dd/MM/yyyy HH:mm', { locale: es });
}

export function formatDiaLargo(fecha: Date): string {
  return format(fecha, "EEEE d 'de' MMMM", { locale: es });
}

export function formatDiaCorto(fecha: Date): string {
  return format(fecha, 'EEE d', { locale: es });
}

const pad = (n: number) => String(n).padStart(2, '0');

export function formatDuracion(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function newId(prefijo: string): string {
  return `${prefijo}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function exito<T>(data: T): Resultado<T> {
  return { ok: true, data };
}

export function fallo(error: string): Resultado<never> {
  return { ok: false, error };
}