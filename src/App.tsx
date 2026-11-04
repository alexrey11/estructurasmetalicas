import { useState } from 'react';
import Layout from '@/components/Layout';
import { ToastProvider } from '@/components/ui/Toast';
import Login from '@/screens/Login';
import Dashboard from '@/screens/Dashboard';
import VentasPage from '@/screens/ventas/VentasPage';
import AlquilerPage from '@/screens/alquiler/AlquilerPage';
import CuadrePage from '@/screens/cuadre/CuadrePage';
import Onboarding from '@/screens/Onboarding'; // <-- IMPORTAMOS
import type { TabId } from '@/lib/types';
import { useStore } from '@/store/useStore';

type Navegacion = { tab: TabId; accion?: 'nuevo-alquiler' };

export default function App() {
  const sesion = useStore((s) => s.sesion);
  const socios = useStore((s) => s.socios);
  const [navegacion, setNavegacion] = useState<Navegacion>({ tab: 'inicio' });

  // Detectamos si es la primera vez (si el socio 1 se llama "Socio 1")
  const esPrimeraVez = socios.length > 0 && socios[0].nombre === 'Socio 1';

  if (esPrimeraVez) {
    return (
      <ToastProvider>
        <Onboarding />
      </ToastProvider>
    );
  }

  if (!sesion) {
    return (
      <ToastProvider>
        <Login />
      </ToastProvider>
    );
  }

  const navegar = (tab: TabId, accion?: 'nuevo-alquiler') => setNavegacion({ tab, accion });

  const contenido = {
    inicio: <Dashboard onNavegar={navegar} />,
    ventas: <VentasPage />,
    alquiler: <AlquilerPage abrirNuevo={navegacion.accion === 'nuevo-alquiler'} />,
    cuadre: <CuadrePage />,
  }[navegacion.tab];

  return (
    <ToastProvider>
      <Layout tab={navegacion.tab} sesion={sesion} onCambiarTab={(tab) => navegar(tab)}>
        {contenido}
      </Layout>
    </ToastProvider>
  );
}