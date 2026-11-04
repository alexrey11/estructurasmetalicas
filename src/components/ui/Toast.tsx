import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from 'lucide-react';

export type TipoToast = 'exito' | 'error' | 'aviso' | 'info';

type ItemToast = { id: number; mensaje: string; tipo: TipoToast };

type ContextoToast = { mostrar: (mensaje: string, tipo?: TipoToast) => void };

const ToastContext = createContext<ContextoToast | null>(null);

const ESTILOS: Record<TipoToast, { clase: string; Icono: LucideIcon }> = {
  exito: { clase: 'border-emerald-600 bg-emerald-50 text-emerald-900', Icono: CheckCircle2 },
  error: { clase: 'border-red-600 bg-red-50 text-red-900', Icono: XCircle },
  aviso: { clase: 'border-amber-500 bg-amber-50 text-amber-900', Icono: AlertTriangle },
  info: { clase: 'border-slate-500 bg-white text-slate-900', Icono: Info },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemToast[]>([]);
  const siguienteId = useRef(0);

  const cerrar = useCallback((id: number) => setItems((previos) => previos.filter((t) => t.id !== id)), []);

  const mostrar = useCallback(
    (mensaje: string, tipo: TipoToast = 'exito') => {
      siguienteId.current += 1;
      const id = siguienteId.current;
      setItems((previos) => [...previos, { id, mensaje, tipo }]);
      window.setTimeout(() => cerrar(id), 4000);
    },
    [cerrar]
  );

  const valor = useMemo(() => ({ mostrar }), [mostrar]);

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4 sm:left-auto sm:right-4 sm:items-end"
      >
        {items.map((item) => {
          const { clase, Icono } = ESTILOS[item.tipo];
          return (
            <div
              key={item.id}
              role="status"
              className={`pointer-events-auto flex w-full max-w-sm animate-subir items-start gap-3 rounded-xl border-l-4 px-4 py-3 shadow-lg ${clase}`}
            >
              <Icono size={20} className="mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{item.mensaje}</p>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ContextoToast {
  const contexto = useContext(ToastContext);
  if (!contexto) throw new Error('useToast debe usarse dentro de ToastProvider');
  return contexto;
}
