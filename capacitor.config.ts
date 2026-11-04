import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.metaltrike.manager',
  appName: 'MetalTrike',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#1E293B',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;