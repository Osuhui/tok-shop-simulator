import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tokshop.simulator',
  appName: 'TokShop',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'automatic',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#070b14',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#070b14',
      overlaysWebView: false,
    },
  },
};

export default config;
