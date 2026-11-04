import { useShallow } from 'zustand/react/shallow';
import { useState, type FormEvent } from 'react';
import { Play } from 'lucide-react';
import Boton from '@/components/ui/Boton';
import Campo, { claseInput } from '@/components/ui/Campo';
import EstadoVacio from '@/components/ui/EstadoVacio';
import { useToast } from '@/components/ui/Toast';
import { Bike } from 'lucide-react';
import { useStore } from '@/store/useStore';

type Props = { onGuardado: () => void };

export default function NuevoAlquilerForm({ onGuardado }: Props) {
  const { triciclos, iniciarAlquiler } = useStore(useShallow((s) => ({
    triciclos: s.triciclos,
    iniciarAlquiler: s.iniciarAlquiler,
  })));
  const { mostrar } = useToast();
  const disponibles = triciclos.filter((t) => t.estado === 'disponible');
  const [tricicloId, setTricicloId] = useState(disponibles[0]?.id ?? '');
  const [cliente, setCliente] = useState('');
  const [bateriaInicio, setBateriaInicio] = useState('100');
  const [minutos, setMinutos] = useState('30');
  const [error, setError] = useState('');

  if (disponibles.length === 0) {
    return (
      <EstadoVacio
        Icono={Bike}
        titulo="No hay triciclos disponibles"
        texto="Todos están alquilados o en mantenimiento."
      />
    );
  }

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    const resultado = iniciarAlquiler({
      tricicloId,
      cliente,
      bateriaInicio: Number(bateriaInicio),
      minutosContratados: Number(minutos),
    });
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    mostrar('Alquiler iniciado. El cronómetro está corriendo.');
    onGuardado();
  };

  return (
    <form onSubmit={enviar} className="space-y-4">
      <Campo etiqueta="Triciclo">
        <select className={claseInput} value={tricicloId} onChange={(e) => setTricicloId(e.target.value)}>
          {disponibles.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre} (batería {t.bateria} %)
            </option>
          ))}
        </select>
      </Campo>
      <Campo etiqueta="Cliente">
        <input className={claseInput} value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Nombre del cliente" />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Batería inicial (%)">
          <input type="number" inputMode="numeric" min="0" max="100" className={claseInput} value={bateriaInicio} onChange={(e) => setBateriaInicio(e.target.value)} />
        </Campo>
        <Campo etiqueta="Tiempo contratado (min)" ayuda="Avisamos 1 min antes">
          <input type="number" inputMode="numeric" min="1" className={claseInput} value={minutos} onChange={(e) => setMinutos(e.target.value)} />
        </Campo>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Boton type="submit" bloque className="min-h-14 text-lg">
        <Play size={18} /> Iniciar alquiler
      </Boton>
    </form>
  );
}
