import type { ReactNode } from 'react';

export const claseInput =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20';

type Props = { etiqueta: string; children: ReactNode; ayuda?: string; error?: string };

export default function Campo({ etiqueta, children, ayuda, error }: Props) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{etiqueta}</span>
      {children}
      {error ? (
        <span className="block text-sm text-red-600">{error}</span>
      ) : ayuda ? (
        <span className="block text-xs text-slate-500">{ayuda}</span>
      ) : null}
    </label>
  );
}
