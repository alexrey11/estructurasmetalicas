import { useState, type FormEvent } from 'react';
import { Bike, Lock } from 'lucide-react';
import Boton from '@/components/ui/Boton';
import Card from '@/components/ui/Card';
import { claseInput } from '@/components/ui/Campo';
import { SOCIOS } from '@/lib/seed';
import type { SocioId } from '@/lib/types';
import { useStore } from '@/store/useStore';

export default function Login() {
  const login = useStore((s) => s.login);
  const [socioSeleccionado, setSocioSeleccionado] = useState<SocioId>('pedro');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    const socio = SOCIOS.find((s) => s.id === socioSeleccionado);
    if (!socio || socio.pin !== pin) {
      setError('PIN incorrecto. Intenta de nuevo.');
      setPin('');
      return;
    }
    login(socio.id);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-lienzo px-4 py-10">
      <div className="w-full max-w-sm animate-subir space-y-6">
        <div className="text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-header text-emerald-300 shadow-lg">
            <Bike size={32} />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">MetalTrike Manager</h1>
          <p className="mt-1 text-sm text-slate-600">Inventario, ventas, alquileres y reparto entre socios</p>
        </div>

        <Card className="space-y-6 p-6">
          <div>
            <p className="mb-3 text-sm font-medium text-slate-700">¿Quién eres?</p>
            <div className="grid grid-cols-2 gap-3">
              {SOCIOS.map((socio) => {
                const activo = socio.id === socioSeleccionado;
                return (
                  <button
                    key={socio.id}
                    type="button"
                    onClick={() => setSocioSeleccionado(socio.id)}
                    aria-pressed={activo}
                    className={`min-h-14 rounded-xl border-2 px-4 py-3 text-base font-semibold transition ${
                      activo
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {socio.nombre}
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={enviar} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">PIN</span>
              <div className="relative">
                <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/\D/g, ''));
                    setError('');
                  }}
                  className={`${claseInput} pl-11 tracking-[0.4em]`}
                  placeholder="••••"
                />
              </div>
              {error ? (
                <span className="block text-sm text-red-600">{error}</span>
              ) : (
                <span className="block text-xs text-slate-500">PIN de demostración: 1234</span>
              )}
            </label>
            <Boton type="submit" bloque disabled={pin.length !== 4}>
              Entrar
            </Boton>
          </form>
        </Card>
      </div>
    </div>
  );
}
