import { useShallow } from 'zustand/react/shallow';
import { useState, type FormEvent } from 'react';
import { Plus, Wallet } from 'lucide-react';
import Boton from '@/components/ui/Boton';
import Campo, { claseInput } from '@/components/ui/Campo';
import Card from '@/components/ui/Card';
import EstadoVacio from '@/components/ui/EstadoVacio';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { saldoDisponible } from '@/lib/calculos';
import type { SocioId } from '@/lib/types';
import { formatFecha, formatMonto, nombreSocio } from '@/lib/utils';
import { useStore } from '@/store/useStore';

export default function RetirosPanel() {
  const { retiros, moneda, socios } = useStore(
    useShallow((s) => ({ retiros: s.retiros, moneda: s.config.moneda, socios: s.socios }))
  );
  const [abierto, setAbierto] = useState(false);
  const ordenados = [...retiros].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Retiros</h2>
        <Boton onClick={() => setAbierto(true)} className="min-h-11"><Plus size={18} /> Registrar</Boton>
      </div>

      {ordenados.length === 0 ? (
        <EstadoVacio Icono={Wallet} titulo="Sin retiros" texto="Los retiros de cada socio aparecerán aquí." />
      ) : (
        <ul className="divide-y divide-slate-100">
          {ordenados.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{nombreSocio(r.socioId, socios)}</p>
                <p className="truncate text-xs text-slate-500">
                  {formatFecha(r.fecha)}{r.nota ? ` · ${r.nota}` : ''}
                </p>
              </div>
              <p className="shrink-0 font-semibold tabular-nums text-red-600">-{formatMonto(r.monto, moneda)}</p>
            </li>
          ))}
        </ul>
      )}

      <Modal abierto={abierto} onCerrar={() => setAbierto(false)} titulo="Registrar retiro">
        {abierto && <RetiroForm onGuardado={() => setAbierto(false)} />}
      </Modal>
    </Card>
  );
}

function RetiroForm({ onGuardado }: { onGuardado: () => void }) {
  const { cuentas, sesion, moneda, registrarRetiro, socios } = useStore(
    useShallow((s) => ({
      cuentas: s.cuentas, sesion: s.sesion, moneda: s.config.moneda,
      registrarRetiro: s.registrarRetiro, socios: s.socios,
    }))
  );
  const { mostrar } = useToast();
  const [socioId, setSocioId] = useState<SocioId>(sesion ?? socios[0]?.id ?? '');
  const [monto, setMonto] = useState('');
  const [nota, setNota] = useState('');
  const [error, setError] = useState('');
  const cuenta = cuentas[socioId] ?? { capital: 0, gananciaAcumulada: 0, retiros: 0 };
  const saldo = saldoDisponible(cuenta);

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    const resultado = registrarRetiro({ socioId, monto: Number(monto), nota });
    if (!resultado.ok) { setError(resultado.error); return; }
    mostrar('Retiro registrado.');
    onGuardado();
  };

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {socios.map((socio) => (
          <button key={socio.id} type="button" aria-pressed={socioId === socio.id}
            onClick={() => setSocioId(socio.id)}
            className={`min-h-12 rounded-xl border-2 text-sm font-semibold transition ${socioId === socio.id ? 'text-white' : 'border-slate-200 text-slate-700'
              }`}
            style={socioId === socio.id ? { borderColor: socio.color, backgroundColor: socio.color } : undefined}>
            {socio.nombre}
          </button>
        ))}
      </div>
      <p className="text-sm text-slate-600">
        Saldo disponible: <span className="font-semibold text-emerald-700">{formatMonto(saldo, moneda)}</span>
      </p>
      <Campo etiqueta="Monto">
        <input type="number" inputMode="decimal" min="0" step="0.01" className={claseInput} value={monto} onChange={(e) => setMonto(e.target.value)} />
      </Campo>
      <Campo etiqueta="Nota (opcional)">
        <input className={claseInput} value={nota} onChange={(e) => setNota(e.target.value)} />
      </Campo>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Boton type="submit" bloque>Registrar retiro</Boton>
    </form>
  );
}