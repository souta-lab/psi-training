import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.psitraining.app',
    appName: 'PSI Training',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    }
};

export default config;
