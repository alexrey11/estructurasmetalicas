import type { ReactNode } from 'react';
import { Bike, Home, LogOut, PieChart, ShoppingCart, type LucideIcon } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useNombreSocio } from '@/hooks/useSocios';
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
  const nombreNegocio = useStore((s) => s.config.nombreNegocio);
  const nombre = useNombreSocio(sesion);

  return (
    <div className="min-h-screen bg-lienzo">
      <header className="sticky top-0 z-30 bg-header text-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/logo.svg" alt="" className="size-10 shrink-0 rounded-xl" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{nombreNegocio}</p>
              <p className="truncate text-xs text-slate-300">{nombre}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={cerrarSesion}
            aria-label="Salir"
            className="grid size-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
          >
            <LogOut size={18} />
          </button>
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
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold transition ${activo ? 'bg-emerald-50 text-emerald-800' : 'text-slate-500 hover:text-slate-800'
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