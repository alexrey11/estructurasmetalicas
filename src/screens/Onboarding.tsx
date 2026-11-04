import { useState, type FormEvent } from 'react';
import { ArrowRight, Building2, UserCircle2 } from 'lucide-react';
import Boton from '@/components/ui/Boton';
import Campo, { claseInput } from '@/components/ui/Campo';
import Card from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/store/useStore';

export default function Onboarding() {
    const { socios, actualizarSocio, actualizarConfig } = useStore();
    const { mostrar } = useToast();

    const [nombreNegocio, setNombreNegocio] = useState('');
    const [moneda, setMoneda] = useState('CUP');

    // Tomamos los dos primeros socios semilla para configurarlos
    const [nombre1, setNombre1] = useState('');
    const [pin1, setPin1] = useState('1234');

    const [nombre2, setNombre2] = useState('');
    const [pin2, setPin2] = useState('1234');

    const [error, setError] = useState('');

    const enviar = (evento: FormEvent) => {
        evento.preventDefault();

        if (!nombreNegocio.trim()) return setError('Escribe el nombre de tu negocio.');
        if (!nombre1.trim() || !nombre2.trim()) return setError('Escribe el nombre de ambos socios.');
        if (pin1.length !== 4 || pin2.length !== 4) return setError('Los PIN deben ser de 4 dígitos.');
        if (pin1 === pin2) return setError('Los PIN de los socios no pueden ser iguales.');

        // Actualizar configuración general
        const resConfig = actualizarConfig({ nombreNegocio, moneda });
        if (!resConfig.ok) return setError(resConfig.error);

        // Actualizar Socio 1
        const resSocio1 = actualizarSocio(socios[0].id, { nombre: nombre1, pin: pin1 });
        if (!resSocio1.ok) return setError(resSocio1.error);

        // Actualizar Socio 2
        const resSocio2 = actualizarSocio(socios[1].id, { nombre: nombre2, pin: pin2 });
        if (!resSocio2.ok) return setError(resSocio2.error);

        mostrar('¡Todo listo! Bienvenido a MetalTrike.');
    };

    return (
        <div className="grid min-h-screen place-items-center bg-lienzo px-4 py-10">
            <div className="w-full max-w-md animate-subir space-y-6">
                <div className="text-center">
                    <img src="/logo.png" alt="Logo" className="mx-auto size-24 rounded-2xl bg-white p-2 shadow-lg object-contain" />
                    <h1 className="mt-4 text-2xl font-bold text-slate-900">Bienvenido a MetalTrike</h1>
                    <p className="mt-1 text-sm text-slate-600">Configura tu negocio para empezar a trabajar.</p>
                </div>

                <Card className="space-y-6 p-6">
                    <form onSubmit={enviar} className="space-y-5">
                        {/* Sección: Negocio */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-emerald-700">
                                <Building2 size={20} />
                                <h2 className="font-semibold">Tu Negocio</h2>
                            </div>
                            <Campo etiqueta="Nombre del negocio">
                                <input
                                    className={claseInput}
                                    value={nombreNegocio}
                                    onChange={(e) => setNombreNegocio(e.target.value)}
                                    placeholder="Ej: Estructuras Metálicas El Rey"
                                />
                            </Campo>
                            <Campo etiqueta="Moneda">
                                <input
                                    className={claseInput}
                                    value={moneda}
                                    maxLength={5}
                                    onChange={(e) => setMoneda(e.target.value.toUpperCase())}
                                    placeholder="Ej: CUP, USD, MLC"
                                />
                            </Campo>
                        </div>

                        <hr className="border-slate-200" />

                        {/* Sección: Socios */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-emerald-700">
                                <UserCircle2 size={20} />
                                <h2 className="font-semibold">Los Socios</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Campo etiqueta="Nombre Socio 1">
                                    <input className={claseInput} value={nombre1} onChange={(e) => setNombre1(e.target.value)} placeholder="Ej: Pedro" />
                                </Campo>
                                <Campo etiqueta="PIN (4 dígitos)">
                                    <input className={claseInput} inputMode="numeric" maxLength={4} value={pin1} onChange={(e) => setPin1(e.target.value.replace(/\D/g, ''))} />
                                </Campo>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Campo etiqueta="Nombre Socio 2">
                                    <input className={claseInput} value={nombre2} onChange={(e) => setNombre2(e.target.value)} placeholder="Ej: Juan" />
                                </Campo>
                                <Campo etiqueta="PIN (4 dígitos)">
                                    <input className={claseInput} inputMode="numeric" maxLength={4} value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, ''))} />
                                </Campo>
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-600">{error}</p>}

                        <Boton type="submit" bloque className="min-h-14 text-lg">
                            Comenzar <ArrowRight size={20} />
                        </Boton>
                    </form>
                </Card>
            </div>
        </div>
    );
}