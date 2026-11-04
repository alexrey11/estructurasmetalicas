import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

// Adaptador para Zustand persist.
// Usa Preferences en APK y localStorage en navegador.
export const capacitorStorage = {
    getItem: async (name: string): Promise<string | null> => {
        if (Capacitor.isNativePlatform()) {
            const { value } = await Preferences.get({ key: name });
            return value;
        }
        return localStorage.getItem(name);
    },
    setItem: async (name: string, value: string): Promise<void> => {
        if (Capacitor.isNativePlatform()) {
            await Preferences.set({ key: name, value });
        } else {
            localStorage.setItem(name, value);
        }
    },
    removeItem: async (name: string): Promise<void> => {
        if (Capacitor.isNativePlatform()) {
            await Preferences.remove({ key: name });
        } else {
            localStorage.removeItem(name);
        }
    },
};