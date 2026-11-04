import { useState } from 'react';
import { Settings } from 'lucide-react';
import Boton from '@/components/ui/Boton';
import Campo, { claseInput } from '@/components/ui/Campo';
import Card from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/store/useStore';

export default function ConfigPanel() {
  const config = useStore((s) => s.config);
  const actualizarConfig = useStore((s) => s.actualizarConfig);
  const { mostrar } = useToast();
  const [moneda, setMoneda] = useState(config.moneda);
  const [pctPedro, setPctPedro] = useState(config.porcentajeRepartoAlquiler);
  const [error, setError] = useState('');
  const pctJuan = 100 - pctPedro;
  const cambiado = moneda !== config.moneda || pctPedro !== config.porcentajeRepartoAlquiler;

  const guardar = () => {
    const resultado = actualizarConfig({ moneda, porcentajeRepartoAlquiler: pctPedro });
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    setError('');
    mostrar('Configuración guardada.');
  };

  return (
    <Card className="space-y-5">
      <div className="flex items-center gap-2">
        <Settings size={20} className="text-slate-700" />
        <h2 className="text-lg font-semibold text-slate-900">Configuración</h2>
      </div>

      <Campo etiqueta="Moneda" ayuda="Se muestra junto a todos los montos">
        <input className={claseInput} value={moneda} maxLength={10} onChange={(e) => setMoneda(e.target.value)} />
      </Campo>

      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-700">Reparto de alquileres</p>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={pctPedro}
          onChange={(e) => setPctPedro(Number(e.target.value))}
          aria-label="Porcentaje de Pedro en alquileres"
          className="w-full accent-emerald-700"
        />
        <div className="grid grid-cols-3 items-center gap-3 text-center text-sm">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Pedro</p>
            <p className="text-lg font-bold tabular-nums">{pctPedro} %</p>
          </div>
          <p className="text-xs text-slate-500">Suma: {pctPedro + pctJuan} %</p>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Juan</p>
            <p className="text-lg font-bold tabular-nums">{pctJuan} %</p>
          </div>
        </div>
        <p className="text-xs text-slate-500">Los cambios afectan solo a los alquileres que se finalicen de ahora en adelante.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Boton bloque onClick={guardar} disabled={!cambiado}>
        Guardar configuración
      </Boton>
    </Card>
  );
}
