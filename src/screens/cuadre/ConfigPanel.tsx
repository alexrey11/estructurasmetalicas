import { useShallow } from 'zustand/react/shallow';
import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Settings, Trash2, Pencil } from 'lucide-react';
import Boton from '@/components/ui/Boton';
import Campo, { claseInput } from '@/components/ui/Campo';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import type { Moneda } from '@/lib/types';
import { useStore } from '@/store/useStore';

export default function ConfigPanel() {
  const { config, actualizarConfig, socios, agregarMoneda, actualizarMoneda, eliminarMoneda } = useStore(
    useShallow((s) => ({
      config: s.config,
      actualizarConfig: s.actualizarConfig,
      socios: s.socios,
      agregarMoneda: s.agregarMoneda,
      actualizarMoneda: s.actualizarMoneda,
      eliminarMoneda: s.eliminarMoneda,
    }))
  );
  const { mostrar } = useToast();
  const [moneda, setMoneda] = useState(config.moneda);
  const [nombreNegocio, setNombreNegocio] = useState(config.nombreNegocio);
  const [reparto, setReparto] = useState<Record<string, number>>(config.repartoAlquiler);
  const [error, setError] = useState('');

  const [monedaEditando, setMonedaEditando] = useState<Moneda | 'nueva' | null>(null);

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

  const borrarMoneda = (codigo: string) => {
    if (!window.confirm(`¿Eliminar ${codigo}?`)) return;
    const r = eliminarMoneda(codigo);
    mostrar(r.ok ? 'Moneda eliminada.' : r.error, r.ok ? 'exito' : 'error');
  };

  return (
    <>
      <Card className="space-y-5">
        <div className="flex items-center gap-2">
          <Settings size={20} className="text-slate-700" />
          <h2 className="text-lg font-semibold text-slate-900">Configuración</h2>
        </div>

        <Campo etiqueta="Nombre del negocio">
          <input className={claseInput} value={nombreNegocio} maxLength={40} onChange={(e) => setNombreNegocio(e.target.value)} />
        </Campo>

        <Campo etiqueta="Moneda de la contabilidad" ayuda="La contabilidad se lleva en esta moneda. Las demás son para convertir.">
          <input className={claseInput} value={moneda} maxLength={10} onChange={(e) => setMoneda(e.target.value.toUpperCase())} />
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

      {/* NUEVA SECCIÓN: MONEDAS */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Monedas y tasas</h2>
            <p className="text-xs text-slate-500">1 unidad = X CUP. Edita las tasas cuando cambien en la calle.</p>
          </div>
          <Boton onClick={() => setMonedaEditando('nueva')} className="min-h-11" variante="secundaria">
            <Plus size={18} /> Añadir
          </Boton>
        </div>

        <ul className="divide-y divide-slate-100">
          {config.monedas.map((m) => (
            <li key={m.codigo} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 shrink-0">{m.codigo}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{m.nombre}</p>
                  <p className="truncate text-xs text-slate-500">
                    {m.codigo === 'CUP' ? 'Base del sistema' : `1 ${m.codigo} = ${m.tasaEnBase.toLocaleString('es-ES')} CUP`}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => setMonedaEditando(m)} aria-label={`Editar ${m.codigo}`}
                  className="grid size-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                  <Pencil size={16} />
                </button>
                {m.codigo !== 'CUP' && (
                  <button type="button" onClick={() => borrarMoneda(m.codigo)} aria-label={`Eliminar ${m.codigo}`}
                    className="grid size-10 place-items-center rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Modal
        abierto={monedaEditando !== null}
        onCerrar={() => setMonedaEditando(null)}
        titulo={
          monedaEditando === 'nueva'
            ? 'Nueva moneda'
            : monedaEditando
              ? `Editar ${monedaEditando.codigo}`
              : ''
        }
      >
        {monedaEditando && (
          <FormMoneda
            moneda={monedaEditando === 'nueva' ? undefined : monedaEditando}
            onGuardar={(datos) => {
              const r = monedaEditando === 'nueva'
                ? agregarMoneda(datos)
                : actualizarMoneda((monedaEditando as Moneda).codigo, { nombre: datos.nombre, tasaEnBase: datos.tasaEnBase });
              if (!r.ok) { mostrar(r.error, 'error'); return; }
              mostrar(monedaEditando === 'nueva' ? 'Moneda agregada.' : 'Tasa actualizada.');
              setMonedaEditando(null);
            }}
          />
        )}
      </Modal>
    </>
  );
}

function FormMoneda({ moneda, onGuardar }: { moneda?: Moneda; onGuardar: (datos: { codigo: string; nombre: string; tasaEnBase: number }) => void }) {
  const [codigo, setCodigo] = useState(moneda?.codigo ?? '');
  const [nombre, setNombre] = useState(moneda?.nombre ?? '');
  const [tasa, setTasa] = useState(String(moneda?.tasaEnBase ?? ''));
  const [error, setError] = useState('');
  const esCup = moneda?.codigo === 'CUP';

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!codigo.trim().toUpperCase()) { setError('Escribe el código (ej. USD).'); return; }
    if (!nombre.trim()) { setError('Escribe el nombre.'); return; }
    if (!esCup && !(Number(tasa) > 0)) { setError('La tasa debe ser mayor que cero.'); return; }
    onGuardar({
      codigo: codigo.trim().toUpperCase(),
      nombre: nombre.trim(),
      tasaEnBase: esCup ? 1 : Number(tasa),
    });
  };

  return (
    <form onSubmit={enviar} className="space-y-4">
      <Campo etiqueta="Código" ayuda="Ej: USD, EUR, MLC, ZELLE">
        <input className={claseInput} value={codigo} maxLength={8} disabled={!!moneda}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())} />
      </Campo>
      <Campo etiqueta="Nombre completo">
        <input className={claseInput} value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </Campo>
      <Campo etiqueta="Tasa en CUP" ayuda="¿Cuántos CUP vale 1 unidad de esta moneda?">
        <input type="number" inputMode="decimal" min="0.01" step="0.01" className={claseInput}
          value={esCup ? '1' : tasa} disabled={esCup}
          onChange={(e) => setTasa(e.target.value)} />
      </Campo>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Boton type="submit" bloque>{moneda ? 'Guardar cambios' : 'Crear moneda'}</Boton>
    </form>
  );
}