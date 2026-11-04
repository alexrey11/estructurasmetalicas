import type { ButtonHTMLAttributes } from 'react';

type Variante = 'primaria' | 'secundaria' | 'peligro' | 'fantasma';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; bloque?: boolean };

const VARIANTES: Record<Variante, string> = {
  primaria: 'bg-emerald-700 text-white shadow-sm hover:bg-emerald-800',
  secundaria: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
  peligro: 'bg-red-600 text-white hover:bg-red-700',
  fantasma: 'text-slate-700 hover:bg-slate-100',
};

export default function Boton({ variante = 'primaria', bloque = false, className = '', type = 'button', ...props }: Props) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTES[variante]} ${bloque ? 'w-full' : ''} ${className}`}
      {...props}
    />
  );
}
