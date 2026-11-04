import { useState, type FormEvent } from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import Boton from '@/components/ui/Boton';
import Card from '@/components/ui/Card';
import { claseInput } from '@/components/ui/Campo';
import type { Socio, SocioId } from '@/lib/types';
import { useStore } from '@/store/useStore';

type Paso = { tipo: 'elegir' } | { tipo: 'pin'; socio: Socio };

export default function Login() {
  const socios = useStore((s) => s.socios);
  const login = useStore((s) => s.login);
  const [paso, setPaso] = useState<Paso>({ tipo: 'elegir' });
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const enviarPin = (evento: FormEvent) => {
    evento.preventDefault();
    if (paso.tipo !== 'pin') return;
    if (paso.socio.pin !== pin) {
      setError('PIN incorrecto. Intenta de nuevo.');
      setPin('');
      return;
    }
    login(paso.socio.id);
  };

  const volver = () => {
    setPaso({ tipo: 'elegir' });
    setPin('');
    setError('');
  };

  return (
    <div className="grid min-h-screen place-items-center bg-lienzo px-4 py-10">
      <div className="w-full max-w-sm animate-subir space-y-6">
        <div className="text-center">
          <img src="/logo.png" alt="Logo" className="mx-auto size-24 rounded-2xl bg-white p-2 shadow-lg object-contain" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">MetalTrike</h1>
        </div>

        {/* ============ PASO 1: ELEGIR SOCIO ============ */}
        {paso.tipo === 'elegir' && (
          <Card className="space-y-4 p-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-slate-900">¿Quién eres?</h2>
              <p className="mt-1 text-sm text-slate-600">Selecciona tu nombre para entrar</p>
            </div>

            <ul className="space-y-2">
              {socios.map((socio) => (
                <li key={socio.id}>
                  <button
                    type="button"
                    onClick={() => setPaso({ tipo: 'pin', socio })}
                    className="flex min-h-16 w-full items-center gap-3 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]"
                  >
                    <span
                      className="grid size-12 shrink-0 place-items-center rounded-full text-lg font-bold text-white"
                      style={{ backgroundColor: socio.color }}
                    >
                      {socio.nombre.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{socio.nombre}</p>
                      <p className="truncate text-xs text-slate-500">Toca para entrar con tu PIN</p>
                    </div>
                    <span className="text-slate-400">→</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* ============ PASO 2: PEDIR PIN ============ */}
        {paso.tipo === 'pin' && (
          <Card className="space-y-6 p-6">
            <button
              type="button"
              onClick={volver}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              <ArrowLeft size={16} /> Cambiar de socio
            </button>

            <div className="flex items-center gap-3">
              <span
                className="grid size-14 shrink-0 place-items-center rounded-full text-xl font-bold text-white"
                style={{ backgroundColor: paso.socio.color }}
              >
                {paso.socio.nombre.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-sm text-slate-500">Hola de nuevo,</p>
                <p className="truncate text-lg font-bold text-slate-900">{paso.socio.nombre}</p>
              </div>
            </div>

            <form onSubmit={enviarPin} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Ingresa tu PIN de 4 dígitos</span>
                <div className="relative">
                  <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={4}
                    autoFocus
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value.replace(/\D/g, ''));
                      setError('');
                    }}
                    className={`${claseInput} pl-11 text-center text-2xl tracking-[0.6em]`}
                    placeholder="••••"
                  />
                </div>
                {error ? (
                  <span className="block text-sm text-red-600">{error}</span>
                ) : (
                  <span className="block text-xs text-slate-500">
                    PIN por defecto: 1234. Cámbialo en Cuadre → Socios.
                  </span>
                )}
              </label>
              <Boton type="submit" bloque disabled={pin.length !== 4} className="min-h-14 text-lg">
                Entrar
              </Boton>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}