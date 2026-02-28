import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.pritraining.app',
    appName: 'PSI Training',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    }
};

export default config;
