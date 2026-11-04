import { useShallow } from 'zustand/react/shallow';
import { useMemo, useState } from 'react';
import { ClipboardCopy, Receipt } from 'lucide-react';
import Boton from '@/components/ui/Boton';
import Card from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { resumenDia } from '@/lib/calculos';
import { formatDiaLargo, formatMonto } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { format } from 'date-fns';

async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = texto;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const copiado = document.execCommand('copy');
    document.body.removeChild(area);
    return copiado;
  }
}

export default function CierreCaja() {
  const { ventas, alquileres, moneda } = useStore(useShallow((s) => ({
    ventas: s.ventas,
    alquileres: s.alquileres,
    moneda: s.config.moneda,
  })));
  const { mostrar } = useToast();
  const hoy = new Date();
  const resumen = useMemo(() => resumenDia(ventas, alquileres, hoy), [ventas, alquileres]);
  const [copiando, setCopiando] = useState(false);

  const textoWhatsApp = [
    `*Cierre de caja - ${format(hoy, 'dd/MM/yyyy')}*`,
    '',
    `Ventas: ${resumen.ventasCantidad} (${formatMonto(resumen.ventasTotal, moneda)})`,
    `Alquileres: ${resumen.alquilerCantidad} (${formatMonto(resumen.alquilerTotal, moneda)})`,
    '',
    `Efectivo: ${formatMonto(resumen.porMetodo.efectivo, moneda)}`,
    `Transferencia: ${formatMonto(resumen.porMetodo.transferencia, moneda)}`,
    `Crédito (por cobrar): ${formatMonto(resumen.porMetodo.credito, moneda)}`,
    '',
    `Ganancia del día: ${formatMonto(resumen.gananciaDia, moneda)}`,
  ].join('\n');

  const copiar = async () => {
    setCopiando(true);
    const ok = await copiarTexto(textoWhatsApp);
    setCopiando(false);
    mostrar(ok ? 'Resumen copiado. Pégalo en WhatsApp.' : 'No se pudo copiar el resumen.', ok ? 'exito' : 'error');
  };

  const filas = [
    { etiqueta: 'Efectivo', valor: resumen.porMetodo.efectivo },
    { etiqueta: 'Transferencia', valor: resumen.porMetodo.transferencia },
    { etiqueta: 'Crédito (por cobrar)', valor: resumen.porMetodo.credito },
  ];

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Cierre de caja de hoy</h2>
          <p className="text-sm capitalize text-slate-600">{formatDiaLargo(hoy)}</p>
        </div>
        <Boton variante="secundaria" onClick={copiar} disabled={copiando} className="min-h-11">
          <ClipboardCopy size={18} /> Copiar resumen para WhatsApp
        </Boton>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <Dato etiqueta={`Ventas (${resumen.ventasCantidad})`} valor={formatMonto(resumen.ventasTotal, moneda)} />
        <Dato etiqueta={`Alquileres (${resumen.alquilerCantidad})`} valor={formatMonto(resumen.alquilerTotal, moneda)} />
        <Dato etiqueta="Ganancia del día" valor={formatMonto(resumen.gananciaDia, moneda)} color="text-emerald-700" />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Totales por método de pago</caption>
          <tbody className="divide-y divide-slate-100">
            {filas.map((fila) => (
              <tr key={fila.etiqueta}>
                <td className="flex items-center gap-2 px-4 py-3 text-slate-700">
                  <Receipt size={16} className="text-slate-400" /> {fila.etiqueta}
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                  {formatMonto(fila.valor, moneda)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Dato({ etiqueta, valor, color = 'text-slate-900' }: { etiqueta: string; valor: string; color?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{etiqueta}</p>
      <p className={`font-bold tabular-nums ${color}`}>{valor}</p>
    </div>
  );
}
