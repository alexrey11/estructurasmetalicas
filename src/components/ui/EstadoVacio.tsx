import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type Props = { Icono: LucideIcon; titulo: string; texto?: string; accion?: ReactNode };

export default function EstadoVacio({ Icono, titulo, texto, accion }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-slate-100 text-slate-500">
        <Icono size={28} />
      </span>
      <p className="text-base font-semibold text-slate-800">{titulo}</p>
      {texto && <p className="max-w-sm text-sm text-slate-600">{texto}</p>}
      {accion}
    </div>
  );
}
