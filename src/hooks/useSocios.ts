import { useStore } from '@/store/useStore';
import { nombreSocio } from '@/lib/utils';
import type { SocioId } from '@/lib/types';

export function useSocios() {
    return useStore((s) => s.socios);
}

export function useNombreSocio(id: SocioId): string {
    const socios = useStore((s) => s.socios);
    return nombreSocio(id, socios);
}