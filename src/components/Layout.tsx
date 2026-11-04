import type { ReactNode } from 'react';
import { Bike, Home, LogOut, PieChart, ShoppingCart, type LucideIcon } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { nombreSocio } from '@/lib/utils';
import type { SocioId, TabId } from '@/lib/types';

const TABS: { id: TabId; etiqueta: string; Icono: LucideIcon }[] = [
  { id: 'inicio', etiqueta: 'Inicio', Icono: Home },
  { id: 'ventas', etiqueta: 'Ventas', Icono: ShoppingCart },
  { id: 'alquiler', etiqueta: 'Alquiler', Icono: Bike },
  { id: 'cuadre', etiqueta: 'Cuadre', Icono: PieChart },
];

type Props = { tab: TabId; sesion: SocioId; onCambiarTab: (tab: TabId) => void; children: ReactNode };

export default function Layout({ tab, sesion, onCambiarTab, children }: Props) {
  const cerrarSesion = useStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-lienzo">
      <header className="sticky top-0 z-30 bg-header text-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-600/25 text-emerald-300">
              <Bike size={22} />
            </span>
            <p className="truncate text-base font-bold">MetalTrike Manager</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden rounded-full bg-white/10 px-3 py-1 text-sm sm:inline">{nombreSocio(sesion)}</span>
            <button
              type="button"
              onClick={cerrarSesion}
              aria-label="Salir"
              className="grid size-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-4 px-2 py-2">
          {TABS.map(({ id, etiqueta, Icono }) => {
            const activo = id === tab;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onCambiarTab(id)}
                aria-current={activo ? 'page' : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold transition ${
                  activo ? 'bg-emerald-50 text-emerald-800' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icono size={22} />
                {etiqueta}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
