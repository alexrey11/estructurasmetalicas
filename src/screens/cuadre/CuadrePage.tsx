import { useShallow } from 'zustand/react/shallow';
import { useState } from 'react';
import { Info } from 'lucide-react';
import Boton from '@/components/ui/Boton';
import Card from '@/components/ui/Card';
import {
  calcularPorcentajes, gananciaVentasSocio, inversionAcumulada, saldoDisponible,
} from '@/lib/calculos';
import { formatMonto, formatPorcentaje } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import TablaSocios, { type FilaSocio } from '@/screens/cuadre/TablaSocios';
import RetirosPanel from '@/screens/cuadre/RetirosPanel';
import ConfigPanel from '@/screens/cuadre/ConfigPanel';
import SociosPanel from '@/screens/cuadre/SociosPanel';
import BackupPanel from '@/screens/cuadre/BackupPanel';
import EjemploRepartoModal from '@/screens/cuadre/EjemploRepartoModal';

export default function CuadrePage() {
  const { cuentas, ventas, alquileres, compras, config, socios } = useStore(
    useShallow((s) => ({
      cuentas: s.cuentas, ventas: s.ventas, alquileres: s.alquileres,
      compras: s.compras, config: s.config, socios: s.socios,
    }))
  );
  const [ejemploAbierto, setEjemploAbierto] = useState(false);
  const moneda = config.moneda;

  const capitales = Object.fromEntries(socios.map((s) => [s.id, cuentas[s.id]?.capital ?? 0]));
  const porcentajes = calcularPorcentajes(capitales);

  const brutasVentas = ventas.reduce((suma, v) => suma + v.total, 0);
  const gananciaBrutaVentas = ventas.reduce((suma, v) => suma + v.gananciaBruta, 0);
  const ingresosAlquiler = alquileres.reduce((suma, a) => suma + (a.estado === 'finalizado' ? a.monto ?? 0 : 0), 0);
  const gananciaNeta = gananciaBrutaVentas + ingresosAlquiler;

  const filas: FilaSocio[] = socios.map((socio) => {
    const cuenta = cuentas[socio.id] ?? { capital: 0, gananciaAcumulada: 0, retiros: 0 };
    const porVentas = gananciaVentasSocio(ventas, socio.id);
    return {
      socio, capital: cuenta.capital, porVentas,
      porAlquiler: cuenta.gananciaAcumulada - porVentas,
      retiros: cuenta.retiros, saldo: saldoDisponible(cuenta),
      porcentaje: porcentajes[socio.id] ?? 0,
    };
  });

  const resumen = [
    { etiqueta: 'Inversión acumulada', valor: formatMonto(inversionAcumulada(compras), moneda) },
    { etiqueta: 'Ventas brutas', valor: formatMonto(brutasVentas, moneda) },
    { etiqueta: 'Ganancia bruta ventas', valor: formatMonto(gananciaBrutaVentas, moneda) },
    { etiqueta: 'Ingresos alquiler', valor: formatMonto(ingresosAlquiler, moneda) },
    { etiqueta: 'Ganancia neta repartible', valor: formatMonto(gananciaNeta, moneda), destacado: true },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Cuadre de socios</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {resumen.map((item) => (
          <Card key={item.etiqueta} className={`p-4 ${item.destacado ? 'border-emerald-600 bg-emerald-50' : ''}`}>
            <p className="text-xs text-slate-600">{item.etiqueta}</p>
            <p className={`mt-1 text-base font-bold tabular-nums ${item.destacado ? 'text-emerald-800' : 'text-slate-900'}`}>
              {item.valor}
            </p>
          </Card>
        ))}
      </div>

      <TablaSocios filas={filas} moneda={moneda} />

      <Card className="space-y-4">
        <div className="flex items-start gap-3">
          <Info size={20} className="mt-0.5 shrink-0 text-emerald-700" />
          <div className="space-y-2 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Cómo se reparte cada venta</p>
            <p>La ganancia de cada venta se reparte según el capital de cada socio en el momento de la venta.</p>
            <div className="flex flex-wrap gap-2">
              {socios.map((s) => (
                <span key={s.id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                  <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.nombre}: {formatPorcentaje(porcentajes[s.id] ?? 0)}
                </span>
              ))}
            </div>
          </div>
        </div>
        <Boton variante="secundaria" onClick={() => setEjemploAbierto(true)}>Ver ejemplo de reparto</Boton>
      </Card>

      <SociosPanel />

      <div className="grid gap-6 lg:grid-cols-2">
        <RetirosPanel />
        <ConfigPanel />
      </div>

      <BackupPanel />

      <EjemploRepartoModal abierto={ejemploAbierto} onCerrar={() => setEjemploAbierto(false)} />
    </div>
  );
}