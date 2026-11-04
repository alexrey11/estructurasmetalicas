// Configuración para Android con Capacitor. Ejecuta `npx cap add android` cuando quieras generar el proyecto nativo.
// La app web se compila en `dist`, que es lo que Capacitor empaqueta.
const config = {
  appId: 'com.metaltrike.manager',
  appName: 'MetalTrike Manager',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
