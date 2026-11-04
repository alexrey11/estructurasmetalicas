import { useShallow } from 'zustand/react/shallow';
import { useState, type FormEvent } from 'react';
import { Play } from 'lucide-react';
import Boton from '@/components/ui/Boton';
import Campo, { claseInput } from '@/components/ui/Campo';
import EstadoVacio from '@/components/ui/EstadoVacio';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/store/useStore';
import TricicloIcon from '@/components/TricicloIcon';
import { formatMonto } from '@/lib/utils';

type Props = { onGuardado: () => void };

export default function NuevoAlquilerForm({ onGuardado }: Props) {
  const { triciclos, iniciarAlquiler, moneda } = useStore(
    useShallow((s) => ({
      triciclos: s.triciclos,
      iniciarAlquiler: s.iniciarAlquiler,
      moneda: s.config.moneda,
    }))
  );
  const { mostrar } = useToast();
  const disponibles = triciclos.filter((t) => t.estado === 'disponible');
  const [tricicloId, setTricicloId] = useState(disponibles[0]?.id ?? '');
  const [cliente, setCliente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [carnet, setCarnet] = useState('');
  const [monto, setMonto] = useState(String(disponibles[0]?.precioAlquiler ?? ''));
  const [error, setError] = useState('');

  if (disponibles.length === 0) {
    return (
      <EstadoVacio
        Icono={TricicloIcon as any}
        titulo="No hay triciclos disponibles"
        texto="Todos están alquilados o en carga."
      />
    );
  }

  const elegirTriciclo = (id: string) => {
    setTricicloId(id);
    const t = disponibles.find((x) => x.id === id);
    if (t) setMonto(String(t.precioAlquiler));
  };

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    const resultado = iniciarAlquiler({
      tricicloId,
      cliente,
      telefono,
      carnet,
      montoPactado: Number(monto),
    });
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    mostrar('Alquiler iniciado. Los datos del cliente quedaron guardados.');
    onGuardado();
  };

  return (
    <form onSubmit={enviar} className="space-y-4">
      <Campo etiqueta="Triciclo">
        <select className={claseInput} value={tricicloId} onChange={(e) => elegirTriciclo(e.target.value)}>
          {disponibles.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre} — {formatMonto(t.precioAlquiler, moneda)} sugerido
            </option>
          ))}
        </select>
      </Campo>

      <Campo etiqueta="Nombre del cliente">
        <input className={claseInput} value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Ej: Carlos Pérez" />
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Teléfono">
          <input className={claseInput} inputMode="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej: 5555-1234" />
        </Campo>
        <Campo etiqueta="Carnet de identidad">
          <input className={claseInput} value={carnet} onChange={(e) => setCarnet(e.target.value)} placeholder="Ej: 85010112345" />
        </Campo>
      </div>

      <Campo etiqueta="Monto pactado" ayuda="Puedes ajustarlo si cobras diferente al precio sugerido">
        <input type="number" inputMode="decimal" min="1" step="0.01" className={claseInput} value={monto} onChange={(e) => setMonto(e.target.value)} />
      </Campo>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Boton type="submit" bloque className="min-h-14 text-lg">
        <Play size={18} /> Iniciar alquiler
      </Boton>
    </form>
  );
}