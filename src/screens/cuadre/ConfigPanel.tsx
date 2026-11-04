import { useShallow } from 'zustand/react/shallow';
import { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import Boton from '@/components/ui/Boton';
import Campo, { claseInput } from '@/components/ui/Campo';
import Card from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/store/useStore';

export default function ConfigPanel() {
  const { config, actualizarConfig, socios } = useStore(
    useShallow((s) => ({ config: s.config, actualizarConfig: s.actualizarConfig, socios: s.socios }))
  );
  const { mostrar } = useToast();
  const [moneda, setMoneda] = useState(config.moneda);
  const [nombreNegocio, setNombreNegocio] = useState(config.nombreNegocio);
  const [reparto, setReparto] = useState<Record<string, number>>(config.repartoAlquiler);
  const [error, setError] = useState('');

  useEffect(() => { setReparto(config.repartoAlquiler); }, [config.repartoAlquiler]);

  const suma = Object.values(reparto).reduce((a, b) => a + b, 0);
  const cambiado = moneda !== config.moneda || nombreNegocio !== config.nombreNegocio ||
    JSON.stringify(reparto) !== JSON.stringify(config.repartoAlquiler);

  const repartirIgual = () => {
    const pct = 100 / socios.length;
    setReparto(Object.fromEntries(socios.map((s) => [s.id, pct])));
  };

  const guardar = () => {
    const r = actualizarConfig({ moneda, nombreNegocio, repartoAlquiler: reparto });
    if (!r.ok) { setError(r.error); return; }
    setError('');
    mostrar('Configuración guardada.');
  };

  return (
    <Card className="space-y-5">
      <div className="flex items-center gap-2">
        <Settings size={20} className="text-slate-700" />
        <h2 className="text-lg font-semibold text-slate-900">Configuración</h2>
      </div>

      <Campo etiqueta="Nombre del negocio">
        <input className={claseInput} value={nombreNegocio} maxLength={40} onChange={(e) => setNombreNegocio(e.target.value)} />
      </Campo>

      <Campo etiqueta="Moneda" ayuda="Se muestra junto a todos los montos">
        <input className={claseInput} value={moneda} maxLength={10} onChange={(e) => setMoneda(e.target.value)} />
      </Campo>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">Reparto de alquileres (%)</p>
          <button type="button" onClick={repartirIgual} className="text-xs font-semibold text-emerald-700 hover:underline">
            Repartir igual
          </button>
        </div>
        <div className="space-y-2">
          {socios.map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="flex-1 text-sm text-slate-700">{s.nombre}</span>
              <input type="number" min={0} max={100} step={1}
                value={Math.round(reparto[s.id] ?? 0)}
                onChange={(e) => setReparto({ ...reparto, [s.id]: Number(e.target.value) })}
                className={`${claseInput} w-24 text-right`} />
              <span className="text-sm text-slate-500">%</span>
            </div>
          ))}
        </div>
        <p className={`text-xs ${Math.abs(suma - 100) < 0.5 ? 'text-slate-500' : 'text-red-600'}`}>
          Suma: {suma.toFixed(1)} % {Math.abs(suma - 100) >= 0.5 && '(debe ser 100)'}
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Boton bloque onClick={guardar} disabled={!cambiado}>Guardar configuración</Boton>
    </Card>
  );
}