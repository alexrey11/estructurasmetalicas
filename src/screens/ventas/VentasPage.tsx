import { useState } from 'react';
import HistorialTab from '@/screens/ventas/HistorialTab';
import InventarioTab from '@/screens/ventas/InventarioTab';
import ComprasTab from '@/screens/ventas/ComprasTab';
import VenderTab from '@/screens/ventas/VenderTab';

type SubTab = 'vender' | 'inventario' | 'compras' | 'historial';

const SUBTABS: { id: SubTab; etiqueta: string }[] = [
  { id: 'vender', etiqueta: 'Vender' },
  { id: 'inventario', etiqueta: 'Inventario' },
  { id: 'compras', etiqueta: 'Compras' },
  { id: 'historial', etiqueta: 'Historial' },
];

export default function VentasPage() {
  const [subTab, setSubTab] = useState<SubTab>('vender');

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Ventas</h1>

      <div role="tablist" className="flex gap-1 overflow-x-auto rounded-xl bg-slate-200/70 p-1">
        {SUBTABS.map(({ id, etiqueta }) => {
          const activo = id === subTab;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activo}
              onClick={() => setSubTab(id)}
              className={`min-h-11 flex-1 whitespace-nowrap rounded-lg px-4 text-sm font-semibold transition ${
                activo ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {etiqueta}
            </button>
          );
        })}
      </div>

      {subTab === 'vender' && <VenderTab />}
      {subTab === 'inventario' && <InventarioTab />}
      {subTab === 'compras' && <ComprasTab />}
      {subTab === 'historial' && <HistorialTab />}
    </div>
  );
}
